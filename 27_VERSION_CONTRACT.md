# 27_VERSION_CONTRACT.md

Status: Active  
Authority: Authoritative source for all application version identifiers  
Supersedes: placeholder version strings in lib/versions.ts and any informal version references elsewhere  
Applies to: all runtime code that records or validates version strings

## Purpose

This document defines the canonical version strings used throughout the application.
All version identifiers in source code and database records must match the values below exactly.

## Canonical version strings

| Key | Value |
|---|---|
| `assessment_version` | `founder-intelligence-free-assessment-v4.0` |
| `scoring_model_version` | `founder-intelligence-scoring-v4.0` |
| `report_version` | `startup-snapshot-report-v4.0` |
| `prompt_version` | `founder-intelligence-prompt-v4.0` |

## Usage rules

1. Source code must import these values from `lib/versions.ts`.
2. `lib/versions.ts` is the single runtime source of truth; it must mirror this document exactly.
3. Do not hard-code version strings in API routes, OpenAI helpers, email helpers, or database helpers.
4. The `assessment_version` value is also expected as a hidden field in the Tally free-assessment form payload; the value must match `founder-intelligence-free-assessment-v4.0`.
5. When a version string is incremented, update this document first, then update `lib/versions.ts` to match.
6. Never change a version string without updating this document.
