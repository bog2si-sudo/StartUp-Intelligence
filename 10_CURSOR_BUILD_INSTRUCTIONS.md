# 10 — Cursor Build Instructions

This file is intended to be copied into Cursor as the build brief.

## Goal

Build a Next.js application on Vercel that powers a three-offer startup assessment product.

The app must support:

1. Tally webhook intake for free assessment.
2. Tally webhook intake for paid report.
3. Stripe Checkout for paid report.
4. Stripe webhook fulfillment.
5. Tally webhook intake for Next-Stage Review request.
6. Supabase database persistence.
7. OpenAI modular report generation.
8. Resend transactional emails.
9. Private report pages.
10. Optional PDF generation from report HTML.

## Tech stack

- Next.js App Router
- TypeScript
- Vercel deployment
- Supabase JS client
- Stripe Node SDK
- Resend Node SDK
- OpenAI Node SDK
- Markdown rendering
- Optional Playwright/Puppeteer for PDF

## Step 1 — Create project

Create a new Next.js TypeScript project.

Required dependencies:

```bash
npm install @supabase/supabase-js stripe resend openai zod nanoid marked
```

Optional PDF:

```bash
npm install playwright
```

## Step 2 — Create environment variable handling

Create `/lib/env.ts`.

It should validate required environment variables:

- NEXT_PUBLIC_SITE_URL
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_PAID_REPORT
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- OPENAI_API_KEY
- OPENAI_MODEL
- TALLY_WEBHOOK_SECRET_FREE
- TALLY_WEBHOOK_SECRET_PAID
- TALLY_WEBHOOK_SECRET_REVIEW
- INTERNAL_ALERT_EMAIL

Use Zod validation.

## Step 3 — Supabase client

Create `/lib/supabase.ts`.

Use service role key server-side only.

Do not expose service role key to client.

## Step 4 — Stripe client

Create `/lib/stripe.ts`.

Initialize Stripe with secret key.

## Step 5 — Resend client

Create `/lib/resend.ts`.

Create helper:

`sendEmail({ to, subject, html, text, submissionId, templateName })`

Log to `email_logs`.

## Step 6 — OpenAI client

Create `/lib/openai.ts`.

Create helper:

`runJsonPrompt({ system, prompt, schemaDescription })`

It should return parsed JSON.

Handle invalid JSON with one retry asking model to fix JSON.

## Step 7 — Field mapping for Tally

Create `/lib/tally.ts`.

Functions:

- `verifyTallyRequest(req, expectedSecret)`
- `parseTallyPayload(payload)`
- `mapFreeFields(payload)`
- `mapPaidFields(payload)`
- `mapReviewFields(payload)`

Important:

Tally payload structure can vary. Implement robust extraction by question label and field key.

Store raw payload always.

## Step 8 — API route: Free Tally webhook

Create `/app/api/tally/free/route.ts`.

Behavior:

1. Read raw request.
2. Verify secret.
3. Parse payload.
4. Create idempotency event.
5. Create submission:
   - report_type = free
   - payment_status = not_required
   - report_status = generating
   - report_token = nanoid(32)
6. Generate free report.
7. Store report.
8. Email report link.
9. Return 200.

## Step 9 — API route: Paid Tally webhook

Create `/app/api/tally/paid/route.ts`.

Behavior:

1. Verify secret.
2. Parse and map payload.
3. Create idempotency event.
4. Create submission:
   - report_type = paid
   - payment_status = pending
   - report_status = payment_required
   - report_token = nanoid(32)
5. Create Stripe Checkout session:
   - line item uses STRIPE_PRICE_PAID_REPORT
   - metadata includes submission_id
   - customer_email from form
   - success_url = `${SITE_URL}/checkout/success`
   - cancel_url = `${SITE_URL}/checkout/cancel`
6. Store checkout URL.
7. Email checkout link.
8. Return 200.

## Step 10 — API route: Stripe webhook

Create `/app/api/stripe/webhook/route.ts`.

Important:

Use raw body for Stripe signature verification.

Handle event:

`checkout.session.completed`

Behavior:

1. Verify Stripe signature.
2. Check idempotency by Stripe event ID.
3. Read submission_id from session metadata.
4. Mark payment paid.
5. Mark submission generating.
6. Generate paid report.
7. Store report.
8. Email report link.
9. Mark report emailed.

## Step 11 — API route: Review Tally webhook

Create `/app/api/tally/review/route.ts`.

Behavior:

1. Verify secret.
2. Parse payload.
3. Create submission:
   - report_type = review
   - payment_status = pending
   - report_status = review_requested
4. Create review_requests row.
5. Send confirmation email.
6. Optionally send owner alert email.

## Step 12 — Benchmark selector

Create `/lib/benchmarks.ts`.

Function:

`selectBenchmarks(normalizedInput)`

It should query:

- benchmark_patterns
- comparable_transactions

Priority:

1. same country + sector + stage
2. same country + sector
3. same region + sector + stage
4. same region + sector
5. Europe + sector + stage
6. Europe + sector
7. closest proxy

Return selected records plus coverage quality.

## Step 13 — Report generation pipeline

Create `/lib/reports.ts`.

Functions:

- `generateFreeReport(submissionId)`
- `generatePaidReport(submissionId)`
- `generateReportPipeline(submission, reportType)`

Pipeline:

1. normalize founder input
2. select benchmarks
3. evidence scoring
4. readiness scoring
5. valuation reasoning
6. gap analysis
7. action prioritization
8. decision readiness
9. executive summary
10. assemble markdown
11. render HTML
12. save report

Use prompts from `/prompts`.

## Step 14 — Report page

Create `/app/report/[token]/page.tsx`.

Behavior:

1. Look up submission by `report_token`.
2. Fetch latest report.
3. Render HTML safely.
4. Provide "Download PDF" button if PDF exists.
5. If report not ready, show "Report is being generated."

## Step 15 — Checkout pages

Create:

- `/app/checkout/success/page.tsx`
- `/app/checkout/cancel/page.tsx`

Success text:

Payment received. Your report will be generated and emailed to you.

Cancel text:

Checkout was not completed. You can use the link in your email to complete payment.

## Step 16 — Admin / manual operations

For first version, no admin UI needed.

Use Supabase dashboard for:

- checking submissions,
- reviewing failed reports,
- editing benchmark data,
- reviewing Next-Stage Review requests.

Later, build a simple `/admin` area.

## Step 17 — Error handling

Any failed webhook/report generation should:

1. log error to `processing_errors`,
2. set report_status = failed,
3. send alert to INTERNAL_ALERT_EMAIL,
4. return safe response.

Never expose stack traces to users.

## Step 18 — Test locally

Use:

- Vercel dev
- Stripe CLI for webhooks
- Tally test submissions
- Supabase test project
- Resend test emails

## Step 19 — Deploy

1. Push to GitHub.
2. Import repo in Vercel.
3. Add env vars in Vercel.
4. Set production webhook URLs in Tally.
5. Set production webhook URL in Stripe.
6. Run end-to-end test.

## Cursor instruction

Build this incrementally. Do not skip database persistence. Do not generate reports before submissions are saved. Do not process paid reports before Stripe confirms payment. Use idempotency for every webhook. Keep all prompt outputs as JSON first, then assemble the report.
