import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

const STRIPE_PRODUCT_CODE = 'paid_roadmap_report';

async function persistProcessingError(params: {
  founderId?: string | null;
  submissionId?: string | null;
  paymentId?: string | null;
  reportId?: string | null;
  eventId?: string | null;
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
      payment_id: params.paymentId ?? null,
      report_id: params.reportId ?? null,
      event_id: params.eventId ?? null,
      severity: 'error',
      source: 'stripe',
      error_code: params.errorCode,
      message: params.message,
      payload: params.payload ?? {},
    });
  } catch {
    // best-effort; do not propagate
  }
}

function normalizeText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(value?: string | null) {
  return normalizeText(value)?.toLowerCase() ?? null;
}

function toIsoTimestamp(value?: number | null) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function getStripeEmail(session: Stripe.Checkout.Session) {
  return normalizeEmail(session.customer_details?.email ?? session.customer_email ?? null);
}

function getStripeMetadataValue(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === 'string' ? normalizeText(value) : null;
}

async function upsertFounderByEmail(email: string) {
  if (!supabase) {
    return null;
  }

  const { data: existingFounder } = await supabase
    .from('founders')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingFounder) {
    await supabase
      .from('founders')
      .update({
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', existingFounder.id);
    return existingFounder.id;
  }

  const { data: newFounder, error } = await supabase
    .from('founders')
    .insert({
      email,
      source: 'stripe',
      consent: false,
    })
    .select('id')
    .single();

  if (error || !newFounder) {
    return null;
  }

  return newFounder.id;
}

async function resolveReliableLinkage(session: Stripe.Checkout.Session) {
  if (!supabase) {
    return {
      founderId: null,
      submissionId: null,
      reportId: null,
      linkageSource: 'unavailable',
      linkageError: 'supabase_missing',
    };
  }

  const reportId = getStripeMetadataValue(session.metadata, 'report_id');
  if (reportId) {
    const { data: report } = await supabase
      .from('reports')
      .select('id, founder_id, submission_id')
      .eq('id', reportId)
      .maybeSingle();

    if (report) {
      return {
        founderId: report.founder_id,
        submissionId: report.submission_id,
        reportId: report.id,
        linkageSource: 'metadata.report_id',
        linkageError: null,
      };
    }

    return {
      founderId: null,
      submissionId: null,
      reportId: null,
      linkageSource: 'metadata.report_id',
      linkageError: 'report_not_found',
    };
  }

  const submissionId = getStripeMetadataValue(session.metadata, 'submission_id');
  if (submissionId) {
    const { data: submission } = await supabase
      .from('submissions')
      .select('id, founder_id')
      .eq('id', submissionId)
      .maybeSingle();

    if (submission) {
      const { data: report } = await supabase
        .from('reports')
        .select('id')
        .eq('submission_id', submission.id)
        .eq('report_type', 'paid')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        founderId: submission.founder_id,
        submissionId: submission.id,
        reportId: report?.id ?? null,
        linkageSource: 'metadata.submission_id',
        linkageError: report ? null : 'report_not_found',
      };
    }

    return {
      founderId: null,
      submissionId: null,
      reportId: null,
      linkageSource: 'metadata.submission_id',
      linkageError: 'submission_not_found',
    };
  }

  const founderId = getStripeMetadataValue(session.metadata, 'founder_id');
  if (founderId) {
    const { data: founder } = await supabase
      .from('founders')
      .select('id')
      .eq('id', founderId)
      .maybeSingle();

    return {
      founderId: founder?.id ?? null,
      submissionId: null,
      reportId: null,
      linkageSource: 'metadata.founder_id',
      linkageError: founder ? null : 'founder_not_found',
    };
  }

  return {
    founderId: null,
    submissionId: null,
    reportId: null,
    linkageSource: 'none',
    linkageError: 'missing_shared_identifier',
  };
}

async function insertStripeEvent(params: {
  stripeEvent: Stripe.Event;
  founderId?: string | null;
  submissionId?: string | null;
  paymentId?: string | null;
  reportId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      founder_id: params.founderId ?? null,
      submission_id: params.submissionId ?? null,
      payment_id: params.paymentId ?? null,
      report_id: params.reportId ?? null,
      source: 'stripe',
      event_name: params.stripeEvent.type,
      external_event_id: params.stripeEvent.id,
      idempotency_key: `stripe-${params.stripeEvent.id}`,
      payload: params.stripeEvent as unknown as Record<string, unknown>,
      processed_at: new Date().toISOString(),
      metadata: params.metadata ?? {},
    })
    .select('id')
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

