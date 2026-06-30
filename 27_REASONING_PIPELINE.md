# 27_REASONING_PIPELINE

Version: 4.0

## Processing Flow

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

## Acceptance Criteria

- Same input produces equivalent output.
- All business rules execute before the LLM.
- Reports are versioned and stored in Supabase.
