# CURSOR_MASTER_BUILD_PROMPT_V4

Version: 4.0

Status: Production

------------------------------------------------------------------------

# Purpose

Master implementation brief for Cursor.

Implement the Founder Intelligence Platform exactly as documented.

Do not redesign architecture. Do not replace technologies. Do not change
deterministic business logic.

------------------------------------------------------------------------

# Technology Stack

-   Next.js (App Router)
-   TypeScript
-   Vercel
-   Supabase
-   Tally
-   Stripe (inside Tally)
-   Resend
-   OpenAI
-   GitHub

------------------------------------------------------------------------

# Build Sequence

1.  Configure project.
2.  Configure environment.
3.  Build database layer.
4.  Implement webhook endpoints.
5.  Integrate Stripe.
6.  Implement reasoning pipeline.
7.  Generate reports.
8.  Deliver reports by email.
9.  Implement secure report pages.
10. Execute test suite.
11. Deploy to Vercel.

------------------------------------------------------------------------

# Implementation Rules

Application responsibilities:

-   validation
-   persistence
-   scoring
-   prioritisation
-   orchestration

OpenAI responsibilities:

-   evidence interpretation
-   report narrative only

------------------------------------------------------------------------

# Repository Rules

Use the repository documents as the single source of truth.

Do not introduce new frameworks, endpoints or business rules.

Keep implementation modular, deterministic and production ready.

------------------------------------------------------------------------

# Definition of Success

The build is complete when:

-   repository acceptance criteria pass;
-   tests succeed;
-   deployment succeeds;
-   documentation and implementation remain aligned.

------------------------------------------------------------------------

End of document.
