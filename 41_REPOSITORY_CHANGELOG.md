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
 
# Milestone 4 — Slice 2: Paid Webhook + Stripe Reconciliation
 
Date: 2026-07-08
 
## Summary
 
Implemented the paid Tally webhook and Stripe webhook using a safe
reconciliation model that does not guess Stripe fields from the Tally
payload and does not change the schema or environment variable contract.
 
## Changes included in this slice
 
### Modified files
 
-   `app/api/tally/paid/route.ts` — Persists founder, paid submission,
    queued paid report, Tally event, email log, and processing errors.
    The route does not read or depend on guessed Stripe paths from the
    Tally payload.
-   `app/api/stripe/webhook/route.ts` — Verifies
    `STRIPE_WEBHOOK_SECRET`, persists Stripe payments from Stripe event
    payloads, links founder/submission/report only when a reliable
    identifier is present, and records unresolved linkage in payment
    metadata and `processing_errors`.
 
## Linkage behavior
 
-   Founder linkage is possible through an existing reliable metadata ID
    or Stripe email-based founder upsert.
-   Submission linkage is possible only when Stripe metadata includes a
    reliable existing identifier such as `submission_id` or `report_id`.
-   Report linkage is possible only when a reliable existing identifier
    resolves to an existing paid report.
-   If Stripe lacks a reliable shared identifier, the payment is still
    persisted with available Stripe fields and the unresolved linkage is
    recorded for later reconciliation.
 
## Scope boundary
 
This slice does not implement report generation, OpenAI, PDF, review
webhook work, frontend flow changes, benchmark ingestion, schema changes,
or new environment variables.
 
------------------------------------------------------------------------
 
End of document.
