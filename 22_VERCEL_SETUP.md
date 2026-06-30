# 22_VERCEL_SETUP

Version: 4.0

## Purpose

Host the application, API routes and webhook handlers.

## Deployment

GitHub
→ Vercel Preview
→ Production

## Environment Variables

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- OPENAI_MODEL
- RESEND_API_KEY
- STRIPE_SECRET_KEY
- TALLY_SECRET

## API Routes

/api/webhooks/tally/snapshot
/api/webhooks/tally/intelligence
/api/webhooks/tally/review

## Rules

- Stateless serverless functions
- Verify webhook signatures
- Log failures
- Retry safely
