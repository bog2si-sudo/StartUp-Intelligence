import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { env } from '@/lib/env';
import {
  extractAssessmentVersion,
  mapPaidFields,
  parseTallyPayload,
  verifyTallyRequest,
} from '@/lib/tally';
import { sendEmail } from '@/lib/resend';
import { supabase } from '@/lib/supabase';
import { PROMPT_VERSION, REPORT_VERSION, SCORING_MODEL_VERSION } from '@/lib/versions';

const REPORT_EXPIRY_DAYS = 30;

async function persistProcessingError(params: {
  founderId?: string | null;
  submissionId?: string | null;
  reportId?: string | null;
  errorCode: string;
  message: string;
  payload?: Record<string, unknown>;
}) {
  if (!supabase) {
    return;
  }

  try {
    await supabase.from('processing_errors').insert({
      founder_id: params.founderId ?? null,
      submission_id: params.submissionId ?? null,
      report_id: params.reportId ?? null,
      severity: 'error',
      source: 'tally',
      error_code: params.errorCode,
      message: params.message,
      payload: params.payload ?? {},
    });
  } catch {
    // best-effort; do not propagate
  }
}

export async function POST(req: Request) {
  if (!env.TALLY_WEBHOOK_SECRET_PAID || !supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const body = await req.text();
  let rawPayload: unknown;

  try {
    rawPayload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!verifyTallyRequest(req, env.TALLY_WEBHOOK_SECRET_PAID)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = parseTallyPayload(rawPayload);
  const fields = mapPaidFields(payload);

  if (!fields.email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  const assessmentVersion = extractAssessmentVersion(payload);
  if (!assessmentVersion) {
    return NextResponse.json({ error: 'Missing assessment_version' }, { status: 400 });
  }

  if (fields.response_id) {
    const { data: existing } = await supabase
      .from('submissions')
      .select('id, reports(download_token)')
      .eq('tally_response_id', fields.response_id)
      .maybeSingle();

    if (existing) {
      const existingToken = (existing as any)?.reports?.[0]?.download_token ?? null;
      return NextResponse.json({ ok: true, duplicate: true, reportToken: existingToken });
    }
  }

  const email = fields.email.toLowerCase();
  let founderId: string;

  const { data: existingFounder } = await supabase
    .from('founders')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingFounder) {
    founderId = existingFounder.id;
    await supabase
      .from('founders')
      .update({
        last_seen_at: new Date().toISOString(),
        ...(fields.name ? { name: fields.name } : {}),
        ...(fields.company_name ? { company_name: fields.company_name } : {}),
      })
      .eq('id', founderId);
  } else {
    const { data: newFounder, error: founderError } = await supabase
      .from('founders')
      .insert({
        email,
        name: fields.name || null,
        company_name: fields.company_name || null,
        source: 'tally-paid',
        consent: true,
      })
      .select('id')
      .single();

    if (founderError || !newFounder) {
      await persistProcessingError({
        errorCode: 'founder_insert_failed',
        message: founderError?.message ?? 'Failed to create founder record',
        payload: { email },
      });
      return NextResponse.json({ error: 'Failed to create founder record' }, { status: 500 });
    }

    founderId = newFounder.id;
  }

  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .insert({
      founder_id: founderId,
      submission_type: 'paid',
      status: 'validated',
      tally_response_id: fields.response_id || null,
      source_event_id: fields.event_id || null,
      assessment_version: assessmentVersion,
      scoring_model_version: SCORING_MODEL_VERSION,
      prompt_version: PROMPT_VERSION,
      responses: payload ?? {},
      normalized_responses: {},
      metadata: {
        payment_reconciliation_status: 'awaiting_stripe_webhook',
      },
    })
    .select('id')
    .single();

  if (submissionError || !submission) {
    await persistProcessingError({
      founderId,
      errorCode: 'submission_insert_failed',
      message: submissionError?.message ?? 'Failed to create submission record',
      payload: { tally_response_id: fields.response_id },
    });
    return NextResponse.json({ error: 'Failed to create submission record' }, { status: 500 });
  }

  const submissionId = submission.id;

  const downloadToken = nanoid(32);
  const downloadExpiresAt = new Date(
    Date.now() + REPORT_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: reportRecord, error: reportError } = await supabase
    .from('reports')
    .insert({
      founder_id: founderId,
      submission_id: submissionId,
      status: 'queued',
      report_type: 'paid',
      report_version: REPORT_VERSION,
      prompt_version: PROMPT_VERSION,
      openai_model: env.OPENAI_MODEL ?? null,
      download_token: downloadToken,
      download_expires_at: downloadExpiresAt,
      metadata: {
        payment_reconciliation_status: 'awaiting_stripe_webhook',
      },
    })
    .select('id')
    .single();

  if (reportError || !reportRecord) {
    await persistProcessingError({
      founderId,
      submissionId,
      errorCode: 'report_insert_failed',
      message: reportError?.message ?? 'Failed to create report record',
      payload: {},
    });
    return NextResponse.json({ error: 'Failed to create report record' }, { status: 500 });
  }

  const reportId = reportRecord.id;

  const idempotencyKey = fields.event_id
    ? `tally-paid-${fields.event_id}`
    : `tally-paid-sub-${submissionId}`;

  const { error: eventError } = await supabase.from('events').insert({
    founder_id: founderId,
    submission_id: submissionId,
    report_id: reportId,
    source: 'tally',
    event_name: 'tally.paid.received',
    external_event_id: fields.event_id || null,
    idempotency_key: idempotencyKey,
    payload: payload ?? {},
    metadata: {
      payment_reconciliation_status: 'awaiting_stripe_webhook',
    },
  });

  if (eventError) {
    await persistProcessingError({
      founderId,
      submissionId,
      reportId,
      errorCode: 'event_insert_failed',
      message: eventError.message,
      payload: { idempotency_key: idempotencyKey },
    });
  }

  const emailSubject = 'We received your paid report request';
  let emailLogId: string | null = null;

  if (env.RESEND_FROM_EMAIL) {
    const { data: emailLogRecord, error: emailLogError } = await supabase
      .from('email_logs')
      .insert({
        founder_id: founderId,
        submission_id: submissionId,
        report_id: reportId,
        template_key: 'paid-report-confirmation',
        to_email: fields.email,
        from_email: env.RESEND_FROM_EMAIL,
        subject: emailSubject,
        status: 'queued',
        payload: {
          payment_reconciliation_status: 'awaiting_stripe_webhook',
        },
      })
      .select('id')
      .single();

    if (emailLogError) {
      await persistProcessingError({
        founderId,
        submissionId,
        reportId,
        errorCode: 'email_log_insert_failed',
        message: emailLogError.message,
        payload: {},
      });
    } else {
      emailLogId = emailLogRecord?.id ?? null;
    }
  } else {
    await persistProcessingError({
      founderId,
      submissionId,
      reportId,
      errorCode: 'email_config_missing',
      message: 'RESEND_FROM_EMAIL is missing; paid confirmation email was not queued',
      payload: {},
    });
  }

  const emailResult = await sendEmail({
    to: fields.email,
    subject: emailSubject,
    html: `<p>We received your paid report request.</p><p>Your Stripe payment will be reconciled from the Stripe webhook before any paid report work continues.</p>`,
    text: 'We received your paid report request. Your Stripe payment will be reconciled from the Stripe webhook before any paid report work continues.',
  });

  if (emailLogId) {
    const resendEmailId = (emailResult as any)?.data?.id ?? null;
    const sendError = (emailResult as any)?.error ?? null;

    if (sendError) {
      await supabase
        .from('email_logs')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: String(sendError?.message ?? 'Send failed'),
        })
        .eq('id', emailLogId);
    } else {
      await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          resend_email_id: resendEmailId,
        })
        .eq('id', emailLogId);
    }
  }

  return NextResponse.json({ ok: true, reportToken: downloadToken });
}
