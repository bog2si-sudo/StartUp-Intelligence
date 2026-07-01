# 25_ENVIRONMENT_VARIABLES.md

Status: Active  
Authority: Authoritative environment variable contract  
Supersedes: any previous environment-variable sections in repository documents  
Applies to: local development, GitHub Codespaces, Vercel, Supabase Edge/SQL usage, Make/Zapier-style server automation where used

## Purpose

This document defines the only approved environment variable names for the project.

The repository is documentation-driven. The coding agent must use exactly these names and must not introduce aliases, alternate spellings, or compatibility variables.

## Repository rule

If any other document, code sample, README, prompt, or implementation note uses a different name for the same secret or configuration value, this document wins.

Do not rename these variables during implementation.

Do not create fallback names.

Do not infer missing variables.

Do not expose server-only values to browser/client code.

## Approved variables

| Variable | Required | Visibility | Used by | Purpose |
|---|---:|---|---|---|
| `SUPABASE_URL` | Yes | Server only | API routes, webhooks, background/server processing | Supabase project URL used by trusted backend code. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only, secret | API routes, webhooks, background/server processing | Supabase service role key. Bypasses RLS. Never expose to browser code. |
| `TALLY_WEBHOOK_SECRET_FREE` | Yes | Server only, secret | Free assessment webhook handler | Secret used to verify Tally webhook requests for the free assessment form. |
| `TALLY_WEBHOOK_SECRET_PAID` | Yes | Server only, secret | Paid roadmap webhook handler | Secret used to verify Tally webhook requests for the paid roadmap form. |
| `TALLY_WEBHOOK_SECRET_REVIEW` | Yes | Server only, secret | Review/consult intake webhook handler | Secret used to verify Tally webhook requests for the review or consult intake form. |
| `STRIPE_SECRET_KEY` | Yes | Server only, secret | Payment and checkout server code | Stripe secret key used to create/read checkout sessions, payment intents, and related server-side Stripe operations. |
| `STRIPE_WEBHOOK_SECRET` | Yes | Server only, secret | Stripe webhook handler | Stripe webhook signing secret used to verify incoming Stripe events. |
| `RESEND_API_KEY` | Yes | Server only, secret | Email delivery server code | Resend API key used to send transactional emails. |
| `RESEND_FROM_EMAIL` | Yes | Server only | Email delivery server code | Verified sender address used for outbound transactional emails. |
| `OPENAI_API_KEY` | Yes | Server only, secret | Report generation server code | OpenAI API key used by server-side report generation. |
| `OPENAI_MODEL` | Yes | Server only | Report generation server code | Model identifier used for report generation. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes only if browser Supabase client is used | Public browser-safe | Client-side Supabase initialization | Public Supabase URL for browser code. This may equal `SUPABASE_URL`, but must remain a separate variable because the `NEXT_PUBLIC_` prefix exposes it to the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes only if browser Supabase client is used | Public browser-safe | Client-side Supabase initialization | Supabase anon key for browser code. This must not be confused with the service role key. |

## Local development

Local development uses a local `.env.local` file.

`.env.local` must not be committed.

Required local server variables:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TALLY_WEBHOOK_SECRET_FREE=
TALLY_WEBHOOK_SECRET_PAID=
TALLY_WEBHOOK_SECRET_REVIEW=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
OPENAI_API_KEY=
OPENAI_MODEL=
```

Optional local browser variables, required only when browser/client Supabase code exists:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Local development must use test-mode Stripe keys unless explicitly working against production payment infrastructure.

Local development must use non-production Supabase credentials unless intentionally validating a production issue.

## GitHub Codespaces

GitHub Codespaces must define the same variable names as local development.

Store secrets using Codespaces secrets or repository-level development secrets. Do not hardcode values in repository files.

Codespaces must include:

```bash
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TALLY_WEBHOOK_SECRET_FREE
TALLY_WEBHOOK_SECRET_PAID
TALLY_WEBHOOK_SECRET_REVIEW
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
OPENAI_API_KEY
OPENAI_MODEL
```

Codespaces includes the public variables only if client-side Supabase code is implemented:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

The coding agent must not proceed with implementation if a required variable is missing for the milestone being worked on. It must report the missing variable names exactly as listed here.

## Vercel

Vercel is the production and preview runtime for web/API deployment when used by the project.

Configure variables in Vercel Project Settings → Environment Variables.

Server-only variables must be configured for Preview and Production as needed:

```bash
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TALLY_WEBHOOK_SECRET_FREE
TALLY_WEBHOOK_SECRET_PAID
TALLY_WEBHOOK_SECRET_REVIEW
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
OPENAI_API_KEY
OPENAI_MODEL
```

Public browser variables must be configured in Vercel only when client-side Supabase code exists:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Never configure `SUPABASE_SERVICE_ROLE_KEY` as a `NEXT_PUBLIC_` variable.

Never read `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, webhook secrets, `RESEND_API_KEY`, or `OPENAI_API_KEY` from client-side code.

## Supabase

Supabase itself stores database tables, RLS policies, SQL functions, and storage objects.

The application reads Supabase connection values from runtime environment variables. The schema must not contain runtime secrets.

Supabase SQL migrations must never embed:

```bash
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
OPENAI_API_KEY
TALLY_WEBHOOK_SECRET_FREE
TALLY_WEBHOOK_SECRET_PAID
TALLY_WEBHOOK_SECRET_REVIEW
```

If Supabase Edge Functions are introduced in a future milestone, they must use the same variable names from this document.

## Server-only variables

The following variables are secret or server-only and must never be referenced from browser/client components:

```bash
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TALLY_WEBHOOK_SECRET_FREE
TALLY_WEBHOOK_SECRET_PAID
TALLY_WEBHOOK_SECRET_REVIEW
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
OPENAI_API_KEY
OPENAI_MODEL
```

`SUPABASE_URL` and `RESEND_FROM_EMAIL` are not secrets, but they are still treated as server configuration unless a browser use case is explicitly documented.

## Public browser variables

The only approved browser-exposed variables are:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

These values may be embedded in browser bundles because of the `NEXT_PUBLIC_` prefix.

No other variable may be exposed to the browser.

## Naming rules for implementation

Implementation code must use exact names.

Approved:

```ts
process.env.SUPABASE_SERVICE_ROLE_KEY
process.env.STRIPE_WEBHOOK_SECRET
process.env.OPENAI_MODEL
```

Not approved:

```ts
process.env.SUPABASE_KEY
process.env.SUPABASE_SECRET_KEY
process.env.SUPABASE_SERVICE_KEY
process.env.TALLY_SECRET
process.env.TALLY_WEBHOOK_SECRET
process.env.STRIPE_SIGNING_SECRET
process.env.RESEND_FROM
process.env.OPENAI_MODEL_NAME
```

## Runtime validation

Server startup and webhook handlers should validate required variables before executing external calls.

Validation error messages must name the missing approved variable exactly.

Example error message:

```text
Missing required environment variable: STRIPE_WEBHOOK_SECRET
```

Do not silently continue with undefined configuration.

Do not substitute one variable for another.

Do not add compatibility fallbacks.

## Milestone rule

Before starting any milestone that touches integrations, the coding agent must read this file and confirm that the implementation uses only the approved names.

If a milestone requires a new environment variable, the agent must stop and request approval to update this document before changing code.
