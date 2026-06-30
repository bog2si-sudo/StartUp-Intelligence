# 31_API_SPECIFICATION

Version: 4.0

Status: Production

------------------------------------------------------------------------

# Purpose

Defines the production API contract for the Founder Intelligence
Platform.

Implementation target:

-   Next.js App Router
-   Vercel
-   Supabase
-   Tally
-   Stripe
-   OpenAI
-   Resend

------------------------------------------------------------------------

# Design Principles

-   HTTPS only
-   JSON payloads
-   Stateless endpoints
-   Idempotent webhooks
-   Server-side processing only

------------------------------------------------------------------------

# Endpoints

## POST /api/webhooks/tally/snapshot

Processes Startup Snapshot submissions.

Responsibilities:

-   validate webhook
-   map fields
-   persist assessment
-   trigger free report

------------------------------------------------------------------------

## POST /api/webhooks/tally/intelligence

Processes Startup Intelligence submissions.

Responsibilities:

-   validate webhook
-   persist assessment
-   verify payment
-   trigger paid report

------------------------------------------------------------------------

## POST /api/webhooks/tally/review

Processes Decision Review submissions.

Responsibilities:

-   validate webhook
-   persist request
-   register uploaded documents
-   notify reviewer

------------------------------------------------------------------------

## POST /api/webhooks/stripe

Processes Stripe events.

Supported events:

-   checkout.session.completed
-   checkout.session.expired

------------------------------------------------------------------------

## GET /report/{token}

Returns a private report identified by an unguessable token.

------------------------------------------------------------------------

# Response Codes

-   200 Success
-   400 Invalid request
-   401 Unauthorized
-   404 Not found
-   409 Duplicate event
-   500 Internal error

------------------------------------------------------------------------

End of document.
