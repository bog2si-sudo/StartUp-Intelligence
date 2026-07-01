# 22_IMPLEMENTATION_CONTRACT.md

Status: Active  
Authority: Authoritative coding-agent contract  
Supersedes: conflicting agent instructions, implementation notes, and milestone guidance in lower-numbered or superseded documents  
Applies to: GitHub Codespaces Agent, AI coding agents, human maintainers using repository documentation

## Purpose

This document is the implementation contract for the repository.

The project is documentation-driven. The coding agent builds from repository documents. This contract exists to prevent documentation drift, architecture drift, schema drift, environment-variable drift, and milestone overreach.

This is not a greenfield project.

Milestones 1, 2, and 3 are completed and committed.

Future implementation begins from the current repository state and must proceed incrementally.

## Non-negotiable project rule

Do not redesign the product.

Do not reinterpret the architecture.

Do not simplify the system by deleting required flows.

Do not expand the system beyond the active milestone.

Do not invent missing business logic.

Do not rename existing contracts.

Do not make speculative improvements.

## Source of truth order

The coding agent must use this order of authority:

1. `00_REPOSITORY_INDEX.md`
2. Highest-numbered Active document relevant to the current implementation area
3. Lower-numbered Active documents that do not conflict with higher-numbered Active documents
4. Existing committed implementation
5. Superseded or Historical documents only when explicitly referenced by an Active document

If two Active documents overlap, the higher-numbered document wins unless the higher-numbered document explicitly delegates authority to the lower-numbered document.

If an Active document conflicts with committed code, do not redesign. Implement the smallest safe change needed to align the code with the Active document, but only inside the approved milestone scope.

If the conflict cannot be resolved without changing architecture, schema, or business logic, stop and report the conflict.

## Agent duties before implementation

Before making changes, the coding agent must:

1. Read `00_REPOSITORY_INDEX.md`.
2. Identify the Active documents relevant to the milestone.
3. Ignore Historical documents.
4. Ignore Superseded documents unless an Active document explicitly references them.
5. Read `20_SUPABASE_SCHEMA.sql` before any database-related work.
6. Read `25_ENVIRONMENT_VARIABLES.md` before any integration, webhook, API route, email, OpenAI, Stripe, Tally, Supabase, or deployment work.
7. Read this document before every milestone.
8. Read `23_AGENT_WORKFLOW.md` before every milestone.
9. Confirm the implementation scope is limited to the requested milestone.
10. Check for naming conflicts before modifying code.

## Prohibited actions

The coding agent must never:

- Redesign the application architecture.
- Invent business logic not present in Active documents.
- Modify `20_SUPABASE_SCHEMA.sql` during feature implementation.
- Rename environment variables.
- Add fallback environment variable names.
- Change repository architecture.
- Replace the documented stack.
- Change product tiers, pricing, funnel order, scoring concepts, or report structure unless an Active document explicitly instructs it.
- Merge milestone work with cleanup work unless the milestone explicitly requires it.
- Continue past the requested milestone.
- Commit without summarizing modified files.
- Push without explicit approval when the user has asked to review first.
- Treat Superseded documents as authoritative.
- Treat Historical documents as authoritative.
- Create incomplete scaffold files.
- Create abbreviated schemas.
- Omit required SQL sections.
- Leave unfinished task markers in production files.

## Required actions during implementation

The coding agent must always:

- Build incrementally.
- Keep changes minimal and milestone-scoped.
- Preserve existing committed behavior unless the milestone requires a change.
- Use exact environment variable names from `25_ENVIRONMENT_VARIABLES.md`.
- Treat `20_SUPABASE_SCHEMA.sql` as the database authority.
- Preserve RLS and server-only secret boundaries.
- Validate webhook signatures where webhook secrets are documented.
- Persist integration state according to the schema.
- Keep generated report logic aligned with the documented submission/report model.
- Run the project build after code changes.
- Run tests if tests exist for the touched area.
- Run lint/typecheck if configured.
- Run `git status` before summarizing.
- Summarize modified files.
- Summarize build/test results.
- Stop after completing the milestone.
- Wait for review or approval before moving to the next milestone.

