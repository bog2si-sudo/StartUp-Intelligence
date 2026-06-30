# 28_PROMPT_SPECIFICATION_PART3

## Output Contract

This document defines the required structure of the model output.

The generated report must follow the report template exactly.

------------------------------------------------------------------------

# Required Sections

The model must produce the following sections in order:

1.  Executive Summary
2.  Overall Readiness Score
3.  Dimension Scores
4.  Strengths
5.  Key Risks
6.  Evidence Gaps
7.  Priority Actions
8.  30-Day Plan
9.  60-Day Plan
10. 90-Day Plan
11. Closing Assessment

No additional sections should be introduced.

------------------------------------------------------------------------

# Formatting Rules

The output must:

-   use Markdown
-   use headings consistently
-   use short paragraphs
-   use bullet lists where appropriate
-   avoid tables unless explicitly required
-   avoid emojis

------------------------------------------------------------------------

# Evidence Rules

Every conclusion must be traceable to founder-provided information.

When evidence is missing, the report must explicitly state that
additional validation is required.

The model must not fabricate:

-   customers
-   revenue
-   market validation
-   competitive advantages
-   financial projections

------------------------------------------------------------------------

# Consistency Rules

Scores, narrative, recommendations and conclusions must remain
internally consistent.

Recommendations should directly address the weakest scoring dimensions.

The executive summary must reflect the detailed analysis without
introducing new information.

------------------------------------------------------------------------

# Failure Conditions

The output is considered invalid if it:

-   invents evidence
-   contradicts itself
-   skips required sections
-   changes report structure
-   includes unsupported certainty

------------------------------------------------------------------------

# Implementation Notes

The application should validate the presence of all required report
sections before delivering the final output to the user.

Future prompt revisions should preserve this output contract to ensure
compatibility with downstream templates and rendering components.

------------------------------------------------------------------------

End of Part 3.
