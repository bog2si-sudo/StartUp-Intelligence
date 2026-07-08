# 00_REPOSITORY_INDEX.md

Status: Active  
Authority: Highest-level repository navigation and documentation authority  
Supersedes: informal README navigation, older document ordering assumptions, and any document that does not clearly declare its own authority  
Last stabilization target: post Milestone 3, before Milestone 4

## Purpose

This repository is documentation-driven.

The AI coding agent builds strictly from repository documentation. This index exists to stop documentation drift and establish one authoritative source of truth for future implementation milestones.

Every contributor and coding agent must read this file first.

## Repository rules

1. Read this file first before reading any other project document.
2. Active documents are authoritative.
3. Superseded documents are not implementation authorities.
4. Historical documents are not implementation authorities.
5. Ignore Historical documents during implementation.
6. Ignore Superseded documents during implementation unless an Active document explicitly references them.
7. If Active documents overlap, the higher-numbered document wins unless explicitly overridden.
8. Never invent architecture.
9. Never redesign the product during implementation milestones.
10. Never rename environment variables without first updating the authoritative environment-variable document.
11. Never modify the database schema during feature implementation unless the active milestone explicitly requires an approved schema migration.
12. Build incrementally.
13. Stop after each milestone.
14. Summarize modified files and build results before moving forward.
15. Wait for approval before commit/push when review is expected.

## Document status definitions

### Active

An Active document is authoritative and may be used for implementation.

### Superseded

A Superseded document has been replaced by a newer document. It may remain in the repository for traceability, but it must not be used as an implementation authority.

### Historical

A Historical document explains previous thinking, earlier drafts, research, or decisions that are no longer directly executable. It must not be used as an implementation authority.

### Reference

A Reference document may provide context, examples, or background. It is not authoritative unless an Active document explicitly says so.

## Authority model

The repository uses numbered documents.

When two Active documents overlap, the higher-numbered document wins unless the higher-numbered document explicitly delegates authority back to a lower-numbered document.

Examples:

- `25_ENVIRONMENT_VARIABLES.md` wins over any environment-variable names mentioned elsewhere.
- `23_AGENT_WORKFLOW.md` wins over informal workflow notes elsewhere.
- `22_IMPLEMENTATION_CONTRACT.md` wins over older coding-agent instructions.
- `20_SUPABASE_SCHEMA.sql` wins over `19_SUPABASE_SCHEMA.sql` and any older schema notes.
- This file wins for document status and navigation.

## Active authoritative documents

| Document | Purpose | Status | Authority | Supersedes | Implementation notes |
|---|---|---|---|---|---|
| `00_REPOSITORY_INDEX.md` | Repository navigation, document status, and authority rules. | Active | Highest-level documentation authority. | Informal README navigation and any older document-status assumptions. | Read first before every milestone. If another document conflicts on status or authority, this file wins. |
| `20_SUPABASE_SCHEMA.sql` | Complete production Supabase schema. | Active | Highest database authority. | `19_SUPABASE_SCHEMA.sql` and all older database schema notes. | Use for tables, enums, indexes, triggers, RLS, comments, and database naming. Do not abbreviate or fork. |
| `22_IMPLEMENTATION_CONTRACT.md` | Coding-agent implementation contract. | Active | Highest implementation behavior authority. | Older agent instructions, milestone execution notes, and conflicting workflow prompts. | Defines what the coding agent may and may not do. Must be read before every milestone. |
| `23_AGENT_WORKFLOW.md` | Exact milestone workflow for coding agents. | Active | Highest milestone workflow authority. | Older workflow instructions and informal agent operating notes. | Defines read → implement → build → status → summarize → wait → commit → push → stop. |
| `25_ENVIRONMENT_VARIABLES.md` | Standard environment-variable contract. | Active | Highest environment-variable authority. | Any older `.env`, deployment, README, webhook, or integration variable names. | Use only approved names. Do not add aliases or fallback names. |
| `27_VERSION_CONTRACT.md` | Canonical application version identifiers. | Active | Authoritative for all version strings used at runtime. | Placeholder version strings in `lib/versions.ts` and any informal version references elsewhere. | Source code must derive version constants only from `lib/versions.ts`, which must mirror this document exactly. |
| `50_REASONING_IMPLEMENTATION_CONTRACT.md` | Implementation contract for Milestone 5 reasoning pipeline. | Active | Highest authority for reasoning implementation, slice boundaries, deterministic vs LLM responsibilities, allowed persistence, and sequencing. | Conflicting reasoning implementation guidance in older documents. | Must be read before any Milestone 5 reasoning, prompt, OpenAI, report-content, or narrative-generation implementation. |

