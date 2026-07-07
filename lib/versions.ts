// BLOCKER: The Active authority documents (00_REPOSITORY_INDEX.md,
// 20_SUPABASE_SCHEMA.sql, 22_IMPLEMENTATION_CONTRACT.md, 23_AGENT_WORKFLOW.md,
// 25_ENVIRONMENT_VARIABLES.md, and 04_BACKEND_TECH_SPEC.md) do not define
// authoritative string values for SCORING_MODEL_VERSION, REPORT_VERSION, or
// PROMPT_VERSION. These placeholders must be replaced once an Active document
// provides canonical version identifiers. Do not ship to production without
// resolving this blocker.
//
// assessment_version is NOT defined here. It must be supplied by the Tally form
// payload as the hidden field `assessment_version` on each submission, and must
// be validated as present before any database insert proceeds.

export const SCORING_MODEL_VERSION = '1.0'; // BLOCKER – pending Active document authority
export const REPORT_VERSION = '1.0';        // BLOCKER – pending Active document authority
export const PROMPT_VERSION = '1.0';        // BLOCKER – pending Active document authority
