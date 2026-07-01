-- 19_SUPABASE_SCHEMA.sql
-- Founder Intelligence Platform V4
-- Authoritative Supabase schema
-- Version: 4.0
-- Status: Production
--
-- This file replaces older Supabase schema files and is the single
-- authoritative schema for Version 4 implementation.

create extension if not exists "pgcrypto";

do $$ begin
  create type report_type as enum ('snapshot', 'intelligence', 'decision_review');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_status as enum ('not_required', 'pending', 'paid', 'failed', 'refunded', 'expired');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type report_status as enum (
    'received',
    'payment_required',
    'generating',
    'generated',
    'emailed',
    'failed',
    'review_requested',
    'scoped',
    'declined'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type evidence_quality as enum ('High', 'Medium', 'Low', 'Insufficient');
exception when duplicate_object then null;
end $$;

create table if not exists founders (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  founder_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references founders(id) on delete set null,
  report_type report_type not null,
  payment_status payment_status not null default 'not_required',
  report_status report_status not null default 'received',
  report_token text not null unique,
  startup_name text,
  founder_email text not null,
  founder_name text,
  country text,
  city text,
  sector text,
  industry text,
  subcategory text,
  business_model text,
  current_stage text,
  assessment_version text,
  form_type text,
  source text,
  language text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  tally_form_id text,
  tally_response_id text,
  raw_tally_json jsonb not null default '{}'::jsonb,
  normalized_input jsonb not null default '{}'::jsonb,
  checkout_url text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists submissions_founder_email_idx on submissions(founder_email);
create index if not exists submissions_report_type_idx on submissions(report_type);
create index if not exists submissions_payment_status_idx on submissions(payment_status);
create index if not exists submissions_report_status_idx on submissions(report_status);
create index if not exists submissions_tally_response_id_idx on submissions(tally_response_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  provider text not null default 'stripe',
  status payment_status not null default 'pending',
  stripe_session_id text,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  amount_cents integer,
  amount numeric,
  currency text default 'EUR',
  paid_at timestamptz,
  raw_stripe_json jsonb not null default '{}'::jsonb,
  raw_tally_payment_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payments_stripe_session_id_unique
  on payments(stripe_session_id)
  where stripe_session_id is not null;

create index if not exists payments_submission_id_idx on payments(submission_id);
create index if not exists payments_status_idx on payments(status);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  event_id text not null unique,
  submission_id uuid references submissions(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists events_provider_idx on events(provider);
create index if not exists events_event_type_idx on events(event_type);
create index if not exists events_submission_id_idx on events(submission_id);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  report_type report_type not null,
  report_version text not null default '4.0',
  prompt_version text,
  scoring_model_version text,
  overall_score integer,
  confidence_overall text,
  evidence_quality evidence_quality,
  report_json jsonb not null default '{}'::jsonb,
  report_markdown text,
  report_html text,
  pdf_url text,
  valuation_low_eur numeric,
  valuation_high_eur numeric,
  valuation_confidence text,
  generated_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_submission_id_idx on reports(submission_id);
create index if not exists reports_report_type_idx on reports(report_type);

create table if not exists review_requests (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  completed_intelligence_assessment text,
  decision_type text,
  decision_description text,
  success_definition text,
  decision_constraints text,
  review_modules text[],
  uploaded_documents jsonb not null default '[]'::jsonb,
  additional_context text,
  status text not null default 'received',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists review_requests_submission_id_idx on review_requests(submission_id);
create index if not exists review_requests_status_idx on review_requests(status);

create table if not exists processing_errors (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  stage text not null,
  error_message text not null,
  error_details jsonb not null default '{}'::jsonb,
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists processing_errors_submission_id_idx on processing_errors(submission_id);
create index if not exists processing_errors_stage_idx on processing_errors(stage);
create index if not exists processing_errors_resolved_idx on processing_errors(resolved);

create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  template_name text,
  provider text not null default 'resend',
  provider_message_id text,
  status text not null default 'queued',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_logs_submission_id_idx on email_logs(submission_id);
create index if not exists email_logs_recipient_email_idx on email_logs(recipient_email);
create index if not exists email_logs_status_idx on email_logs(status);

create table if not exists benchmark_companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  website text,
  linkedin text,
  country text,
  city text,
  year_founded integer,
  industry text,
  subcategory text,
  business_model text,
  stage text,
  employees integer,
  funding_total_eur numeric,
  latest_round text,
  latest_round_date date,
  lead_investor text,
  other_investors text,
  traction_signal text,
  revenue_signal text,
  growth_signal text,
  customer_signal text,
  geographic_presence text,
  evidence_quality evidence_quality not null default 'Low',
  source_1 text,
  source_2 text,
  source_3 text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists benchmark_companies_country_idx on benchmark_companies(country);
create index if not exists benchmark_companies_industry_idx on benchmark_companies(industry);
create index if not exists benchmark_companies_stage_idx on benchmark_companies(stage);

create table if not exists benchmark_patterns (
  id uuid primary key default gen_random_uuid(),
  country text,
  region text,
  industry text,
  subcategory text,
  business_model text,
  stage text,
  median_employees numeric,
  median_funding numeric,
  typical_arr text,
  typical_customer_count text,
  typical_growth_signal text,
  typical_revenue_signal text,
  typical_validation text,
  typical_execution_risks text,
  typical_next_milestone text,
  sample_size integer,
  confidence evidence_quality not null default 'Low',
  source_count integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists benchmark_patterns_country_idx on benchmark_patterns(country);
create index if not exists benchmark_patterns_region_idx on benchmark_patterns(region);
create index if not exists benchmark_patterns_industry_idx on benchmark_patterns(industry);
create index if not exists benchmark_patterns_stage_idx on benchmark_patterns(stage);

create table if not exists benchmark_transactions (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  country text,
  industry text,
  stage text,
  transaction_type text,
  round_name text,
  amount_eur numeric,
  transaction_date date,
  lead_investor text,
  other_investors text,
  source_url text,
  evidence_quality evidence_quality not null default 'Low',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists benchmark_transactions_country_idx on benchmark_transactions(country);
create index if not exists benchmark_transactions_industry_idx on benchmark_transactions(industry);
create index if not exists benchmark_transactions_stage_idx on benchmark_transactions(stage);

create table if not exists benchmark_sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text,
  source_year integer,
  source_type text,
  geography text,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_founders_updated_at on founders;
create trigger set_founders_updated_at before update on founders for each row execute function set_updated_at();

drop trigger if exists set_submissions_updated_at on submissions;
create trigger set_submissions_updated_at before update on submissions for each row execute function set_updated_at();

drop trigger if exists set_payments_updated_at on payments;
create trigger set_payments_updated_at before update on payments for each row execute function set_updated_at();

drop trigger if exists set_reports_updated_at on reports;
create trigger set_reports_updated_at before update on reports for each row execute function set_updated_at();

drop trigger if exists set_review_requests_updated_at on review_requests;
create trigger set_review_requests_updated_at before update on review_requests for each row execute function set_updated_at();

drop trigger if exists set_benchmark_companies_updated_at on benchmark_companies;
create trigger set_benchmark_companies_updated_at before update on benchmark_companies for each row execute function set_updated_at();

drop trigger if exists set_benchmark_patterns_updated_at on benchmark_patterns;
create trigger set_benchmark_patterns_updated_at before update on benchmark_patterns for each row execute function set_updated_at();

drop trigger if exists set_benchmark_transactions_updated_at on benchmark_transactions;
create trigger set_benchmark_transactions_updated_at before update on benchmark_transactions for each row execute function set_updated_at();

alter table founders enable row level security;
alter table submissions enable row level security;
alter table payments enable row level security;
alter table events enable row level security;
alter table reports enable row level security;
alter table review_requests enable row level security;
alter table processing_errors enable row level security;
alter table email_logs enable row level security;
alter table benchmark_companies enable row level security;
alter table benchmark_patterns enable row level security;
alter table benchmark_transactions enable row level security;
alter table benchmark_sources enable row level security;

-- V4 uses Supabase service role from server-side Next.js API routes.
-- Client-side direct database access is intentionally not enabled here.

-- End of schema.
