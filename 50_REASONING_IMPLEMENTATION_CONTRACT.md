# 50_REASONING_IMPLEMENTATION_CONTRACT.md

Status: Draft for repository addition  
Authority: Proposed implementation authority for Milestone 5 reasoning pipeline  
Supersedes: None until added to `00_REPOSITORY_INDEX.md` as Active  
Applies to: Milestone 5 and later reasoning, scoring, prompt-building, and report-generation implementation

## Purpose

This document defines the implementation contract for the Founder Intelligence Platform V4 reasoning layer.

It exists to prevent the next implementation phase from becoming one large uncontrolled OpenAI/report-generation task.

The reasoning layer must be built as a deterministic pipeline first. OpenAI may be introduced only after normalization, evidence extraction, scoring, recommendations, and prompt construction are implemented and testable.

This document does not change the database schema, environment variables, product architecture, pricing, funnel, or report template.

## Authority relationship

This document must be added to `00_REPOSITORY_INDEX.md` before it becomes authoritative.

Until then, it is a draft implementation contract.

Once added as Active:

1. `00_REPOSITORY_INDEX.md` remains the highest-level repository authority.
2. `20_SUPABASE_SCHEMA.sql` remains the only schema authority.
3. `22_IMPLEMENTATION_CONTRACT.md` remains the general implementation contract.
4. `23_AGENT_WORKFLOW.md` remains the milestone workflow authority.
5. `25_ENVIRONMENT_VARIABLES.md` remains the only environment-variable authority.
6. `27_VERSION_CONTRACT.md` remains the version identifier authority.
7. This document becomes the highest-numbered Active authority for reasoning implementation boundaries.

If this document conflicts with schema or environment-variable contracts, the schema or environment-variable contract wins and implementation must stop.

## Non-negotiable rules

The coding agent must not:

- Redesign architecture.
- Modify `20_SUPABASE_SCHEMA.sql`.
- Add environment variables.
- Add database tables or columns.
- Implement PDF generation during Milestone 5 unless a later slice explicitly authorizes it.
- Implement benchmark ingestion during Milestone 5 unless a later slice explicitly authorizes it.
- Implement fresh web research or external data retrieval during Milestone 5.
- Let the LLM decide what data to use.
- Let the LLM calculate canonical scores.
- Let the LLM invent evidence, traction, customers, revenue, market validation, competitive advantages, or projections.
- Generate or deliver reports before validation exists.
- Skip slices or combine multiple slices unless explicitly instructed.

The coding agent must:

- Keep all reasoning server-side.
- Use existing Supabase server patterns.
- Use existing version constants from `lib/versions.ts`.
- Preserve existing webhook behavior.
- Build pure, unit-testable functions where practical.
- Keep deterministic logic separate from OpenAI calls.
- Treat OpenAI output as narrative only, not as the source of truth.
- Validate every generated report before persistence or delivery.

## Existing pipeline authority

The existing reasoning flow is:

```text
Tally Submission
→ Validation
→ Evidence Extraction
→ Benchmark Resolution
→ Methodology Engine
→ Constraint Identification
→ Recommendation Engine
→ Prompt Builder
→ OpenAI
→ Markdown
→ PDF
→ Resend Email
```

For Milestone 5, the implementation must stop before PDF generation and benchmark ingestion unless explicitly authorized by a future Active document or milestone prompt.

## Deterministic versus LLM responsibilities

### Deterministic code owns

- Submission loading.
- Response normalization.
- Required-field validation.
- Evidence extraction.
- Missing evidence detection.
- Contradiction detection.
- Scoring.
- Confidence calculation.
- Gap ranking.
- Risk ranking.
- Priority selection.
- Experiment/action selection.
- Prompt assembly.
- Report section validation.
- Persistence to Supabase.

### LLM owns only

- Clear narrative explanation.
- Professional wording.
- Founder-friendly synthesis.
- Report prose following the approved template.

The LLM must receive only controlled, preselected inputs from deterministic code.

The LLM must not choose its own source data.

## Canonical internal pipeline

Implementation should follow this shape:

```text
submission
→ normalizeSubmission()
→ validateSubmissionReadiness()
→ extractEvidence()
→ scoreAssessment()
→ deriveRecommendations()
→ buildPromptPayload()
→ generateNarrative()
→ validateGeneratedReport()
→ persistReport()
```

Each step should be separable and testable.

## Milestone 5 scope

Milestone 5 is the reasoning foundation.

It does not include:

- PDF rendering.
- PDF storage.
- Email delivery changes.
- Benchmark ingestion.
- External research.
- Admin UI.
- Founder accounts.
- Frontend redesign.
- Payment changes.
- Webhook changes unless required to trigger an already-built reasoning function.

## Slice boundaries

### Slice 5.1 — Submission readiness and payload normalization

Objective:

Convert a persisted submission record into a normalized internal assessment object.

Allowed:

- Create server-side normalization module.
- Define TypeScript types for normalized submissions.
- Read one submission by ID if useful.
- Normalize `submissions.responses` into stable internal fields.
- Validate required fields.
- Return readiness status:
  - `ready`
  - `incomplete`
  - `invalid`
- Return missing required fields and structured validation errors.
- Optionally persist normalized output to `submissions.normalized_responses` if clearly useful and contract-compliant.

Forbidden:

- OpenAI calls.
- Report generation.
- PDF generation.
- Benchmark logic.
- Schema changes.
- Environment-variable changes.
- New public API route unless explicitly required.

Expected output:

- Normalized assessment object.
- Missing required fields list.
- Readiness result.
- Validation errors suitable for downstream slices.

### Slice 5.2 — Deterministic evidence extraction

