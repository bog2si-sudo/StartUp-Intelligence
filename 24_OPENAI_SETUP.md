# 24_OPENAI_SETUP

Version: 4.0

## Purpose

Generate the narrative for the Founder Intelligence Brief.

## Input

Structured JSON only:

- Founder Evidence
- Benchmark Evidence
- Method Results
- Constraint
- Recommendations
- Confidence

## Output

Markdown report.

## Rules

The model must never:

- calculate scores
- calculate valuation
- choose benchmarks
- invent evidence
- override business rules

Business logic is executed before calling OpenAI.
