# 36_OPERATIONS

Version: 4.0

Status: Production

------------------------------------------------------------------------

# Purpose

This document defines the day-to-day operational procedures for the
Founder Intelligence Platform after deployment.

The objective is reliable, repeatable operation with minimal manual
intervention.

------------------------------------------------------------------------

# Daily Checks

Verify:

-   API endpoints are responding.
-   Tally webhooks are processing successfully.
-   Stripe payments are completing.
-   OpenAI requests are succeeding.
-   Resend emails are being delivered.
-   Supabase database is healthy.

------------------------------------------------------------------------

# Operational Dashboard

Monitor:

-   New assessments
-   Failed webhook events
-   Failed report generation
-   Pending reports
-   Email delivery failures
-   Payment status

------------------------------------------------------------------------

# Incident Handling

If report generation fails:

1.  Review application logs.
2.  Identify the failing integration.
3.  Correct the underlying issue.
4.  Re-run report generation if appropriate.
5.  Notify the founder if delivery is delayed.

------------------------------------------------------------------------

# Data Maintenance

Perform regularly:

-   Review failed records.
-   Archive obsolete operational logs.
-   Verify database backups.
-   Confirm report accessibility.
-   Review storage usage.

------------------------------------------------------------------------

# Integration Maintenance

Periodically verify:

-   Tally webhook configuration
-   Stripe webhook configuration
-   OpenAI model configuration
-   Resend sender status
-   Supabase connectivity
-   Vercel deployment status

------------------------------------------------------------------------

# Operational Metrics

Track:

-   Assessments submitted
-   Reports generated
-   Average generation time
-   Payment completion rate
-   Email delivery rate
-   Processing failures

Use these metrics to identify operational issues before they affect
users.

------------------------------------------------------------------------

# Change Management

Before introducing operational changes:

-   test in a non-production environment;
-   validate integrations;
-   confirm backward compatibility;
-   document the change;
-   deploy using the production deployment procedure.

------------------------------------------------------------------------

End of document.
