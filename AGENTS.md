# AGENTS

This repository uses a Next.js app shell with webhook-backed Tally flows, Supabase persistence, Stripe checkout, Resend email, and OpenAI report generation.

## Purpose

Help AI coding agents work effectively in this repository by providing:
- key architecture and implementation boundaries,
- project-specific conventions,
- build and validation commands,
- authoritative documentation references.

## Build and validation commands

Use these commands from the repository root:
- `npm run dev` — local Next.js development server
- `npm run build` — production build and TypeScript validation
- `npm run lint` — linting

## Architecture summary

- Frontend: Next.js app router in `/app`
- API routes:
  - `/app/api/tally/free/route.ts`
  - `/app/api/tally/paid/route.ts`
  - `/app/api/tally/review/route.ts`
  - `/app/api/stripe/webhook/route.ts`
- Backend helpers live in `/lib`:
  - `env.ts`, `tally.ts`, `resend.ts`, `openai.ts`, `supabase.ts`, `stripe.ts`
- The app uses serverless-style request handlers and no custom Node server.

## Document sources

The repository documentation is the primary source of truth.
When documents overlap, prefer the later-numbered document unless an earlier file explicitly states it overrides a later one.

Key docs:
- `README.md` — project overview and stack
- `04_BACKEND_TECH_SPEC.md` — backend flow and API expectations
- `22_VERCEL_SETUP.md` — deployment/webhook hosting rules
- `25_ENVIRONMENT_VARIABLES.md` — runtime environment variables
- `10_CURSOR_BUILD_INSTRUCTIONS.md` — build brief and implementation expectations
- `TESTING_32.md` — testing expectations before production

## Important conventions

- Do not change the technology stack: Next.js, Vercel, Supabase, Stripe, Tally, Resend, OpenAI.
- Do not invent business rules. Derive behavior from the numbered product and technical documents.
- Preserve deterministic, evidence-based report generation.
- Keep changes minimal and aligned with repository documentation.

## Environment variables

Use `25_ENVIRONMENT_VARIABLES.md` as the main source for env variable names.
If code appears to use different names than documented, do not change either the docs or runtime names without clarification from the maintainer.

## When repairing or extending code

- Confirm API route names and request expectations from the actual source files and matching docs.
- Validate any webhook or secret handling against `lib/tally.ts`, `app/api/tally/*/route.ts`, and `app/api/stripe/webhook/route.ts`.
- Preserve the documented flow for free, paid, and review reports.
- Validate any OpenAI prompt/schema expectations against `lib/openai.ts` and the prompt/template docs in `24A_OPENAI_SYSTEM_PROMPT.md`, `24B_OPENAI_REPORT_TEMPLATE.md`, `24C_OPENAI_OUTPUT_RULES.md`, and `24D_OPENAI_EXAMPLES.md`.

## Clarifications needed

- If environment variable names in docs and code differ, ask before changing.
- If business logic is unclear or conflicting, stop and request clarification rather than guessing.
