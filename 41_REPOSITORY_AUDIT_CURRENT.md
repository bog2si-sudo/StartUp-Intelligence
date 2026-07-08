# 41_REPOSITORY_AUDIT_CURRENT.md

Status: Active Audit Report
Authority: Repository consistency audit for the next implementation milestone
Supersedes: None
Applies to: repository stabilization and milestone readiness
Audit executed: 2026-07-08

---

## Repository Health

PASS

No blockers. Build passes. TypeScript passes. Documentation is consistent. All
previous blockers resolved.

---

## Documentation

PASS

Evidence (verified):

- [00_REPOSITORY_INDEX.md](00_REPOSITORY_INDEX.md) is present and establishes the active, superseded, and historical authority model. Authority hierarchy is correctly defined.
- [20_SUPABASE_SCHEMA.sql](20_SUPABASE_SCHEMA.sql) is present and designated as the highest database authority in the index.
- [22_IMPLEMENTATION_CONTRACT.md](22_IMPLEMENTATION_CONTRACT.md) is present. It defines prohibited and required coding-agent actions and references the correct authority chain.
- [23_AGENT_WORKFLOW.md](23_AGENT_WORKFLOW.md) is present and referenced correctly in the index.
- [25_ENVIRONMENT_VARIABLES.md](25_ENVIRONMENT_VARIABLES.md) is present. It lists exactly 13 approved variable names.
- [27_VERSION_CONTRACT.md](27_VERSION_CONTRACT.md) is present. It defines the four canonical version strings and is registered as Active in the index.
- [40_REPOSITORY_AUDIT.md](40_REPOSITORY_AUDIT.md) is a historical reference and is not treated as an implementation authority.

---

## Schema

PASS

Evidence (verified):

- [20_SUPABASE_SCHEMA.sql](20_SUPABASE_SCHEMA.sql) is the active schema authority. It is present in the repository root.
- [19_SUPABASE_SCHEMA.sql](19_SUPABASE_SCHEMA.sql) is explicitly superseded in the index and was not used during this audit.
- No code was found referencing the older `assessments` table model as a canonical table.
- No new tables, columns, or enums were introduced in Milestones 4 Slices 1–4. All persistence uses the pre-existing JSONB `metadata` columns or canonical table columns.

---

## Environment Variables

PASS

Evidence (verified against [lib/env.ts](lib/env.ts) and [25_ENVIRONMENT_VARIABLES.md](25_ENVIRONMENT_VARIABLES.md)):

`lib/env.ts` now contains exactly the 13 approved variables:

| Variable | Present in lib/env.ts | Approved |
|---|---|---|
| `SUPABASE_URL` | Yes | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes |
| `TALLY_WEBHOOK_SECRET_FREE` | Yes | Yes |
| `TALLY_WEBHOOK_SECRET_PAID` | Yes | Yes |
| `TALLY_WEBHOOK_SECRET_REVIEW` | Yes | Yes |
| `STRIPE_SECRET_KEY` | Yes | Yes |
| `STRIPE_WEBHOOK_SECRET` | Yes | Yes |
| `RESEND_API_KEY` | Yes | Yes |
| `RESEND_FROM_EMAIL` | Yes | Yes |
| `OPENAI_API_KEY` | Yes | Yes |
| `OPENAI_MODEL` | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes |

Previously unapproved variables `NEXT_PUBLIC_SITE_URL`, `STRIPE_PRICE_PAID_REPORT`, and `INTERNAL_ALERT_EMAIL` have been removed. No aliases or fallback names are present.

---

## Implementation

PASS

Evidence (verified against [lib/tally.ts](lib/tally.ts) and the four webhook routes):

- All four webhook routes are present and export a `POST` handler.
- `verifyTallyRequest` and `parseTallyPayload` are consistently used across all routes.
- `verifyTallyRequest` returns `false` when `expectedSecret` is falsy (fixed in Slice 3); an unset secret now correctly rejects all requests.
- All three Tally webhook routes perform a preflight check on the secret variable and return HTTP 500 if it is absent.
- Idempotency is preserved: free and paid routes guard on `submissions.tally_response_id`; the review route guards on `events.idempotency_key` (the `review_requests` table has no `tally_response_id` column).
- All routes use only approved environment variable names.
- `lib/versions.ts` mirrors `27_VERSION_CONTRACT.md` exactly.
- No OpenAI report generation, PDF generation, or benchmark ingestion has been started.

Confirmed structural positives:

- Free webhook: founder upsert, submission insert, event insert, report record (queued), email log + send.
- Paid webhook: founder upsert, submission insert (with `payment_linkage_token` in metadata), event insert, report record (queued, payment_id null), submission status advance, email log + send.
- Stripe webhook: signature verification, event persistence, deterministic submission/report linkage via `payment_linkage_token`, payment record insert, report back-fill, processing_errors for all unresolved cases.
- Review webhook: founder upsert, review_request insert, event insert (with `review_request_id`), email log + send.

---

## Build

PASS

Evidence (verified by running `npm install` and `npm run build`):

- `npm install`: success.
- `npm run build` (includes TypeScript and lint): compiled successfully.
- All expected routes are present in the build output:
  - `/api/stripe/webhook`
  - `/api/tally/free`
  - `/api/tally/paid`
  - `/api/tally/review`
  - `/report/[token]`
  - `/checkout/cancel`
  - `/checkout/success`

---

## Remaining Inconsistencies

### Minor — JSON parse guard missing in review route (Severity: Low)

Previously the review route lacked a try/catch around `JSON.parse`. This has
been corrected in Milestone 4 Slice 4; the route now follows the same guarded
parse pattern as the free and paid routes.

No other inconsistencies found.

---

## Automatic Fixes Performed

None.

---

## Files Modified

- [41_REPOSITORY_AUDIT_CURRENT.md](41_REPOSITORY_AUDIT_CURRENT.md)

---

## Final Summary

The repository is in a healthy, contract-compliant state after Milestone 4
Slices 1–4. Both previous high-severity blockers are resolved. Build and
TypeScript pass cleanly. Schema, environment variables, version strings,
idempotency, and webhook authentication are all aligned with active authority
documents. No AI reasoning, report generation, PDF generation, or benchmark
ingestion has been started.