Objective:

Convert normalized submission fields into evidence signals.

Allowed:

- Create evidence extraction module.
- Map responses into evidence categories:
  - team
  - market
  - product
  - traction
  - economics
  - execution
- Identify direct evidence, weak evidence, missing evidence, and contradictions.
- Produce confidence inputs.

Forbidden:

- OpenAI calls.
- Narrative report writing.
- PDF generation.
- Benchmark ingestion.

Expected output:

- Evidence map.
- Evidence gap list.
- Contradiction list.
- Evidence confidence inputs.

### Slice 5.3 — Deterministic scoring engine

Objective:

Compute scores before any LLM involvement.

Allowed:

- Create scoring module.
- Compute dimension scores.
- Compute total score.
- Assign readiness category.
- Assign confidence level.
- Persist to existing `submissions` score columns where appropriate:
  - `score_total`
  - `score_team`
  - `score_market`
  - `score_traction`
  - `score_product_econ`
  - `benchmark_confidence` only if the confidence source is valid and not pretending benchmark data exists.

Forbidden:

- Letting OpenAI calculate scores.
- Adding score columns.
- Introducing benchmark-derived scoring unless benchmark data is already available and explicitly in scope.

Expected output:

- Dimension scores.
- Total score.
- Readiness category.
- Confidence level.
- Scoring rationale data structure.

### Slice 5.4 — Recommendation and action-plan engine

Objective:

Generate deterministic priorities before AI writes narrative.

Allowed:

- Derive top gaps.
- Rank risks.
- Select priority actions.
- Select validation experiments.
- Generate structured 30/60/90 plan data.
- Persist into existing columns where appropriate:
  - `top_gap_1`
  - `top_gap_2`
  - `top_gap_3`
  - `priority_1`
  - `priority_2`
  - `priority_3`
  - `risk_1`
  - `risk_2`
  - `risk_3`
  - `experiment_1`
  - `experiment_2`
  - `experiment_3`

Forbidden:

- OpenAI calls.
- Report prose generation.
- PDF generation.

Expected output:

- Ranked gaps.
- Ranked risks.
- Priorities.
- Experiments.
- Structured action plan.

### Slice 5.5 — Prompt builder only

Objective:

Build the exact OpenAI prompt payload without calling OpenAI.

Allowed:

- Create prompt builder module.
- Use deterministic outputs from prior slices.
- Include the required report structure.
- Include forbidden-claim rules.
- Include evidence-only constraints.
- Include version identifiers.
- Validate that prompt payload contains only supplied or deterministically derived data.

Forbidden:

- Calling OpenAI.
- Persisting generated report content.
- PDF generation.

Expected output:

- Prompt payload.
- System instructions.
- User/content instructions.
- Report section requirements.
- Validation checklist.

### Slice 5.6 — OpenAI narrative generation

Objective:

Call OpenAI only after deterministic reasoning and prompt construction exist.

Allowed:

- Use `OPENAI_API_KEY` and `OPENAI_MODEL` from the existing environment contract.
- Call OpenAI server-side only.
- Generate Markdown narrative from controlled prompt payload.
- Validate output structure before persistence.
- Persist valid report content to `reports.content` and `reports.markdown_body`.
- Update report status using existing `reports.status` values.

Forbidden:

- PDF generation.
- Benchmark ingestion.
- Email delivery changes unless explicitly approved.
- Unvalidated report delivery.
- LLM-generated scores overriding deterministic scores.

Expected output:

- Generated Markdown body.
- Structured report content JSON.
- Validation result.
- Updated report record.

## Report output contract

Generated reports must include exactly these sections in order:

1. Executive Summary
2. Overall Readiness Score
3. Dimension Scores
4. Strengths
5. Key Risks
6. Evidence Gaps
7. Priority Actions
8. 30-Day Plan
9. 60-Day Plan
10. 90-Day Plan
11. Closing Assessment

The application must validate required sections before marking a report as generated or delivered.

## Failure conditions

Reasoning or report generation must fail safely if:

- Required submission fields are missing.
- The submission cannot be normalized.
- Evidence extraction produces no usable evidence.
- Scores cannot be calculated deterministically.
- Prompt payload contains unsupported or empty critical sections.
- OpenAI output misses required sections.
- OpenAI output invents unsupported claims.
- OpenAI output contradicts deterministic scores or recommendations.

Failures must be recorded using existing `processing_errors` where persistence is in scope.

## Persistence rules

Use only existing schema fields.

Allowed persistence locations:

- `submissions.normalized_responses`
- `submissions.score_*`
- `submissions.top_gap_*`
- `submissions.priority_*`
- `submissions.risk_*`
- `submissions.experiment_*`
- `submissions.investor_memo`
- `submissions.metadata`
- `reports.content`
- `reports.markdown_body`
- `reports.status`
- `reports.error_message`
- `processing_errors`
- `events`

Do not create new tables or columns.

## Recommended code organization

Preferred module structure:

```text
lib/reasoning/
  normalize-submission.ts
  evidence.ts
  scoring.ts
  recommendations.ts
  prompt-builder.ts
  report-validation.ts
  generate-report.ts
```

This structure is suggested, not mandatory. The coding agent may adapt file names if the existing repository structure clearly indicates a better convention.

## Completion rule for every Milestone 5 slice

After each slice, the coding agent must:

1. Audit against `22_IMPLEMENTATION_CONTRACT.md`.
2. Run available checks:
   - `npm install`
   - `npx tsc --noEmit`
   - `npm run build`
3. Report changed files.
4. Report commands run and results.
5. Commit only the slice changes.
6. Stop.

Do not start the next slice without explicit human approval.