## Superseded documents

| Document | Purpose | Status | Authority | Superseded by | Implementation notes |
|---|---|---|---|---|---|
| `19_SUPABASE_SCHEMA.sql` | Earlier Supabase schema. | Superseded | None for new implementation. | `20_SUPABASE_SCHEMA.sql` | Do not use for implementation. Retain only for history or migration comparison. The canonical table model is now in `20_SUPABASE_SCHEMA.sql`. |
| Any older environment variable section in README files, implementation documents, deployment documents, webhook documents, or milestone notes | Earlier environment setup references. | Superseded | None for new implementation. | `25_ENVIRONMENT_VARIABLES.md` | If variable names differ, use `25_ENVIRONMENT_VARIABLES.md`. Do not keep compatibility aliases. |
| Any older agent workflow, coding-agent prompt, or implementation instruction document | Earlier instructions for AI coding agents. | Superseded | None for new implementation. | `22_IMPLEMENTATION_CONTRACT.md` and `23_AGENT_WORKFLOW.md` | Use only the Active implementation contract and workflow. |

## Existing repository documents not explicitly listed above

The repository contains many architecture and implementation documents created before this stabilization pass.

Until each of those files is explicitly reclassified in this index, they must be treated as Reference or Historical for implementation purposes, not as binding implementation authority.

This rule prevents the coding agent from wasting credits reconciling older overlapping documents.

A pre-existing document may be promoted back to Active only by editing this index and assigning it:

- purpose
- status
- authority
- supersession relationship
- implementation notes

Do not infer Active status from filename alone.

Do not infer Active status from recent modification time alone.

Do not infer Active status because a document looks detailed.

## Canonical implementation model after stabilization

### Database

The canonical database schema is `20_SUPABASE_SCHEMA.sql`.

Canonical tables:

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

Older references to `assessments` as a canonical table are superseded.

### Environment variables

The canonical environment variables are defined only in `25_ENVIRONMENT_VARIABLES.md`.

Approved names:

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

No aliases are approved.

### Coding-agent behavior

The canonical coding-agent contract is `22_IMPLEMENTATION_CONTRACT.md`.

The canonical milestone workflow is `23_AGENT_WORKFLOW.md`.

The agent must not start Milestone 4 until these stabilization documents are uploaded and committed.

## Milestone implementation rule

For every future milestone, the coding agent must perform this sequence:

1. Read `00_REPOSITORY_INDEX.md`.
2. Read relevant Active documents.
3. Check consistency.
4. Implement only the milestone requested.
5. Run build and relevant checks.
6. Run `git status`.
7. Summarize modified files and command results.
8. Wait for review.
9. Commit after approval.
10. Push after approval.
11. Stop.

## Conflict resolution

When a conflict is found:

1. Prefer Active over Superseded.
2. Prefer Active over Historical.
3. Prefer higher-numbered Active documents over lower-numbered Active documents.
4. Prefer explicit authority statements over implicit assumptions.
5. If unresolved, stop and report the conflict.

The coding agent must not silently choose a convenient interpretation.

## Adding new documents

Every new repository document must declare these fields at the top:

```text
Status:
Authority:
Supersedes:
Applies to:
```

Every new document must be added to this index before it can become authoritative.

A document that is not in this index is not implementation-authoritative.

## Changing Active documents

Active documents may be changed only when the change is the explicit scope of the milestone or maintenance task.

Changing any of these requires careful review:

- `00_REPOSITORY_INDEX.md`
- `20_SUPABASE_SCHEMA.sql`
- `22_IMPLEMENTATION_CONTRACT.md`
- `23_AGENT_WORKFLOW.md`
- `25_ENVIRONMENT_VARIABLES.md`

Do not bundle authority-document changes with feature implementation unless explicitly approved.

## Milestone 4 gate

Milestone 4 may begin only after this stabilization set is uploaded and committed:

- `00_REPOSITORY_INDEX.md`
- `20_SUPABASE_SCHEMA.sql`
- `22_IMPLEMENTATION_CONTRACT.md`
- `23_AGENT_WORKFLOW.md`
- `25_ENVIRONMENT_VARIABLES.md`

After that commit, the coding agent must treat these files as the governing source of truth.