export async function POST(req: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET || !stripe || !supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const body = await req.text();

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
  }

  const { data: existingEvent } = await supabase
    .from('events')
    .select('id')
    .eq('source', 'stripe')
    .eq('external_event_id', stripeEvent.id)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (
    stripeEvent.type !== 'checkout.session.completed' &&
    stripeEvent.type !== 'checkout.session.expired'
  ) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const session = stripeEvent.data.object as Stripe.Checkout.Session;
  const reliableLinkage = await resolveReliableLinkage(session);
  const stripeEmail = getStripeEmail(session);

  const founderId =
    reliableLinkage.founderId ?? (stripeEmail ? await upsertFounderByEmail(stripeEmail) : null);

  const occurredAt = toIsoTimestamp(stripeEvent.created) ?? new Date().toISOString();
  const amount = session.amount_total ?? 0;
  const currency = normalizeText(session.currency)?.toLowerCase() ?? 'eur';
  const paymentStatus = stripeEvent.type === 'checkout.session.completed' ? 'paid' : 'cancelled';

  if (!founderId || amount <= 0) {
    const eventId = await insertStripeEvent({
      stripeEvent,
      founderId,
      submissionId: reliableLinkage.submissionId,
      reportId: reliableLinkage.reportId,
      metadata: {
        linkage_source: reliableLinkage.linkageSource,
        linkage_error: reliableLinkage.linkageError,
        customer_email: stripeEmail,
      },
    });

    await persistProcessingError({
      founderId,
      submissionId: reliableLinkage.submissionId,
      reportId: reliableLinkage.reportId,
      eventId,
      errorCode: 'stripe_payment_persist_failed',
      message: 'Stripe payment could not be persisted because founder or amount data was unavailable',
      payload: {
        stripe_event_id: stripeEvent.id,
        stripe_checkout_session_id: session.id,
        customer_email: stripeEmail,
        amount_total: session.amount_total,
        currency: session.currency,
        linkage_source: reliableLinkage.linkageSource,
        linkage_error: reliableLinkage.linkageError,
      },
    });

    return NextResponse.json({ ok: true, persisted: false });
  }

  const paymentMetadata = {
    stripe_event_type: stripeEvent.type,
    linkage_source: reliableLinkage.linkageSource,
    linkage_error: reliableLinkage.linkageError,
    customer_email: stripeEmail,
    checkout_session_status: session.status ?? null,
    checkout_payment_status: session.payment_status ?? null,
    stripe_metadata: session.metadata ?? {},
  };

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      founder_id: founderId,
      submission_id: reliableLinkage.submissionId,
      provider: 'stripe',
      status: paymentStatus,
      stripe_customer_id:
        typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      stripe_charge_id: null,
      stripe_event_id: stripeEvent.id,
      amount,
      currency,
      product_code: getStripeMetadataValue(session.metadata, 'product_code') ?? STRIPE_PRODUCT_CODE,
      description: session.custom_text?.submit?.message ?? session.metadata?.description ?? null,
      receipt_url: null,
      paid_at: paymentStatus === 'paid' ? occurredAt : null,
      failed_at: paymentStatus === 'cancelled' ? occurredAt : null,
      metadata: paymentMetadata,
    })
    .select('id')
    .single();

  if (paymentError || !payment) {
    const eventId = await insertStripeEvent({
      stripeEvent,
      founderId,
      submissionId: reliableLinkage.submissionId,
      reportId: reliableLinkage.reportId,
      metadata: paymentMetadata,
    });

    await persistProcessingError({
      founderId,
      submissionId: reliableLinkage.submissionId,
      reportId: reliableLinkage.reportId,
      eventId,
      errorCode: 'payment_insert_failed',
      message: paymentError?.message ?? 'Failed to persist Stripe payment',
      payload: {
        stripe_event_id: stripeEvent.id,
        stripe_checkout_session_id: session.id,
      },
    });

    return NextResponse.json({ error: 'Failed to persist Stripe payment' }, { status: 500 });
  }

  if (paymentStatus === 'paid' && reliableLinkage.reportId) {
    await supabase
      .from('reports')
      .update({
        payment_id: payment.id,
      })
      .eq('id', reliableLinkage.reportId);
  }

  const eventId = await insertStripeEvent({
    stripeEvent,
    founderId,
    submissionId: reliableLinkage.submissionId,
    paymentId: payment.id,
    reportId: reliableLinkage.reportId,
    metadata: paymentMetadata,
  });

  if (!reliableLinkage.submissionId) {
    await persistProcessingError({
      founderId,
      paymentId: payment.id,
      eventId,
      errorCode: 'payment_submission_link_unresolved',
      message:
        'Stripe payment was persisted but could not be linked to a submission because no reliable shared identifier was present',
      payload: {
        stripe_event_id: stripeEvent.id,
        stripe_checkout_session_id: session.id,
        customer_email: stripeEmail,
        linkage_source: reliableLinkage.linkageSource,
        linkage_error: reliableLinkage.linkageError,
      },
    });
  } else if (!reliableLinkage.reportId) {
    await persistProcessingError({
      founderId,
      submissionId: reliableLinkage.submissionId,
      paymentId: payment.id,
      eventId,
      errorCode: 'payment_report_link_unresolved',
      message:
        'Stripe payment was linked to a submission but no paid report record was found for linkage',
      payload: {
        stripe_event_id: stripeEvent.id,
        stripe_checkout_session_id: session.id,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    paymentId: payment.id,
    linkedSubmissionId: reliableLinkage.submissionId,
    linkedReportId: reliableLinkage.reportId,
  });
}