## Schema contract

`20_SUPABASE_SCHEMA.sql` is the only database schema authority.

It supersedes `19_SUPABASE_SCHEMA.sql`.

Implementation must use the following canonical tables:

- `founders`
- `submissions`
- `payments`
- `events`
- `reports`
- `review_requests`
- `processing_errors`
- `email_logs`
- `benchmark_companies`
- `benchmark_patterns`
- `benchmark_transactions`
- `benchmark_sources`

Do not recreate older table models such as a standalone `assessments` table unless an Active future schema explicitly reintroduces it.

Do not add columns opportunistically.

Do not change enum values opportunistically.

Do not bypass RLS from browser code.

Trusted backend code may use `SUPABASE_SERVICE_ROLE_KEY`.

Browser code may use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` when client-side Supabase access is explicitly required.

## Environment variable contract

`25_ENVIRONMENT_VARIABLES.md` is the only environment-variable authority.

Implementation must use only these names:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TALLY_WEBHOOK_SECRET_FREE`
- `TALLY_WEBHOOK_SECRET_PAID`
- `TALLY_WEBHOOK_SECRET_REVIEW`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

If the code currently uses a different name, migrate it to the approved name inside the milestone only if the touched implementation path requires it.

Do not keep aliases.

Do not support both old and new names.

## Business logic contract

The product logic must remain aligned with Active documentation.

Canonical funnel:

1. Landing page
2. Free 15-question assessment
3. Email capture
4. Free results
5. Paid roadmap purchase
6. Paid add-on questions when applicable
7. AI-generated report/PDF
8. Consult or review CTA
9. Review/consult intake
10. Human follow-up

Canonical data model:

- Founder identity lives in `founders`.
- Form submissions live in `submissions`.
- Payments live in `payments`.
- Generated report state and content live in `reports`.
- Human review/consult requests live in `review_requests`.
- Operational events live in `events`.
- Processing failures live in `processing_errors`.
- Email delivery state lives in `email_logs`.
- Benchmark data lives in the `benchmark_*` tables.

Do not introduce a new canonical flow unless an Active future document approves it.

## Milestone boundary contract

For every milestone, the coding agent must identify:

- Requested milestone number or objective
- Files expected to be touched
- Active documents used
- Out-of-scope items deliberately avoided

The agent must implement only that milestone.

After completing the milestone, the agent must stop.

The agent must not start the next milestone automatically.

## Build contract

After implementation, the coding agent must run the configured build command.

If the repository uses `package.json`, inspect scripts and use the appropriate command.

Preferred order when available:

1. Typecheck
2. Lint
3. Tests
4. Build

If a command does not exist, report that it was unavailable.

If a command fails, stop and report:

- command run
- failure summary
- likely cause
- files related to the failure
- whether failure is caused by the current milestone or pre-existing repository state

Do not hide build failures.

Do not continue to unrelated work after a build failure.

## Git contract

Before changes:

- Check current branch.
- Check working tree status.
- Do not overwrite uncommitted user changes.

After changes:

- Run `git status`.
- Summarize modified files.
- Summarize build/test results.
- Wait for approval before committing if the workflow requires review.

Commit message format:

```text
Milestone X: concise implementation summary
```

For stabilization-only commits:

```text
Docs: stabilize repository authority documents
```

## Conflict handling

If the coding agent finds a conflict between documents:

1. Check `00_REPOSITORY_INDEX.md`.
2. Prefer Active over Superseded or Historical.
3. Prefer higher-numbered Active documents over lower-numbered Active documents.
4. Prefer explicit override statements over general statements.
5. If still unresolved, stop and report the conflict.

The report must include:

- conflicting files
- conflicting statements
- affected implementation area
- recommended resolution
- whether implementation can safely proceed

Do not guess.

Do not pick a convenient interpretation silently.

## Completion response contract

At the end of a milestone, the coding agent must provide:

- Milestone implemented
- Active documents used
- Files modified
- Commands run
- Build/test result
- Git status summary
- Anything intentionally not changed
- Next required human decision

Then stop.
