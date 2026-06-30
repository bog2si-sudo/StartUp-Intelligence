# 18_SUPABASE_SETUP

Version: 4.0

## Stack Role

Supabase provides:

- PostgreSQL database
- Object storage
- Row Level Security
- Report persistence
- Uploaded document storage

## Region

Frankfurt (EU)

## Storage Buckets

reports/
uploads/

## Core Tables

- founders
- assessments
- evidence
- benchmarks
- decision_briefs
- review_requests
- audit_logs
- system_versions

## Rules

Never overwrite assessments or reports.
Create new versions instead.
Daily backups enabled.
