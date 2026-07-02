# 42_REPOSITORY_AFTER_AUDIT_FIX.md

Status: Active
Authority: Post-audit fix verification record
Supersedes: None
Applies to: verification of blockers identified in 41_REPOSITORY_AUDIT_CURRENT.md
Fix executed: 2026-07-02

---

## Purpose

This document records the fixes applied to resolve the two high-severity blockers identified in [41_REPOSITORY_AUDIT_CURRENT.md](41_REPOSITORY_AUDIT_CURRENT.md).

No architecture was changed. No milestone was started. Only the two documented blockers were resolved.

---

## Blocker 1 — Unapproved environment variables

Status: RESOLVED

### Changes made

**[lib/env.ts](lib/env.ts)**

Removed three unapproved variables:
- `NEXT_PUBLIC_SITE_URL` — not listed in [25_ENVIRONMENT_VARIABLES.md](25_ENVIRONMENT_VARIABLES.md)
- `STRIPE_PRICE_PAID_REPORT` — not listed in [25_ENVIRONMENT_VARIABLES.md](25_ENVIRONMENT_VARIABLES.md)
- `INTERNAL_ALERT_EMAIL` — not listed in [25_ENVIRONMENT_VARIABLES.md](25_ENVIRONMENT_VARIABLES.md)

Added two approved variables that were previously missing from the schema:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The env schema now contains exactly the 13 approved variables defined in [25_ENVIRONMENT_VARIABLES.md](25_ENVIRONMENT_VARIABLES.md).

**[app/api/tally/free/route.ts](app/api/tally/free/route.ts)**

Removed `env.INTERNAL_ALERT_EMAIL` fallback from the `sendEmail` call. The `to` field now uses `payload?.data?.email` only.

**[app/api/tally/paid/route.ts](app/api/tally/paid/route.ts)**

Removed `env.INTERNAL_ALERT_EMAIL` fallback from the `sendEmail` call. The `to` field now uses `payload?.data?.email` only.

---

## Blocker 2 — Webhook authentication bypass when secret is missing

Status: RESOLVED

### Changes made

**[lib/tally.ts](lib/tally.ts)**

`verifyTallyRequest` now returns `false` when `expectedSecret` is not set, instead of returning `true`. An absent or empty secret now causes the verification to fail rather than silently bypassing authentication.

Before:
```ts
if (!expectedSecret) {
  return true; // bypass — security vulnerability
}
```

After:
```ts
if (!expectedSecret) {
  return false; // reject — no secret means no trust
}
```

**[app/api/tally/free/route.ts](app/api/tally/free/route.ts)**
**[app/api/tally/paid/route.ts](app/api/tally/paid/route.ts)**
**[app/api/tally/review/route.ts](app/api/tally/review/route.ts)**

All three webhook route handlers now include a preflight check at the top of the `POST` handler. If the required Tally webhook secret environment variable is not set at runtime, the handler immediately returns HTTP 500 before processing any request body.

Example (applied to all three routes):
```ts
if (!env.TALLY_WEBHOOK_SECRET_FREE) {
  return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
}
```

---

## Build result

Status: PASS

`npm run build` completed successfully after all fixes.

All expected routes are present in the build output:
- `/api/stripe/webhook`
- `/api/tally/free`
- `/api/tally/paid`
- `/api/tally/review`
- `/report/[token]`
- `/checkout/cancel`
- `/checkout/success`

TypeScript and lint checks passed with no errors.

---

## Files modified

| File | Change |
|---|---|
| [lib/env.ts](lib/env.ts) | Removed 3 unapproved variables; added 2 approved variables that were missing |
| [lib/tally.ts](lib/tally.ts) | `verifyTallyRequest` returns `false` instead of `true` when secret is missing |
| [app/api/tally/free/route.ts](app/api/tally/free/route.ts) | Added preflight 500 check; removed `INTERNAL_ALERT_EMAIL` fallback |
| [app/api/tally/paid/route.ts](app/api/tally/paid/route.ts) | Added preflight 500 check; removed `INTERNAL_ALERT_EMAIL` fallback |
| [app/api/tally/review/route.ts](app/api/tally/review/route.ts) | Added preflight 500 check |
| [42_REPOSITORY_AFTER_AUDIT_FIX.md](42_REPOSITORY_AFTER_AUDIT_FIX.md) | Created — this document |

---

## Repository health after fix

| Area | Status |
|---|---|
| Documentation | PASS |
| Schema | PASS |
| Environment variables | PASS |
| Implementation | PASS |
| Build | PASS |

**Overall: PASS**

Both blockers from [41_REPOSITORY_AUDIT_CURRENT.md](41_REPOSITORY_AUDIT_CURRENT.md) are resolved. The repository is now ready for the next milestone.
