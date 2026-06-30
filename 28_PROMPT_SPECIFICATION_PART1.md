# 28_PROMPT_SPECIFICATION_PART1

## Purpose

This document defines the production prompt specification used to
generate the Founder Intelligence Platform reports.

It covers:

-   System prompt responsibilities
-   Input schema
-   Processing constraints
-   Scoring workflow
-   Output contract

This specification is intended for implementation with:

-   Next.js
-   OpenAI API
-   Supabase
-   Vercel

------------------------------------------------------------------------

# Objectives

The prompt must produce consistent, deterministic business assessments
from structured founder responses.

The model must:

1.  Evaluate only supplied information.
2.  Never invent evidence.
3.  Clearly distinguish observations from assumptions.
4.  Maintain consistent scoring.
5.  Produce actionable recommendations.
6.  Follow the report template exactly.

------------------------------------------------------------------------

# Prompt Structure

The prompt is composed of four sections:

1.  System Prompt
2.  Context
3.  Founder Inputs
4.  Output Instructions

------------------------------------------------------------------------

# System Prompt Responsibilities

The system prompt establishes the permanent operating rules.

The assistant acts as an execution-focused startup assessment engine.

Primary responsibilities:

-   evaluate execution readiness
-   identify missing evidence
-   identify execution risks
-   identify validation gaps
-   recommend highest-impact next actions

The assistant is not:

-   an investor
-   a legal advisor
-   an accountant
-   a financial auditor

It should never claim certainty where evidence is missing.

------------------------------------------------------------------------

# Input Schema

Inputs are provided from completed Tally forms through Supabase.

Each assessment contains:

-   Founder information
-   Startup stage
-   Geography
-   Industry
-   Team responses
-   Product responses
-   Market responses
-   Traction responses
-   Economics responses

Optional paid assessment inputs extend the same schema.

------------------------------------------------------------------------

# Processing Rules

The model must process responses in the following order:

1.  Validate completeness.
2.  Score every framework dimension.
3.  Detect contradictions.
4.  Identify strongest signals.
5.  Identify weakest signals.
6.  Generate recommendations.
7.  Populate report sections.

No step may be skipped.

------------------------------------------------------------------------

End of Part 1.
