# 41_REPOSITORY_AUDIT_CURRENT.md

Status: Active Audit Report
Authority: Repository consistency audit for the next implementation milestone
Supersedes: None
Applies to: repository stabilization and milestone readiness
Audit executed: 2026-07-02

---

## Repository Health

FAIL

Two blockers confirmed before next milestone. Build passes. Documentation is consistent.

---

## Documentation

PASS

Evidence (verified):

- [00_REPOSITORY_INDEX.md](00_REPOSITORY_INDEX.md) is present and establishes the active, superseded, and historical authority model. Authority hierarchy is correctly defined.
- [20_SUPABASE_SCHEMA.sql](20_SUPABASE_SCHEMA.sql) is present and designated as the highest database authority in the index.
- [22_IMPLEMENTATION_CONTRACT.md](22_IMPLEMENTATION_CONTRACT.md) is present. It defines prohibited and required coding-agent actions and references the correct authority chain.
- [23_AGENT_WORKFLOW.md](23_AGENT_WORKFLOW.md) is present and referenced correctly in the index.
- [25_ENVIRONMENT_VARIABLES.md](25_ENVIRONMENT_VARIABLES.md) is present. It lists exactly 13 approved variable names.
- [40_REPOSITORY_AUDIT.md](40_REPOSITORY_AUDIT.md) is a historical reference and is not treated as an implementation authority.

---

## Schema

PASS

Evidence (verified):

- [20_SUPABASE_SCHEMA.sql](20_SUPABASE_SCHEMA.sql) is the active schema authority. It is present in the repository root.
- [19_SUPABASE_SCHEMA.sql](19_SUPABASE_SCHEMA.sql) is explicitly superseded in the index and was not used during this audit.
- No code was found referencing the older `assessments` table model as a canonical table.

---

## Environment Variables

FAIL

Evidence (verified against [lib/env.ts](lib/env.ts) and [25_ENVIRONMENT_VARIABLES.md](25_ENVIRONMENT_VARIABLES.md)):

Unapproved variables found in [lib/env.ts](lib/env.ts):

| Variable | Present in lib/env.ts | Approved in 25_ENVIRONMENT_VARIABLES.md |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | No — not listed |
| `STRIPE_PRICE_PAID_REPORT` | Yes | No — not listed |
| `INTERNAL_ALERT_EMAIL` | Yes | No — not listed |

All 13 approved variables from [25_ENVIRONMENT_VARIABLES.md](25_ENVIRONMENT_VARIABLES.md) were cross-checked. The three variables above are not approved and must be removed.

Additionally, `INTERNAL_ALERT_EMAIL` is actively used as a runtime fallback in [app/api/tally/free/route.ts](app/api/tally/free/route.ts) and [app/api/tally/paid/route.ts](app/api/tally/paid/route.ts), creating a runtime dependency on an unapproved variable.

---

## Implementation

FAIL

Evidence (verified against [lib/tally.ts](lib/tally.ts) and the three webhook routes):

Finding 1 — Unapproved variable in runtime code:

- [app/api/tally/free/route.ts](app/api/tally/free/route.ts) and [app/api/tally/paid/route.ts](app/api/tally/paid/route.ts) reference `env.INTERNAL_ALERT_EMAIL` as an email fallback. This variable is not approved by [25_ENVIRONMENT_VARIABLES.md](25_ENVIRONMENT_VARIABLES.md).

Finding 2 — Webhook signature bypass when secret is not set:

- `verifyTallyRequest` in [lib/tally.ts](lib/tally.ts) returns `true` when `expectedSecret` is `undefined` or empty. This means that if a Tally webhook secret environment variable is missing at runtime, all requests are silently accepted without any signature check. This is a security vulnerability: an unset secret disables authentication rather than blocking requests.
- [22_IMPLEMENTATION_CONTRACT.md](22_IMPLEMENTATION_CONTRACT.md) requires: "Validate webhook signatures where webhook secrets are documented."

Finding 3 — No preflight secret validation in route handlers:

- None of the three webhook routes check whether the required secret is present before attempting to process the request. If the secret is absent, the handler proceeds with `verifyTallyRequest` returning `true`.

Confirmed structural positives:

- All three webhook routes are present and export a `POST` handler.
- `verifyTallyRequest` and `parseTallyPayload` are consistently used across all three routes.
- Route structure is consistent with the documented webhook-first architecture.

---

## Build

PASS

Evidence (verified by running `npm run build`):

- Build completed without errors.
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

### Blocker 1 — Unapproved environment variables (Severity: High)

- Files: [lib/env.ts](lib/env.ts), [app/api/tally/free/route.ts](app/api/tally/free/route.ts), [app/api/tally/paid/route.ts](app/api/tally/paid/route.ts)
- Explanation: `NEXT_PUBLIC_SITE_URL`, `STRIPE_PRICE_PAID_REPORT`, and `INTERNAL_ALERT_EMAIL` are defined in `lib/env.ts` and are not approved by [25_ENVIRONMENT_VARIABLES.md](25_ENVIRONMENT_VARIABLES.md). `INTERNAL_ALERT_EMAIL` is actively used in two route handlers.
- Required Fix: Remove the three unapproved variables from `lib/env.ts`. Remove usages of `env.INTERNAL_ALERT_EMAIL` from the two route handlers.

### Blocker 2 — Webhook authentication bypass when secret is missing (Severity: High)

- Files: [lib/tally.ts](lib/tally.ts), [app/api/tally/free/route.ts](app/api/tally/free/route.ts), [app/api/tally/paid/route.ts](app/api/tally/paid/route.ts), [app/api/tally/review/route.ts](app/api/tally/review/route.ts)
- Explanation: `verifyTallyRequest` returns `true` when `expectedSecret` is falsy, meaning an unset secret disables signature verification entirely. This is a security vulnerability and violates the implementation contract requirement to validate webhook signatures.
- Required Fix: `verifyTallyRequest` must reject the request (return `false` or throw) when `expectedSecret` is not set. Route handlers must also perform preflight validation confirming the required secret is present before processing.

---

## Automatic Fixes Performed

None.

---

## Files Modified

- [41_REPOSITORY_AUDIT_CURRENT.md](41_REPOSITORY_AUDIT_CURRENT.md)

---

## Final Summary

The repository has two high-severity blockers that must be resolved before the next implementation milestone proceeds:

1. Three unapproved environment variables in [lib/env.ts](lib/env.ts), with one (`INTERNAL_ALERT_EMAIL`) actively used in route handlers.
2. Webhook authentication bypass in [lib/tally.ts](lib/tally.ts) when the webhook secret environment variable is not set.

Documentation consistency is confirmed. Build is passing. Schema authority is correctly established. These two code-level issues must be fixed before milestone work continues.