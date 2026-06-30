# 37A_CURSOR_BUILD_INSTRUCTIONS

Version: 4.0

Status: Production

------------------------------------------------------------------------

# Purpose

This document provides the implementation brief for Cursor to build the
Founder Intelligence Platform.

The architecture and technology stack are fixed.

------------------------------------------------------------------------

# Technology Stack

-   Next.js (App Router)
-   TypeScript
-   Vercel
-   Supabase
-   Tally
-   Stripe
-   Resend
-   OpenAI
-   GitHub

------------------------------------------------------------------------

# Build Principles

Cursor must:

-   follow the repository documents;
-   preserve deterministic business logic;
-   generate modular, maintainable code;
-   avoid introducing additional frameworks unless explicitly required.

------------------------------------------------------------------------

# Build Order

1.  Configure project.
2.  Configure environment variables.
3.  Configure Supabase.
4.  Implement webhook endpoints.
5.  Implement Stripe integration.
6.  Implement reasoning pipeline.
7.  Implement report generation.
8.  Implement email delivery.
9.  Implement private report pages.
10. Complete testing.

------------------------------------------------------------------------

# Coding Standards

-   TypeScript strict mode.
-   Server-side secrets only.
-   Modular architecture.
-   Explicit typing.
-   Clear error handling.
-   Idempotent webhook processing.

------------------------------------------------------------------------

# Deliverables

Cursor should produce:

-   working application;
-   passing tests;
-   production-ready deployment.

Implementation must remain consistent with the documentation contained
in this repository.

------------------------------------------------------------------------

End of document.
