# 21_STRIPE_TALLY_SETUP

Version: 4.0

## Purpose

Use Stripe exclusively through Tally.

## Flow

Founder completes Tally form
→ Stripe payment inside Tally
→ Successful submission
→ Tally webhook
→ Vercel validates payload
→ Store in Supabase
→ Generate report
→ Email via Resend

## Rules

Do not implement custom checkout in V1.

Generate paid reports only after successful paid submission.
