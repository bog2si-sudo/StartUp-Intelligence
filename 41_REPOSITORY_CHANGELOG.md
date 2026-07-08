# 41_REPOSITORY_CHANGELOG

Version: 4.0

Status: Final

------------------------------------------------------------------------

# Purpose

This document records the final documented state of the Founder
Intelligence Platform Version 4 repository.

It serves as the authoritative changelog for the production
documentation set.

------------------------------------------------------------------------

# Version 4.0

## Initial Scope

Completed implementation documentation for:

-   Product specification
-   Backend architecture
-   Supabase schema
-   Tally integration
-   Stripe integration
-   OpenAI integration
-   Prompt pipeline
-   Report templates
-   Gold standard report
-   API specification
-   Testing
-   Security
-   GDPR
-   Deployment
-   Operations
-   Cursor implementation guidance
-   Product roadmap
-   Acceptance criteria

------------------------------------------------------------------------

# Architectural Decisions

The following decisions are considered frozen for Version 4:

-   Next.js App Router
-   Vercel hosting
-   Supabase persistence
-   Tally forms
-   Stripe embedded in Tally
-   Resend for email
-   OpenAI for narrative generation
-   GitHub repository
-   Cursor implementation

No alternative frameworks are introduced.

------------------------------------------------------------------------

# Business Rules

Confirmed:

-   deterministic scoring
-   deterministic prioritisation
-   deterministic workflow
-   LLM used only for evidence-based narrative

------------------------------------------------------------------------

# Documentation Status

Repository documentation is considered complete.

Future changes should be introduced through version-controlled updates
rather than direct modification of Version 4 documents.

------------------------------------------------------------------------

# Next Major Version

Potential Version 5 work may include:

-   authenticated founder accounts
-   assessment history
-   multilingual reports
-   administrative dashboard

These items are intentionally excluded from Version 4.

------------------------------------------------------------------------

# Milestone 4 — Free Webhook Persistence Slice

Date: 2026-07-07

Branch merged: `copilot/main` → `main`

## Summary

Completed the free webhook persistence slice. The Tally free-assessment
webhook now writes a full, ordered chain of records to Supabase before
returning a response.

## Changes included in this merge

### New files

-   `27_VERSION_CONTRACT.md` — Active authority document defining
    canonical version strings for `assessment_version`,
    `scoring_model_version`, `report_version`, and `prompt_version`.
-   `lib/versions.ts` — Single runtime source for all four canonical
    version constants; mirrors `27_VERSION_CONTRACT.md` exactly.

### Modified files

-   `app/api/tally/free/route.ts` — Full Supabase persistence flow:
    idempotency guard on `tally_response_id`, founder upsert,
    submission insert, event insert, report record insert (status =
    queued, unguessable download token), email log insert, email send
    via Resend, email log update with send outcome. Supabase-null
    fallback preserved for email-only mode.
-   `lib/tally.ts` — Added `extractAssessmentVersion`,
    `extractEventId`, `extractResponseId`, `extractEmail` helpers;
    enriched `mapFreeFields`, `mapPaidFields`, `mapReviewFields` with
    `name`, `response_id`, and `event_id` fields.
-   `00_REPOSITORY_INDEX.md` — `27_VERSION_CONTRACT.md` registered as
    Active authority for all version identifiers.
-   `.gitignore` — Added `*.tsbuildinfo` to prevent build-info files
    from being committed.

## Build verification

-   `tsc --noEmit`: 0 errors
-   `npm run build`: compiled successfully, 10 pages generated

## Scope boundary

This slice covers only the free webhook persistence path.
Paid webhook, review webhook, Stripe, OpenAI report generation, PDF,
benchmark ingestion, and frontend work are explicitly excluded and
remain unimplemented.

------------------------------------------------------------------------

# Milestone 4 — Paid Webhook Persistence + Stripe Integration Slice

Date: 2026-07-07

Branch: `copilot/add-data-visualization-charts`

## Summary

Completed the paid webhook persistence and Stripe integration slice using a
safe reconciliation model. No Stripe identifiers are assumed to be present in
the Tally paid webhook payload. Payment–submission linkage is attempted at
Stripe webhook time using `customer_email` as the only available shared
identifier.

## Changes included in this merge

### Modified files

-   `app/api/tally/paid/route.ts` — Full Supabase persistence flow: JSON
    parse guard, Tally signature verification, idempotency guard on
    `tally_response_id`, founder upsert (source = `tally-paid`), submission
    insert (type = `paid`, assessment_version constant, scoring_model_version
    constant), event insert (event_name = `tally.paid.received`), report
    record insert (status = `queued`, payment_id = null, unguessable download
    token), submission status advance to `processing`, email log insert, email
    send via Resend, email log update with send outcome, Supabase-null
    fallback preserved. No Stripe identifiers extracted or required from the
    Tally payload.

-   `app/api/stripe/webhook/route.ts` — Full Stripe webhook handler:
    signature verification via `stripe.webhooks.constructEvent`, Supabase
    event persistence with idempotency guard (`stripe-<event.id>`), handling
    of `checkout.session.completed` only, founder linkage attempted via
    `session.customer_email` / `session.customer_details.email`, submission
    linkage via most recent unlinked `paid` + `processing` submission for the
    resolved founder, payment record insert with all available Stripe fields,
    back-fill of `reports.payment_id`, event row update with resolved
    linkage identifiers, `processing_errors` records for all unresolved
    linkage cases.

## Build verification

-   `tsc --noEmit`: 0 errors
-   `npm run build`: compiled successfully, 10 pages generated

## Payment–submission linkage analysis

### What is possible without schema changes

| Scenario | Outcome |
|---|---|
| `customer_email` resolves a founder AND an unlinked `processing` paid submission exists | Full linkage: payment → founder, payment → submission, report.payment_id updated |
| `customer_email` resolves a founder but no unlinked submission found | Partial linkage: payment → founder only; `processing_error` recorded (code `stripe_payment_no_submission_link`) |
| `customer_email` absent or does not match any founder | No payment record created; `processing_error` recorded (code `stripe_payment_no_founder_link`) |
| `amount_total` missing or zero | No payment record created; `processing_error` recorded (code `stripe_payment_missing_amount`) |
| Duplicate Stripe event (retry) | Idempotency guard on `events.idempotency_key` returns 200 immediately |

### What remains unresolved

The Tally paid webhook payload does not carry any Stripe session identifier
(e.g. `stripe_checkout_session_id`) that would allow deterministic 1:1
linkage between the Tally submission and the Stripe payment. The only shared
identifier available at runtime is the founder's email address.

This means the linkage is probabilistic when a founder has multiple
concurrent unlinked paid submissions. To achieve deterministic linkage, one
of the following would be required (developer decision):

1.  Tally passes Stripe session metadata that includes the submission ID or
    a shared token.
2.  The backend creates the Stripe Checkout session and embeds the
    `submission_id` in `session.metadata` before redirecting.
3.  A reconciliation job matches payments to submissions post-hoc.

No schema changes are required to support any of these; they are
implementation decisions for a future slice.

## Scope boundary

This slice covers the paid Tally webhook persistence path and the Stripe
`checkout.session.completed` webhook handler with safe reconciliation.
Review webhook, OpenAI report generation, PDF generation, benchmark
ingestion, and frontend work remain unimplemented.

------------------------------------------------------------------------

End of document.
