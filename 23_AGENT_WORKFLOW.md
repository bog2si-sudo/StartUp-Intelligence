# 23_AGENT_WORKFLOW.md

Status: Active  
Authority: Authoritative milestone workflow for coding agents  
Supersedes: conflicting workflow instructions in older documents  
Applies to: every future implementation milestone after repository stabilization

## Purpose

This document defines the exact workflow the coding agent must follow for every milestone.

The objective is to prevent drift, wasted credits, accidental redesign, schema mismatch, environment-variable mismatch, and implementation beyond the approved scope.

The repository is documentation-driven.

The agent must follow the workflow exactly.

## Workflow summary

For every milestone:

1. Read repository index.
2. Read relevant Active documents.
3. Check consistency.
4. Implement the milestone only.
5. Run build and relevant checks.
6. Run `git status`.
7. Summarize.
8. Wait for review.
9. Commit only after approval.
10. Push only after approval.
11. Stop.

## Step 1: Read repository index

Open and read:

```text
00_REPOSITORY_INDEX.md
```

The index determines:

- which documents are Active
- which documents are Superseded
- which documents are Historical
- which documents are authoritative for the current area
- whether a document supersedes another document
- implementation notes for each document

Do not start coding before reading the index.

## Step 2: Identify relevant Active documents

From the milestone request, identify the implementation area.

Examples:

- Supabase, schema, storage, RLS, data access → read `20_SUPABASE_SCHEMA.sql`
- Environment variables, secrets, deployment, integrations → read `25_ENVIRONMENT_VARIABLES.md`
- Coding rules, milestone boundaries → read `22_IMPLEMENTATION_CONTRACT.md`
- Agent workflow → read `23_AGENT_WORKFLOW.md`
- Product behavior, funnel, assessment, report generation → read the highest-numbered Active product/architecture document listed in the index

Read only Active documents unless an Active document explicitly references a Superseded or Historical document for background.

## Step 3: Ignore non-authoritative documents

Ignore documents marked:

```text
Historical
Superseded
Draft
Archive
Reference only
```

Do not reconcile implementation against those files.

Do not use them as requirements.

Do not copy logic from them unless an Active document explicitly instructs it.

## Step 4: Check consistency before coding

Before editing files, check whether the milestone instructions conflict with Active documentation.

Minimum consistency checks:

- Does the requested work fit the milestone scope?
- Does the requested work require schema changes?
- Does the requested work require new environment variables?
- Does the requested work rename existing tables, columns, routes, variables, or concepts?
- Does the requested work conflict with completed Milestones 1, 2, or 3?
- Does the requested work require changing the repository architecture?
- Does the requested work require new business logic not described in Active documents?

If no conflict exists, proceed.

If a conflict exists, stop and report it.

## Step 5: Inspect current implementation

Before modifying code:

```bash
git branch --show-current
git status --short
```

Then inspect the files relevant to the milestone.

Do not rewrite unrelated files.

Do not format the whole repository unless the milestone explicitly requires it.

Do not overwrite uncommitted user changes.

If there are uncommitted changes before the agent starts, report them and proceed only if they do not overlap the milestone work.

## Step 6: Implement milestone only

Make the smallest complete change that satisfies the milestone.

Implementation rules:

- Stay inside the milestone scope.
- Do not redesign.
- Do not modify schema unless the milestone is explicitly a schema migration and has approval.
- Do not rename environment variables.
- Do not add compatibility aliases.
- Do not introduce new architecture.
- Do not add speculative abstractions.
- Do not remove completed functionality from Milestones 1, 2, or 3.
- Do not change product positioning, pricing, tiers, or funnel sequence unless explicitly requested in an Active document.

## Step 7: Run checks

After code changes, inspect available commands.

If `package.json` exists:

```bash
cat package.json
```

Run relevant scripts that exist.

Preferred order:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Only run commands that exist or are clearly supported by the repository.

If the project uses `pnpm`, `yarn`, or another package manager, use the package manager already used by the repository.

If no build command exists, report that no build command was found.

If a command fails, stop and report the failure. Do not continue into unrelated fixes unless the failure is directly caused by the current milestone and can be fixed within scope.

## Step 8: Run git status

After implementation and checks:

```bash
git status --short
```

Use this output to summarize exactly what changed.

## Step 9: Summarize for review

Before committing, provide a review summary.

The summary must include:

```text
Milestone:
Active documents used:
Files changed:
Commands run:
Build/test result:
Git status:
Out-of-scope items intentionally not changed:
Risks or follow-up decisions:
```

Do not commit before this summary when the user expects review.

## Step 10: Wait for approval

After the summary, wait.

Do not continue to the next milestone.

Do not commit unless the user approves.

Do not push unless the user approves.

If the user asks for changes, make only the requested changes and then repeat checks and summary.

## Step 11: Commit

After approval, commit with a concise message.

Milestone commit format:

```bash
git add <changed files>
git commit -m "Milestone X: <summary>"
```

Documentation stabilization commit format:

```bash
git add 00_REPOSITORY_INDEX.md 20_SUPABASE_SCHEMA.sql 22_IMPLEMENTATION_CONTRACT.md 23_AGENT_WORKFLOW.md 25_ENVIRONMENT_VARIABLES.md
git commit -m "Docs: stabilize repository authority documents"
```

Do not include unrelated files in the commit.

## Step 12: Push

After commit approval and push approval:

```bash
git push
```

If working on a feature branch, push the feature branch.

If working on `main`, push only if the user explicitly approved direct push to `main`.

## Step 13: Stop

After pushing or after reporting the review summary, stop.

Do not start the next milestone.

Do not perform cleanup beyond the milestone.

Do not proactively edit additional documents.

## Required agent response after every milestone

Use this format:

```text
Milestone completed: <name or number>

Active documents used:
- <file>
- <file>

Files changed:
- <file>: <what changed>

Commands run:
- <command>: <result>

Build/test result:
- <summary>

Git status:
- <summary>

Not changed:
- <intentional exclusions>

Next decision:
- <what the user must approve or decide>
```

## Failure response format

If the milestone cannot be completed safely, use this format:

```text
Milestone blocked: <name or number>

Blocker:
- <clear explanation>

Conflicting documents or files:
- <file>: <issue>
- <file>: <issue>

Why I stopped:
- <reason>

Recommended resolution:
- <specific recommendation>

Safe next step:
- <what should happen before coding continues>
```

## Examples of stopping conditions

Stop if:

- A required environment variable is missing from `25_ENVIRONMENT_VARIABLES.md`.
- A milestone requires schema changes not approved in `20_SUPABASE_SCHEMA.sql`.
- An implementation path depends on a Superseded document.
- The requested work conflicts with a higher-numbered Active document.
- The build fails after milestone changes.
- The agent would need to redesign the architecture to proceed.
- The agent would need to invent business logic.
- There are overlapping uncommitted user changes.

## Final rule

The agent is not a product designer during implementation milestones.

The agent is a repository maintainer implementing documented decisions.

When in doubt, stop and report the inconsistency instead of guessing.
