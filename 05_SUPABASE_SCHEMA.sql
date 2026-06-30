-- 05 — Supabase Schema
-- Run this in Supabase SQL Editor.

create extension if not exists "uuid-ossp";

-- Submissions from all forms
create table if not exists public.submissions (
  id uuid primary key default uuid_generate_v4(),
  report_type text not null check (report_type in ('free', 'paid', 'review')),
  startup_name text,
  email text not null,
  country text,
  sector text,
  stage text,
  raw_answers_json jsonb not null default '{}'::jsonb,
  normalized_answers_json jsonb not null default '{}'::jsonb,
  payment_status text not null default 'not_required',
  report_status text not null default 'received',
  report_token text unique,
  checkout_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generated reports
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  report_type text not null,
  report_json jsonb not null default '{}'::jsonb,
  report_markdown text,
  report_html text,
  pdf_url text,
  confidence_overall text,
  valuation_low_eur numeric,
  valuation_high_eur numeric,
  valuation_confidence text,
  generated_at timestamptz not null default now(),
  emailed_at timestamptz
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid references public.submissions(id) on delete set null,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  amount_cents integer,
  currency text default 'eur',
  status text not null default 'pending',
  paid_at timestamptz,
  raw_stripe_json jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Benchmark pattern database
create table if not exists public.benchmark_patterns (
  id uuid primary key default uuid_generate_v4(),
  geography text not null,
  country text,
  region text,
  sector text not null,
  stage text not null,
  company_count integer,
  typical_valuation_low_eur numeric,
  typical_valuation_high_eur numeric,
  typical_round_low_eur numeric,
  typical_round_high_eur numeric,
  typical_dilution_low_pct numeric,
  typical_dilution_high_pct numeric,
  typical_team_size_low integer,
  typical_team_size_high integer,
  typical_founder_count integer,
  technical_founder_common boolean,
  commercial_founder_common boolean,
  typical_paying_customers_low integer,
  typical_paying_customers_high integer,
  typical_mrr_low_eur numeric,
  typical_mrr_high_eur numeric,
  key_patterns jsonb default '[]'::jsonb,
  required_evidence jsonb default '[]'::jsonb,
  confidence_level text not null default 'low',
  data_sources jsonb not null default '[]'::jsonb,
  source_notes text,
  last_updated date,
  created_at timestamptz not null default now()
);

-- Individual comparable companies / transactions if available
create table if not exists public.comparable_transactions (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  country text,
  region text,
  sector text,
  stage text,
  round_date date,
  round_size_eur numeric,
  valuation_eur numeric,
  implied_dilution_pct numeric,
  revenue_at_round_eur numeric,
  paying_customers_at_round integer,
  team_size_at_round integer,
  evidence_notes text,
  source_url text,
  source_name text,
  source_quality text default 'public',
  confidence_level text default 'medium',
  created_at timestamptz not null default now()
);

-- Next-stage review requests
create table if not exists public.review_requests (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  next_stage_goal text,
  decision_needed jsonb default '[]'::jsonb,
  materials_available jsonb default '[]'::jsonb,
  uploaded_files jsonb default '[]'::jsonb,
  preferred_review_type text,
  review_reason text,
  timing text,
  internal_scope_recommendation text,
  proposed_price_cents integer,
  status text not null default 'received',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Webhook/event log for idempotency and audit trail
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  source text not null,
  external_event_id text,
  submission_id uuid references public.submissions(id) on delete set null,
  event_type text,
  payload jsonb default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(source, external_event_id)
);

-- Errors from report generation / webhook processing
create table if not exists public.processing_errors (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid references public.submissions(id) on delete set null,
  source text,
  error_message text,
  error_stack text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Email logs
create table if not exists public.email_logs (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid references public.submissions(id) on delete set null,
  email_to text,
  subject text,
  template_name text,
  provider_message_id text,
  status text,
  sent_at timestamptz default now()
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_submissions_updated_at on public.submissions;
create trigger set_submissions_updated_at
before update on public.submissions
for each row execute function public.set_updated_at();

drop trigger if exists set_review_requests_updated_at on public.review_requests;
create trigger set_review_requests_updated_at
before update on public.review_requests
for each row execute function public.set_updated_at();

-- Basic indexes
create index if not exists idx_submissions_email on public.submissions(email);
create index if not exists idx_submissions_report_type on public.submissions(report_type);
create index if not exists idx_submissions_report_token on public.submissions(report_token);
create index if not exists idx_benchmark_patterns_lookup on public.benchmark_patterns(country, sector, stage);
create index if not exists idx_comparable_lookup on public.comparable_transactions(country, sector, stage);
create index if not exists idx_events_external on public.events(source, external_event_id);

-- RLS
-- Keep RLS enabled. Server-side code should use service role key.
alter table public.submissions enable row level security;
alter table public.reports enable row level security;
alter table public.payments enable row level security;
alter table public.benchmark_patterns enable row level security;
alter table public.comparable_transactions enable row level security;
alter table public.review_requests enable row level security;
alter table public.events enable row level security;
alter table public.processing_errors enable row level security;
alter table public.email_logs enable row level security;

-- No public policies are created by default.
-- Use Supabase service role from server-side functions.
