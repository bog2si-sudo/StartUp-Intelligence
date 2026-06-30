# 35_DEPLOYMENT

Version: 4.0

Status: Production

------------------------------------------------------------------------

# Purpose

This document defines the production deployment procedure for the
Founder Intelligence Platform.

The production stack is fixed:

-   Next.js
-   Vercel
-   Supabase
-   Tally
-   Stripe
-   OpenAI
-   Resend

------------------------------------------------------------------------

# Prerequisites

Before deployment verify:

-   GitHub repository is up to date.
-   Production environment variables are configured.
-   Supabase schema has been applied.
-   Stripe products and webhooks are configured.
-   Tally webhooks point to production endpoints.
-   Resend sending domain is verified.

------------------------------------------------------------------------

# Deployment Steps

1.  Push the latest code to the main branch.
2.  Deploy the repository to Vercel.
3.  Configure all production environment variables.
4.  Run database migrations if required.
5.  Verify webhook endpoints.
6.  Execute the production test checklist.
7.  Enable production traffic.

------------------------------------------------------------------------

# Post-Deployment Validation

Confirm:

-   Snapshot submissions succeed.
-   Paid assessments require payment.
-   Stripe webhook triggers report generation.
-   Reports are stored.
-   Emails are delivered.
-   Private report links function correctly.

------------------------------------------------------------------------

# Rollback

If a critical issue is detected:

1.  Disable incoming webhooks if necessary.
2.  Revert to the previous production deployment in Vercel.
3.  Confirm database integrity.
4.  Re-run production validation.

------------------------------------------------------------------------

# Release Checklist

-   Functional tests passed
-   Security review completed
-   GDPR requirements verified
-   Environment variables validated
-   Monitoring enabled
-   Owner notified

------------------------------------------------------------------------

End of document.
