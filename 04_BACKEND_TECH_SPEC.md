# 04 — Backend Technical Spec

## Recommended Framework

Use Next.js on Vercel.

Reason:

- easy API routes,
- easy deployment,
- Vercel-native serverless functions,
- simple HTML report pages,
- can later replace Tally with custom forms if needed.

## Recommended folder structure

```text
/app
  /report/[token]/page.tsx
  /checkout/success/page.tsx
  /checkout/cancel/page.tsx
  /api
    /tally/free/route.ts
    /tally/paid/route.ts
    /tally/review/route.ts
    /checkout/create/route.ts
    /stripe/webhook/route.ts
    /reports/generate/route.ts
/lib
  supabase.ts
  stripe.ts
  resend.ts
  openai.ts
  tally.ts
  scoring.ts
  benchmarks.ts
  reports.ts
  pdf.ts
  emails.ts
/prompts
  normalize-founder-input.md
  benchmark-selection.md
  evidence-scoring.md
  readiness-scoring.md
  valuation.md
  action-prioritization.md
  executive-summary.md
  report-assembly.md
```

## Core backend flow

### Free Decision Check

1. Tally submits to `/api/tally/free`.
2. Backend validates webhook.
3. Backend normalizes fields.
4. Backend creates row in `submissions`.
5. Backend creates row in `events`.
6. Backend calls report generation pipeline with `report_type = free`.
7. Report is stored in `reports`.
8. Email is sent with report link.

### Paid Report

1. Tally submits to `/api/tally/paid`.
2. Backend validates webhook.
3. Backend creates `submission` with `payment_status = pending`.
4. Backend creates Stripe Checkout session.
5. Backend stores `stripe_session_id`.
6. Backend emails checkout link.
7. User pays on Stripe.
8. Stripe webhook sends `checkout.session.completed`.
9. Backend verifies Stripe webhook signature.
10. Backend marks payment as paid.
11. Backend triggers report generation.
12. Backend emails report link.

### Next-Stage Review

1. Tally submits to `/api/tally/review`.
2. Backend validates webhook.
3. Backend creates submission and review request.
4. Backend sends confirmation email.
5. Internal owner reviews request and decides:
   - AI-only scope,
   - AI + human review,
   - advisory,
   - decline / redirect to paid report.

## API endpoints

### `POST /api/tally/free`

Purpose: receive free Tally form submission.

Responsibilities:

- verify Tally secret,
- map fields,
- create submission,
- generate free report,
- email report link.

Response: `200 OK`

### `POST /api/tally/paid`

Purpose: receive paid Tally form submission.

Responsibilities:

- verify Tally secret,
- map fields,
- create submission,
- create Stripe Checkout session,
- save checkout URL,
- send checkout email.

Response: `200 OK`

### `POST /api/tally/review`

Purpose: receive review request.

Responsibilities:

- verify Tally secret,
- map fields,
- create submission,
- create review request,
- save uploaded file metadata if available,
- send confirmation email.

Response: `200 OK`

### `POST /api/checkout/create`

Purpose: create Stripe Checkout session.

Input:

```json
{
  "submission_id": "uuid"
}
```

Output:

```json
{
  "checkout_url": "https://checkout.stripe.com/..."
}
```

### `POST /api/stripe/webhook`

Purpose: receive Stripe events.

Required events:

- `checkout.session.completed`
- optionally `checkout.session.expired`

On successful payment:

- retrieve `submission_id` from Stripe metadata,
- mark payment paid,
- generate report,
- email report link.

### `GET /report/[token]`

Purpose: private report page.

Use a random unguessable token. Do not expose sequential report IDs.

## Idempotency

Every webhook endpoint must be idempotent.

Create an `event_id` or hash from:

- Tally submission ID when available,
- Stripe event ID,
- timestamp + form ID + email fallback.

Before processing, check if event already exists in `events`.

If yes, return `200 OK` and do nothing.

## Error handling

If report generation fails:

- set `report_status = failed`,
- store error in `report_generation_errors`,
- email owner,
- optionally email user: "Your report is being reviewed."

Do not silently fail.

## Report generation pipeline

For each submission:

1. Normalize founder input.
2. Select benchmark records.
3. Score evidence quality.
4. Score readiness.
5. Calculate directional valuation.
6. Identify gaps.
7. Prioritize actions.
8. Generate executive summary.
9. Assemble report JSON.
10. Render HTML.
11. Generate PDF if enabled.
12. Store report.
13. Send email.

## Data model states

### `submission.report_status`

- received
- checkout_created
- payment_required
- generating
- generated
- emailed
- failed
- review_requested
- scoped
- declined

### `submission.payment_status`

- not_required
- pending
- paid
- failed
- refunded

## Security

- Never expose Supabase service role key to the browser.
- Use service role key only in server-side functions.
- Store OpenAI, Stripe, Resend keys as environment variables.
- Use private report tokens.
- Enable RLS on tables if any client-side access is added.
- Avoid storing uploaded documents publicly unless intentionally configured.

## PDF generation recommendation

Recommended final approach:

- render report as HTML first,
- generate PDF from the same HTML using Playwright or Puppeteer,
- store PDF in Supabase Storage or Vercel Blob.

Alternative simpler approach:

- deliver HTML report first,
- add PDF export later.

Perceived value matters. If PDF is included, make it visually clean and branded.
