# 20B_TALLY_BACKEND_MAPPING

## Purpose

This document defines the backend mapping between Tally form submissions
and the application data model.

The mapping is implementation-ready for:

-   Next.js
-   Vercel
-   Supabase
-   Tally
-   Stripe (embedded in Tally)
-   Resend
-   OpenAI

------------------------------------------------------------------------

# Flow

1.  User submits Tally form.
2.  Tally sends a webhook to the Next.js API endpoint.
3.  Payload is validated.
4.  Assessment record is created or updated in Supabase.
5.  Payment status (if applicable) is stored.
6.  OpenAI processing is triggered.
7.  Generated report is stored.
8.  Email is sent through Resend.

------------------------------------------------------------------------

# Assessment Mapping

  Tally Field     Supabase Column
  --------------- -----------------
  assessment_id   id
  created_at      created_at
  founder_name    founder_name
  founder_email   founder_email
  startup_name    startup_name
  country         country
  industry        industry
  stage           stage
  q1--q30         q1--q30

------------------------------------------------------------------------

# Generated Columns

The application is responsible for populating:

-   score_total
-   score_team
-   score_market
-   score_product
-   score_traction
-   score_business_model
-   score_execution
-   executive_summary
-   strengths
-   risks
-   evidence_gaps
-   priority_actions
-   report_markdown
-   report_version
-   prompt_version
-   generated_at

------------------------------------------------------------------------

# Payment Mapping

Store the following values when Stripe payment is completed through
Tally:

-   stripe_payment_id
-   payment_status
-   amount
-   currency
-   paid_at

No report generation requiring payment should begin until payment_status
is `paid`.

------------------------------------------------------------------------

# Validation Rules

Reject webhook requests when:

-   assessment_id is missing
-   founder_email is missing
-   required question fields are absent
-   payload validation fails

Return an appropriate HTTP error without creating database records.

------------------------------------------------------------------------

# Idempotency

Webhook processing must be idempotent.

If an assessment with the same assessment_id already exists:

-   update mutable fields
-   do not create duplicate assessments
-   do not duplicate report generation unless explicitly requested

------------------------------------------------------------------------

End of document.
