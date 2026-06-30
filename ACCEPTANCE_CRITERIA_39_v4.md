# 39_ACCEPTANCE_CRITERIA

Version: 4.0

Status: Production

------------------------------------------------------------------------

# Purpose

This document defines the final acceptance criteria for the Founder
Intelligence Platform Version 4.

A production release is considered complete only when every criterion
below has been satisfied.

------------------------------------------------------------------------

# Product Acceptance

The platform shall provide:

-   Startup Snapshot assessment
-   Startup Intelligence assessment
-   Decision Review request

Each workflow must complete successfully from submission through final
user delivery.

------------------------------------------------------------------------

# Functional Acceptance

The system must:

-   accept Tally submissions;
-   validate incoming webhooks;
-   persist data in Supabase;
-   verify Stripe payment before paid report generation;
-   execute the reasoning pipeline;
-   generate Markdown reports;
-   deliver reports using Resend;
-   expose reports through secure private links.

------------------------------------------------------------------------

# Technical Acceptance

The application must:

-   deploy successfully on Vercel;
-   compile without errors;
-   use TypeScript strict mode;
-   keep secrets server-side;
-   process duplicate webhooks idempotently.

------------------------------------------------------------------------

# Security Acceptance

Verify:

-   HTTPS is enforced.
-   Private report tokens are unguessable.
-   Secrets are not exposed.
-   Webhook authenticity is validated.

------------------------------------------------------------------------

# Quality Acceptance

Generated reports must:

-   follow the approved template;
-   remain internally consistent;
-   contain evidence-based narrative only;
-   avoid fabricated facts;
-   preserve deterministic scores supplied by the application.

------------------------------------------------------------------------

# Operational Acceptance

Confirm:

-   monitoring is active;
-   logging is operational;
-   deployment checklist completed;
-   rollback procedure documented.

------------------------------------------------------------------------

# Release Decision

Version 4 is accepted for production only when all functional,
technical, security, operational and quality criteria have been verified
successfully.

------------------------------------------------------------------------

End of document.
