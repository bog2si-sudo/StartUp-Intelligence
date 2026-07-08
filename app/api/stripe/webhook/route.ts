import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

async function persistProcessingError(params: {
  founderId?: string | null;
  submissionId?: string | null;
  paymentId?: string | null;
  eventId?: string | null;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  errorCode: string;
  message: string;
  payload?: Record<string, unknown>;
}) {
  try {
    await supabase!.from('processing_errors').insert({
      founder_id: params.founderId ?? null,
      submission_id: params.submissionId ?? null,
      payment_id: params.paymentId ?? null,
      event_id: params.eventId ?? null,
      severity: params.severity ?? 'error',
      source: 'stripe',
      error_code: params.errorCode,
      message: params.message,
      payload: params.payload ?? {},
    });
  } catch {
    // best-effort; do not propagate
  }
}

function normalizeNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractPaymentLinkageToken(session: Stripe.Checkout.Session): string | null {
  return (
    normalizeNonEmptyString(session.metadata?.payment_linkage_token) ||
    normalizeNonEmptyString(session.metadata?.shared_token) ||
    normalizeNonEmptyString(session.metadata?.stripe_linkage_token) ||
    normalizeNonEmptyString(session.metadata?.linkage_token)
  );
}

export async function POST(req: Request) {
  const signature = (await headers()).get('stripe-signature');
  const body = await req.text();

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing required environment variable: STRIPE_WEBHOOK_SECRET' },
      { status: 500 },
    );
  }

  if (!stripe) {
    return NextResponse.json(
      { error: 'Missing required environment variable: STRIPE_SECRET_KEY' },
      { status: 500 },
    );
  }

  // Verify Stripe webhook signature
  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Signature verification failed';
    return NextResponse.json({ error: 'Invalid signature', detail: message }, { status: 400 });
  }

  // Without Supabase, acknowledge receipt without persistence
  if (!supabase) {
    return NextResponse.json({ ok: true, received: true });
  }

  // Persist raw Stripe event for audit and idempotency
  const idempotencyKey = `stripe-${stripeEvent.id}`;
  const { data: eventRow, error: eventInsertError } = await supabase
    .from('events')
    .insert({
      source: 'stripe',
      event_name: stripeEvent.type,
      external_event_id: stripeEvent.id,
      idempotency_key: idempotencyKey,
      payload: (stripeEvent.data.object as unknown as Record<string, unknown>) ?? {},
    })
    .select('id')
    .single();

  if (eventInsertError) {
    // '23505' = unique_violation: this event was already processed
    if (eventInsertError.code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    // Non-duplicate failure: audit log unavailable; continue processing
    await persistProcessingError({
      severity: 'warning',
      errorCode: 'stripe_event_insert_failed',
      message: eventInsertError.message,
      payload: { stripe_event_id: stripeEvent.id, event_type: stripeEvent.type },
    });
  }

  const dbEventId = eventRow?.id ?? null;

  // Only handle checkout.session.completed; acknowledge all other event types
  if (stripeEvent.type !== 'checkout.session.completed') {
    return NextResponse.json({ ok: true, received: true });
  }

  const session = stripeEvent.data.object as Stripe.Checkout.Session;

  // Extract all available identifiers from the Stripe event payload
  const stripeCheckoutSessionId = session.id ?? null;
  const stripePaymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;
  const stripeCustomerId =
    typeof session.customer === 'string'
      ? session.customer
      : (session.customer as Stripe.Customer | Stripe.DeletedCustomer | null)?.id ?? null;
  const stripeEventId = stripeEvent.id;
  const amountTotal = typeof session.amount_total === 'number' ? session.amount_total : null;
  const currency =
    typeof session.currency === 'string' && session.currency.length > 0
      ? session.currency.toLowerCase()
      : 'eur';
  const productCode =
    typeof session.metadata?.product_code === 'string' && session.metadata.product_code.length > 0
      ? session.metadata.product_code
      : 'paid_roadmap_report';
  const paymentLinkageToken = extractPaymentLinkageToken(session);

  // Retain customer email for audit and troubleshooting metadata.
  const rawCustomerEmail =
    (typeof session.customer_email === 'string' && session.customer_email) ||
    (typeof session.customer_details?.email === 'string' && session.customer_details.email) ||
    null;
  const customerEmail = rawCustomerEmail ? rawCustomerEmail.toLowerCase() : null;

  // Amount is required (NOT NULL, CHECK amount > 0)
  if (!amountTotal || amountTotal <= 0) {
    await persistProcessingError({
      eventId: dbEventId,
      severity: 'warning',
      errorCode: 'stripe_payment_missing_amount',
      message:
        'checkout.session.completed received with missing or zero amount_total; payment record not created',
      payload: {
        stripe_event_id: stripeEventId,
        stripe_checkout_session_id: stripeCheckoutSessionId,
      },
    });
    return NextResponse.json({
      ok: true,
      received: true,
      linked: false,
      reason: 'missing_amount',
    });
  }

  if (!paymentLinkageToken) {
    await persistProcessingError({
      eventId: dbEventId,
      severity: 'warning',
      errorCode: 'stripe_payment_missing_linkage_token',
      message:
        'checkout.session.completed received without a shared payment linkage token in Stripe metadata; payment record not created',
      payload: {
        stripe_event_id: stripeEventId,
        stripe_checkout_session_id: stripeCheckoutSessionId,
      },
    });
    return NextResponse.json({
      ok: true,
      received: true,
      linked: false,
      reason: 'missing_linkage_token',
    });
  }

  let founderId: string | null = null;
  let submissionId: string | null = null;
  let reportId: string | null = null;

  const { data: matchingSubmissions, error: submissionLookupError } = await supabase
    .from('submissions')
    .select('id, founder_id')
    .eq('submission_type', 'paid')
    .eq('metadata->>payment_linkage_token', paymentLinkageToken)
    .limit(2);

  if (submissionLookupError) {
    await persistProcessingError({
      eventId: dbEventId,
      severity: 'warning',
      errorCode: 'stripe_payment_submission_lookup_failed',
      message:
        'checkout.session.completed received but paid submission lookup by shared token failed; payment record not created',
      payload: {
        stripe_event_id: stripeEventId,
        payment_linkage_token: paymentLinkageToken,
        db_error: submissionLookupError.message,
      },
    });
    return NextResponse.json({
      ok: true,
      received: true,
      linked: false,
      reason: 'submission_lookup_failed',
    });
  }

  if (!matchingSubmissions || matchingSubmissions.length === 0) {
    await persistProcessingError({
      eventId: dbEventId,
      severity: 'warning',
      errorCode: 'stripe_payment_no_submission_link',
      message:
        'checkout.session.completed received but no paid submission matched the shared linkage token; payment record not created',
      payload: {
        stripe_event_id: stripeEventId,
        payment_linkage_token: paymentLinkageToken,
      },
    });
    return NextResponse.json({
      ok: true,
      received: true,
      linked: false,
      reason: 'no_submission_for_linkage_token',
    });
  }

  if (matchingSubmissions.length > 1) {
    await persistProcessingError({
      eventId: dbEventId,
      severity: 'warning',
      errorCode: 'stripe_payment_ambiguous_submission_link',
      message:
        'checkout.session.completed matched multiple paid submissions for the same shared linkage token; payment record not created',
      payload: {
        stripe_event_id: stripeEventId,
        payment_linkage_token: paymentLinkageToken,
        candidate_submission_ids: matchingSubmissions.map((row) => row.id),
      },
    });
    return NextResponse.json({
      ok: true,
      received: true,
      linked: false,
      reason: 'ambiguous_submission_linkage_token',
    });
  }

  submissionId = matchingSubmissions[0].id;
  founderId = matchingSubmissions[0].founder_id;

  const { data: report, error: reportLookupError } = await supabase
    .from('reports')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('report_type', 'paid')
    .maybeSingle();

  if (reportLookupError) {
    await persistProcessingError({
      founderId,
      submissionId,
      eventId: dbEventId,
      severity: 'warning',
      errorCode: 'stripe_payment_report_lookup_failed',
      message:
        'Paid submission was linked by shared token but report lookup failed; payment will be persisted without report linkage',
      payload: {
        stripe_event_id: stripeEventId,
        payment_linkage_token: paymentLinkageToken,
        db_error: reportLookupError.message,
      },
    });
  } else {
    reportId = report?.id ?? null;
  }

  // Insert payment record with all available Stripe identifiers
  const { data: paymentRecord, error: paymentError } = await supabase
    .from('payments')
    .insert({
      founder_id: founderId,
      submission_id: submissionId,
      provider: 'stripe',
      status: 'paid',
      stripe_customer_id: stripeCustomerId,
      stripe_checkout_session_id: stripeCheckoutSessionId,
      stripe_payment_intent_id: stripePaymentIntentId,
      stripe_event_id: stripeEventId,
      amount: amountTotal,
      currency,
      product_code: productCode,
      paid_at: new Date().toISOString(),
      metadata: {
        linked_via: 'shared_token',
        payment_linkage_token: paymentLinkageToken,
        customer_email: customerEmail,
        submission_linked: submissionId !== null,
        report_linked: reportId !== null,
      },
    })
    .select('id')
    .single();

  if (paymentError || !paymentRecord) {
    // '23505' = duplicate; payment for this Stripe event already exists
    if (paymentError?.code === '23505') {
      return NextResponse.json({ ok: true, received: true, duplicate: true });
    }
    await persistProcessingError({
      founderId,
      submissionId,
      eventId: dbEventId,
      errorCode: 'payment_insert_failed',
      message: paymentError?.message ?? 'Failed to create payment record',
      payload: { stripe_event_id: stripeEventId },
    });
    // Return 200 to prevent Stripe from retrying non-transient failures indefinitely
    return NextResponse.json({
      ok: true,
      received: true,
      linked: false,
      reason: 'payment_insert_failed',
    });
  }

  const paymentId = paymentRecord.id;
  const fullyLinked = submissionId !== null && reportId !== null;

  // Back-fill payment_id on the report created by the Tally webhook
  if (reportId) {
    await supabase
      .from('reports')
      .update({ payment_id: paymentId })
      .eq('id', reportId);
  }

  // Update the event row with resolved linkage identifiers
  if (dbEventId) {
    await supabase
      .from('events')
      .update({
        payment_id: paymentId,
        founder_id: founderId,
        submission_id: submissionId,
        report_id: reportId,
        processed_at: new Date().toISOString(),
      })
      .eq('id', dbEventId);
  }

  // Record unresolved report linkage when it occurs
  if (!reportId) {
    await persistProcessingError({
      founderId,
      submissionId,
      paymentId,
      eventId: dbEventId,
      severity: 'warning',
      errorCode: 'stripe_payment_no_report_link',
      message:
        'Payment linked to founder and submission via shared token but no paid report row could be resolved; manual reconciliation required',
      payload: {
        stripe_event_id: stripeEventId,
        payment_linkage_token: paymentLinkageToken,
        founder_id: founderId,
        submission_id: submissionId,
        payment_id: paymentId,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    received: true,
    linked: fullyLinked,
    payment_id: paymentId,
    submission_id: submissionId,
    report_id: reportId,
  });
}
