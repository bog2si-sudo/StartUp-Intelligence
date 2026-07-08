import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { mapReviewFields, parseTallyPayload, verifyTallyRequest } from '@/lib/tally';
import { sendEmail } from '@/lib/resend';
import { supabase } from '@/lib/supabase';

async function persistProcessingError(params: {
  founderId?: string | null;
  reviewRequestId?: string | null;
  errorCode: string;
  message: string;
  payload?: Record<string, unknown>;
}) {
  try {
    await supabase!.from('processing_errors').insert({
      founder_id: params.founderId ?? null,
      review_request_id: params.reviewRequestId ?? null,
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
  if (!env.TALLY_WEBHOOK_SECRET_REVIEW) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const body = await req.text();
  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!verifyTallyRequest(req, env.TALLY_WEBHOOK_SECRET_REVIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = parseTallyPayload(rawPayload);
  const fields = mapReviewFields(payload);

  if (!fields.email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  // Supabase-null fallback: email-only mode when DB is not configured
  if (!supabase) {
    await sendEmail({
      to: fields.email,
      subject: 'We received your review request',
      html: `<p>Thank you for submitting your review request. Our team will be in touch shortly.</p>`,
      text: `Thank you for submitting your review request. Our team will be in touch shortly.`,
    });
    return NextResponse.json({ ok: true });
  }

  // Idempotency: if this Tally event was already processed, return 200 immediately.
  // review_requests has no tally_response_id column; idempotency is checked via
  // the events.idempotency_key unique constraint.
  const idempotencyKey = fields.event_id
    ? `tally-review-${fields.event_id}`
    : fields.response_id
      ? `tally-review-resp-${fields.response_id}`
      : null;

  if (idempotencyKey) {
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingEvent) {
      return NextResponse.json({ ok: true, duplicate: true });
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
        source: 'tally-review',
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

  // Insert review request record
  const { data: reviewRequest, error: reviewRequestError } = await supabase
    .from('review_requests')
    .insert({
      founder_id: founderId,
      status: 'received',
      metadata: {
        tally_response_id: fields.response_id || null,
        tally_event_id: fields.event_id || null,
      },
    })
    .select('id')
    .single();

  if (reviewRequestError || !reviewRequest) {
    await persistProcessingError({
      founderId,
      errorCode: 'review_request_insert_failed',
      message: reviewRequestError?.message ?? 'Failed to create review request record',
      payload: { tally_response_id: fields.response_id },
    });
    return NextResponse.json({ error: 'Failed to create review request record' }, { status: 500 });
  }

  const reviewRequestId = reviewRequest.id;

  // Insert event — idempotency_key prevents duplicate processing
  const { error: eventError } = await supabase.from('events').insert({
    founder_id: founderId,
    review_request_id: reviewRequestId,
    source: 'tally',
    event_name: 'tally.review.received',
    external_event_id: fields.event_id || null,
    idempotency_key: idempotencyKey,
    payload: payload ?? {},
  });

  if (eventError) {
    // Non-fatal: log the failure and continue
    await persistProcessingError({
      founderId,
      reviewRequestId,
      errorCode: 'event_insert_failed',
      message: eventError.message,
      payload: { idempotency_key: idempotencyKey },
    });
  }

  // Persist email log (queued) before send
  const emailSubject = 'We received your review request';
  let emailLogId: string | null = null;

  if (env.RESEND_FROM_EMAIL) {
    const { data: emailLogRecord } = await supabase
      .from('email_logs')
      .insert({
        founder_id: founderId,
        review_request_id: reviewRequestId,
        template_key: 'review-request-confirmation',
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
    html: `<p>Thank you for submitting your review request. Our team will be in touch shortly.</p>`,
    text: `Thank you for submitting your review request. Our team will be in touch shortly.`,
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

  return NextResponse.json({ ok: true });
}
