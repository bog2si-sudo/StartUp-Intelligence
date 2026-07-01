# 26_REPOSITORY_AUDIT_PROMPT.md

Status: Active\
Authority: Repository verification workflow executed before every new
implementation milestone\
Applies to: GitHub Codespaces Agent, AI coding agents, repository
maintainers

# Purpose

This document defines the mandatory repository audit that must be
completed before beginning a new implementation milestone.

The objective is to ensure the repository remains documentation-driven,
internally consistent, and free from architecture drift.

This audit is not a feature implementation task.

# Agent Role

Act as:

**Principal Software Architect**

and

**Repository Maintainer**

# Project Context

This is NOT a greenfield project.

Milestones 1--3 have already been completed.

The repository is documentation-driven.

Implementation must follow repository documentation.

Do not redesign the product.

Do not invent business logic.

Do not simplify architecture.

Do not implement future milestones.

# Documents to Read First

Read the following documents in order:

1.  00_REPOSITORY_INDEX.md
2.  README.md
3.  20_SUPABASE_SCHEMA.sql
4.  22_IMPLEMENTATION_CONTRACT.md
5.  23_AGENT_WORKFLOW.md
6.  25_ENVIRONMENT_VARIABLES.md

Then read every additional Active document required by the current
repository state.

# Audit Scope

Perform a complete repository consistency audit.

Inspect: - documentation - implementation - database schema -
environment variables - API routes - webhook handlers - report
generation - benchmark ingestion - package configuration - build
configuration - Supabase integration - Stripe integration - OpenAI
integration - Resend integration - repository structure

# Verify Documentation

Confirm that: - Active documents are internally consistent. - Superseded
documents are not treated as authoritative. - Historical documents are
ignored during implementation. - No conflicting implementation
instructions remain. - No duplicate architecture definitions remain. -
No obsolete milestone guidance remains.

If conflicting documentation exists identify: - file - section -
conflict - recommended authoritative document

Do not rewrite documentation unless specifically instructed.

# Verify Database

Treat `20_SUPABASE_SCHEMA.sql` as the only authoritative schema.

Verify: - enums - tables - columns - indexes - foreign keys - triggers -
updated_at helpers - RLS - comments

Confirm implementation matches the schema.

Report any mismatch.

Do not redesign the schema.

# Verify Environment Variables

The only approved environment variables are:

-   SUPABASE_URL
-   SUPABASE_SERVICE_ROLE_KEY
-   TALLY_WEBHOOK_SECRET_FREE
-   TALLY_WEBHOOK_SECRET_PAID
-   TALLY_WEBHOOK_SECRET_REVIEW
-   STRIPE_SECRET_KEY
-   STRIPE_WEBHOOK_SECRET
-   RESEND_API_KEY
-   RESEND_FROM_EMAIL
-   OPENAI_API_KEY
-   OPENAI_MODEL
-   NEXT_PUBLIC_SUPABASE_URL
-   NEXT_PUBLIC_SUPABASE_ANON_KEY

Verify: - every variable used in code - every variable documented -
every variable referenced by build - every variable referenced by
deployment

Report: - undocumented variables - obsolete variables - duplicate
names - inconsistent names

Only perform safe corrections.

# Verify Implementation

Inspect implementation for: - schema drift - documentation drift -
environment variable drift - duplicated business logic - obsolete
imports - obsolete configuration - hardcoded values - missing schema
references - incorrect API usage

Do not redesign implementation.

# Build Verification

Execute:

``` bash
npm install
npm run build
```

If the build fails, report: - exact error - file - cause - recommended
fix

Only perform safe corrections.

# Final Report

Produce exactly one report.

Use this structure:

## Repository Health

PASS or FAIL

## Documentation

PASS or FAIL

## Schema

PASS or FAIL

## Environment Variables

PASS or FAIL

## Implementation

PASS or FAIL

## Build

PASS or FAIL

## Remaining Inconsistencies

For each inconsistency include: - severity - file - explanation -
recommended fix

## Automatic Fixes Performed

List every modification actually performed. If none: None.

## Files Modified

List every modified file. If none: None.

## Final Summary

Return exactly one of:

**Repository is internally consistent and ready for the next
implementation milestone.**

OR

**Repository still requires stabilization before the next implementation
milestone.**

# Completion Rule

After producing the report: - Stop. - Do not implement the next
milestone. - Do not add features. - Wait for explicit user approval
before making further repository changes.
