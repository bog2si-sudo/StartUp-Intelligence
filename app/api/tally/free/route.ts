import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { env } from '@/lib/env';
import { mapFreeFields, parseTallyPayload, verifyTallyRequest } from '@/lib/tally';
import { sendEmail } from '@/lib/resend';
import { supabase } from '@/lib/supabase';

const ASSESSMENT_VERSION = '1.0';
const SCORING_MODEL_VERSION = '1.0';
const REPORT_VERSION = '1.0';
const PROMPT_VERSION = '1.0';
const REPORT_EXPIRY_DAYS = 30;

export async function POST(req: Request) {
  if (!env.TALLY_WEBHOOK_SECRET_FREE) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const body = await req.text();
  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!verifyTallyRequest(req, env.TALLY_WEBHOOK_SECRET_FREE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = parseTallyPayload(rawPayload);
  const fields = mapFreeFields(payload);

  if (!fields.email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  // If Supabase is not configured, fall through to email-only mode
  if (!supabase) {
    const reportToken = nanoid(32);
    await sendEmail({
      to: fields.email,
      subject: 'Your startup assessment is being prepared',
      html: `<p>Your report is being generated.</p><p>Token: ${reportToken}</p>`,
      text: `Your report is being generated. Token: ${reportToken}`,
    });
    return NextResponse.json({ ok: true, reportToken });
  }

  // Idempotency: if this Tally response was already processed, return 200
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
      .update({ last_seen_at: new Date().toISOString(), company_name: fields.company_name || undefined })
      .eq('id', founderId);
  } else {
    const { data: newFounder, error: founderError } = await supabase
      .from('founders')
      .insert({
        email,
        name: fields.name || null,
        company_name: fields.company_name || null,
        source: 'tally-free',
        consent: true,
      })
      .select('id')
      .single();

    if (founderError || !newFounder) {
      return NextResponse.json({ error: 'Failed to create founder record' }, { status: 500 });
    }
    founderId = newFounder.id;
  }

  // Insert submission
  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .insert({
      founder_id: founderId,
      submission_type: 'free',
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
    return NextResponse.json({ error: 'Failed to create submission record' }, { status: 500 });
  }

  const submissionId = submission.id;

  // Insert event (idempotency key prevents duplicate processing)
  const idempotencyKey = fields.event_id ? `tally-free-${fields.event_id}` : `tally-free-sub-${submissionId}`;
  await supabase
    .from('events')
    .insert({
      founder_id: founderId,
      submission_id: submissionId,
      source: 'tally',
      event_name: 'tally.free.received',
      external_event_id: fields.event_id || null,
      idempotency_key: idempotencyKey,
      payload: payload ?? {},
    })
    .select('id')
    .maybeSingle();

  // Insert report record (status = queued, token for private access)
  const downloadToken = nanoid(32);
  const downloadExpiresAt = new Date(Date.now() + REPORT_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: reportError } = await supabase
    .from('reports')
    .insert({
      founder_id: founderId,
      submission_id: submissionId,
      status: 'queued',
      report_type: 'free',
      report_version: REPORT_VERSION,
      prompt_version: PROMPT_VERSION,
      openai_model: env.OPENAI_MODEL ?? null,
      download_token: downloadToken,
      download_expires_at: downloadExpiresAt,
    });

  if (reportError) {
    return NextResponse.json({ error: 'Failed to create report record' }, { status: 500 });
  }

  // Update submission status to processing
  await supabase
    .from('submissions')
    .update({ status: 'processing' })
    .eq('id', submissionId);

  // Send email with report link
  await sendEmail({
    to: fields.email,
    subject: 'Your startup assessment is being prepared',
    html: `<p>Your report is being generated.</p><p>You can access it here: /report/${downloadToken}</p>`,
    text: `Your report is being generated. You can access it at: /report/${downloadToken}`,
  });

  return NextResponse.json({ ok: true, reportToken: downloadToken });
}
