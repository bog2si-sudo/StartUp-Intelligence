# 43_DATA_GOVERNANCE

Version: 4.0

Status: Production

---

# Purpose

This document defines how founder data, benchmark data, startup evidence and AI-generated insights are managed inside the Founder Intelligence Platform.

The objective is to preserve trust, traceability and deterministic business logic.

---

# Principles

- Business logic remains deterministic.
- AI never invents benchmark data.
- Every benchmark fact must be traceable to one or more sources.
- Unknown values remain blank.
- Confidence increases with evidence quality.
- Benchmark data is curated before being used in reports.

---

# Data Categories

## Founder Data

Collected through Tally forms and stored in Supabase.

Examples:

- founder email
- startup name
- country
- sector
- stage
- submitted answers
- uploaded documents where applicable

## Benchmark Data

Curated reference information used to support comparisons.

Examples:

- company records
- funding signals
- traction signals
- benchmark patterns
- source metadata

## Generated Data

Produced by the application and OpenAI pipeline.

Examples:

- scores
- evidence maps
- report narrative
- recommendations
- confidence explanations

---

# Benchmark Source Priority

Use sources in this order:

1. Internal Supabase benchmark database
2. Curated Romanian ecosystem reports
3. Public European startup databases
4. Official company sources
5. Official investor or accelerator announcements
6. Public registry or company intelligence sources where lawful

---

# AI Responsibilities

AI may:

- summarize supplied evidence;
- compare founder data against supplied benchmark records;
- explain confidence;
- identify patterns;
- generate report narrative.

AI must not:

- fabricate facts;
- estimate unknown metrics;
- invent funding;
- invent traction;
- invent customers;
- invent valuation data;
- use benchmark data not supplied by the application.

---

# Database Layers

The benchmark database should separate raw evidence from reusable benchmark intelligence.

Recommended tables:

- benchmark_companies
- benchmark_patterns
- benchmark_transactions
- benchmark_sources

---

# Data Quality Rules

Each benchmark record should include:

- source name
- source URL
- source date or year
- geography
- sector
- stage
- confidence rating
- notes

If a fact cannot be verified, leave it blank.

---

# Confidence Levels

## High

Multiple reputable sources confirm the same fact.

## Medium

One reputable source confirms the fact.

## Low

The fact is plausible but weakly supported.

Low-confidence data may be stored but should not be treated as strong benchmark evidence.

---

# Usage in Reports

Reports must use curated Supabase benchmark records.

Reports must not use raw PDFs, scraped text or unreviewed AI extractions directly.

---

End of document.
