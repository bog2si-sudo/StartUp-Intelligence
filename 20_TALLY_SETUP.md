# 20_TALLY_SETUP

Version: 4.0

## Forms

1. Startup Snapshot
2. Startup Intelligence
3. Decision Review

## Payments

Startup Intelligence uses Tally's native Stripe payment block.

## Webhooks

Snapshot:
/api/webhooks/tally/snapshot

Intelligence:
/api/webhooks/tally/intelligence

Decision Review:
/api/webhooks/tally/review

## Hidden Fields

assessment_version
utm_source
utm_medium
utm_campaign
language

## Rule

Every submission triggers a webhook to Vercel.
