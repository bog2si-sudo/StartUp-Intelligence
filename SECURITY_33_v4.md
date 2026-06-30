# 33_SECURITY

Version: 4.0

Status: Production

------------------------------------------------------------------------

# Purpose

This document defines the production security requirements for the
Founder Intelligence Platform.

------------------------------------------------------------------------

# Security Principles

-   HTTPS for all communication.
-   Least-privilege access.
-   Server-side secret management.
-   Deterministic backend processing.
-   No sensitive business logic in the client.

------------------------------------------------------------------------

# Secrets Management

Store all credentials as environment variables.

Never expose:

-   OpenAI API key
-   Supabase Service Role Key
-   Stripe Secret Key
-   Stripe Webhook Secret
-   Resend API Key
-   Tally Webhook Secrets

Secrets must never be committed to Git.

------------------------------------------------------------------------

# Authentication

Webhook endpoints must verify request authenticity.

Private reports must be accessed using high-entropy, unguessable tokens.

Do not expose sequential identifiers.

------------------------------------------------------------------------

# Database Security

Enable Row Level Security for any client-accessible tables.

Service Role credentials must only be used by server-side API routes.

------------------------------------------------------------------------

# Input Validation

Validate:

-   JSON payloads
-   Mandatory fields
-   Payment status
-   File metadata
-   Assessment identifiers

Reject malformed requests.

------------------------------------------------------------------------

# Logging

Log:

-   request timestamp
-   endpoint
-   processing result
-   error details

Never log sensitive founder responses or API secrets.

------------------------------------------------------------------------

# File Uploads

Accept only supported file types.

Validate file size limits.

Store metadata separately from business logic.

------------------------------------------------------------------------

# Incident Response

On security-related failures:

-   stop processing;
-   record the event;
-   notify the internal owner;
-   return a safe HTTP response.

------------------------------------------------------------------------

# Security Review

Perform a security review before every production release.

Verify:

-   secret rotation
-   dependency updates
-   webhook validation
-   access control
-   report privacy

------------------------------------------------------------------------

End of document.
