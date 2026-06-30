# 32_TESTING

Version: 4.0

Status: Production

------------------------------------------------------------------------

# Purpose

This document defines the minimum testing required before production
deployment.

The objective is to verify that deterministic business logic,
integrations and report generation function correctly.

------------------------------------------------------------------------

# Scope

Test the complete workflow:

-   Tally submission
-   Stripe payment
-   Webhook processing
-   Supabase persistence
-   OpenAI report generation
-   Resend email delivery
-   Private report access

------------------------------------------------------------------------

# Functional Tests

## Startup Snapshot

Verify that:

-   submission is accepted;
-   assessment is stored;
-   report is generated;
-   email is delivered.

------------------------------------------------------------------------

## Startup Intelligence

Verify that:

-   payment is required;
-   successful payment triggers report generation;
-   failed payment does not generate a report.

------------------------------------------------------------------------

## Decision Review

Verify that:

-   request is stored;
-   uploaded file metadata is recorded;
-   notification is sent.

------------------------------------------------------------------------

# Integration Tests

Confirm:

-   webhook authentication;
-   idempotent processing;
-   database writes;
-   report rendering;
-   email delivery.

------------------------------------------------------------------------

# Failure Tests

Simulate:

-   invalid webhook payload;
-   duplicate webhook;
-   missing mandatory fields;
-   OpenAI failure;
-   Supabase unavailable;
-   Stripe timeout.

Expected behaviour:

-   safe failure;
-   logged error;
-   no duplicated records.

------------------------------------------------------------------------

# Acceptance

Production deployment may proceed only when all functional, integration
and failure tests pass successfully.

------------------------------------------------------------------------

End of document.
