import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { env } from '@/lib/env';
import {
  mapPaidFields,
  parseTallyPayload,
  verifyTallyRequest,
} from '@/lib/tally';
import { sendEmail } from '@/lib/resend';
import { supabase } from '@/lib/supabase';
import {
  ASSESSMENT_VERSION,
  PROMPT_VERSION,
  REPORT_VERSION,
  SCORING_MODEL_VERSION,
} from '@/lib/versions';

const REPORT_EXPIRY_DAYS = 30;

async function persistProcessingError(params: {
  founderId?: string | null;
  submissionId?: string | null;
  errorCode: string;
  message: string;
  payload?: Record<string, unknown>;
}) {
  try {
    await supabase!.from('processing_errors').insert({
      founder_id: params.founderId ?? null,
      submission_id: params.submissionId ?? null,
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
  if (!env.TALLY_WEBHOOK_SECRET_PAID) {
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

  // Supabase-null fallback: email-only mode when DB is not configured
  if (!supabase) {
    const reportToken = nanoid(32);
    await sendEmail({
      to: fields.email,
      subject: 'Your paid report is being prepared',
      html: `<p>Your paid report is being generated.</p><p>You can access it here: /report/${reportToken}</p>`,
      text: `Your paid report is being generated. You can access it at: /report/${reportToken}`,
    });
    return NextResponse.json({ ok: true, reportToken });
  }

  // Idempotency: if this Tally response was already processed, return 200 immediately
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

  // Upsert founder by email (find-or-create)
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

  // Insert submission
  // assessment_version uses the canonical constant; the paid form may not include
  // the hidden assessment_version field that the free form carries.
  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .insert({
      founder_id: founderId,
      submission_type: 'paid',
      status: 'received',
      tally_response_id: fields.response_id || null,
      source_event_id: fields.event_id || null,
      assessment_version: ASSESSMENT_VERSION,
      scoring_model_version: SCORING_MODEL_VERSION,
      responses: payload ?? {},
      normalized_responses: {},
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

  // Insert event — idempotency key prevents duplicate processing
  const idempotencyKey = fields.event_id
    ? `tally-paid-${fields.event_id}`
    : `tally-paid-sub-${submissionId}`;

  const { error: eventError } = await supabase.from('events').insert({
    founder_id: founderId,
    submission_id: submissionId,
    source: 'tally',
    event_name: 'tally.paid.received',
    external_event_id: fields.event_id || null,
    idempotency_key: idempotencyKey,
    payload: payload ?? {},
  });

  if (eventError) {
    // Non-fatal: log the failure and continue
    await persistProcessingError({
      founderId,
      submissionId,
      errorCode: 'event_insert_failed',
      message: eventError.message,
      payload: { idempotency_key: idempotencyKey },
    });
  }

  // Insert report record (status = queued, unguessable download token)
  // payment_id is intentionally null here; the Stripe webhook updates it once
  // payment is confirmed and the linkage is resolved.
  const downloadToken = nanoid(32);
  const downloadExpiresAt = new Date(
    Date.now() + REPORT_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: reportRecord, error: reportError } = await supabase
    .from('reports')
    .insert({
      founder_id: founderId,
      submission_id: submissionId,
      payment_id: null,
      status: 'queued',
      report_type: 'paid',
      report_version: REPORT_VERSION,
      prompt_version: PROMPT_VERSION,
      openai_model: env.OPENAI_MODEL ?? null,
      download_token: downloadToken,
      download_expires_at: downloadExpiresAt,
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

  // Advance submission to processing
  await supabase.from('submissions').update({ status: 'processing' }).eq('id', submissionId);

  // Persist email log (queued) before send
  const emailSubject = 'Your paid report is being prepared';
  let emailLogId: string | null = null;

  if (env.RESEND_FROM_EMAIL) {
    const { data: emailLogRecord } = await supabase
      .from('email_logs')
      .insert({
        founder_id: founderId,
        submission_id: submissionId,
        report_id: reportId,
        template_key: 'paid-report-notification',
        to_email: fields.email,
        from_email: env.RESEND_FROM_EMAIL,
        subject: emailSubject,
        status: 'queued',
        payload: {},
      })
      .select('id')
      .single();
    emailLogId = emailLogRecord?.id ?? null;
  }

  // Send email
  const emailResult = await sendEmail({
    to: fields.email,
    subject: emailSubject,
    html: `<p>Your paid report is being generated.</p><p>You can access it here: /report/${downloadToken}</p>`,
    text: `Your paid report is being generated. You can access it at: /report/${downloadToken}`,
  });

  // Update email log with send outcome
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
