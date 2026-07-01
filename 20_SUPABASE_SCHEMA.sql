-- 20_SUPABASE_SCHEMA.sql
-- Startup Readiness MVP production Supabase schema
-- Status: Active
-- Authority: Highest database authority for the application
-- Supersedes: 19_SUPABASE_SCHEMA.sql
--
-- Scope:
--   founders
--   submissions
--   payments
--   events
--   reports
--   review_requests
--   processing_errors
--   email_logs
--   benchmark_companies
--   benchmark_patterns
--   benchmark_transactions
--   benchmark_sources
--
-- Design rules:
--   - Backend services use SUPABASE_SERVICE_ROLE_KEY and bypass RLS only on trusted server paths.
--   - Public/browser code must never write directly to these tables.
--   - Tally, Stripe, Resend, and OpenAI integration state is persisted here.
--   - This schema is append-friendly for audit/event data and normalized for operational entities.

begin;

-- Extensions
create extension if not exists pgcrypto;

-- Schemas
create schema if not exists app_private;

comment on schema app_private is 'Private helper schema for trigger functions and internal database utilities.';

-- Updated-at helper
create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function app_private.set_updated_at() is 'Shared trigger function that updates updated_at before row updates.';

-- Enums
do $$ begin
  create type public.submission_type as enum ('free', 'paid', 'review');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.submission_status as enum ('received', 'validated', 'processing', 'completed', 'failed', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'requires_action', 'paid', 'failed', 'refunded', 'disputed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_provider as enum ('stripe');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_status as enum ('queued', 'generating', 'generated', 'delivered', 'failed', 'expired');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.review_request_status as enum ('received', 'qualified', 'scheduled', 'completed', 'cancelled', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.event_source as enum ('tally', 'stripe', 'resend', 'openai', 'supabase', 'system', 'manual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.email_status as enum ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.error_severity as enum ('info', 'warning', 'error', 'critical');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.benchmark_source_type as enum ('public_filing', 'press_release', 'investor_update', 'company_website', 'news', 'database', 'manual_research', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.benchmark_confidence as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

comment on type public.submission_type is 'Form submission tier: free assessment, paid roadmap, or review intake.';
comment on type public.submission_status is 'Operational lifecycle status for a submitted assessment or intake.';
comment on type public.payment_status is 'Stripe payment lifecycle state persisted for reconciliation.';
comment on type public.payment_provider is 'Payment provider enum. Stripe is the only supported provider.';
comment on type public.report_status is 'AI/PDF report generation and delivery lifecycle state.';
comment on type public.review_request_status is 'Human review or consultation intake lifecycle state.';
comment on type public.event_source is 'Source system that produced an operational event.';
comment on type public.email_status is 'Email lifecycle status used for outbound report and review communication.';
comment on type public.error_severity is 'Severity classification for processing errors.';
comment on type public.benchmark_source_type is 'Type of source used for benchmark evidence.';
comment on type public.benchmark_confidence is 'Confidence level for benchmark data and derived patterns.';

-- Tables
create table if not exists public.founders (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  company_name text,
  company_website text,
  role_title text,
  country text,
  language text not null default 'en',
  consent boolean not null default false,
  marketing_consent boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referral_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint founders_email_not_blank check (length(trim(email)) > 0),
  constraint founders_email_lowercase check (email = lower(email)),
  constraint founders_language_not_blank check (length(trim(language)) > 0),
  constraint founders_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.founders is 'Founder or lead identity captured from Tally forms and used across submissions, payments, reports, and review requests.';
comment on column public.founders.email is 'Canonical lowercase email address. Application code must lowercase before insert/update.';
comment on column public.founders.consent is 'Required processing consent captured from forms.';
comment on column public.founders.marketing_consent is 'Optional marketing consent captured separately from processing consent.';
comment on column public.founders.metadata is 'Non-authoritative integration metadata. Do not store core business fields only here.';

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders(id) on delete restrict,
  submission_type public.submission_type not null,
  status public.submission_status not null default 'received',
  tally_form_id text,
  tally_response_id text,
  source_event_id text,
  assessment_version text not null,
  scoring_model_version text not null,
  prompt_version text,
  roadmap_version text,
  responses jsonb not null,
  normalized_responses jsonb not null default '{}'::jsonb,
  score_total numeric(5,2),
  score_team numeric(5,2),
  score_market numeric(5,2),
  score_traction numeric(5,2),
  score_product_econ numeric(5,2),
  top_gap_1 text,
  top_gap_2 text,
  top_gap_3 text,
  benchmark_summary text,
  benchmark_confidence public.benchmark_confidence,
  priority_1 text,
  priority_2 text,
  priority_3 text,
  risk_1 text,
  risk_2 text,
  risk_3 text,
  experiment_1 text,
  experiment_2 text,
  experiment_3 text,
  investor_memo text,
  lead_source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  received_at timestamptz not null default now(),
  completed_at timestamptz,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submissions_tally_response_unique unique (tally_response_id),
  constraint submissions_responses_is_object check (jsonb_typeof(responses) = 'object'),
  constraint submissions_normalized_responses_is_object check (jsonb_typeof(normalized_responses) = 'object'),
  constraint submissions_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint submissions_score_total_range check (score_total is null or (score_total >= 0 and score_total <= 100)),
  constraint submissions_score_team_range check (score_team is null or (score_team >= 0 and score_team <= 100)),
  constraint submissions_score_market_range check (score_market is null or (score_market >= 0 and score_market <= 100)),
  constraint submissions_score_traction_range check (score_traction is null or (score_traction >= 0 and score_traction <= 100)),
  constraint submissions_score_product_econ_range check (score_product_econ is null or (score_product_econ >= 0 and score_product_econ <= 100)),
  constraint submissions_completed_status_has_completed_at check (status <> 'completed' or completed_at is not null)
);

comment on table public.submissions is 'Canonical assessment and intake submissions. Replaces older assessments table usage.';
comment on column public.submissions.submission_type is 'free = 15Q assessment, paid = paid roadmap add-on, review = human review/consult intake.';
comment on column public.submissions.responses is 'Raw response payload mapped from Tally. Preserve for audit and regeneration.';
comment on column public.submissions.normalized_responses is 'Application-normalized response object used by scoring and prompt generation.';
comment on column public.submissions.investor_memo is 'Generated memo content for paid reports when available.';

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders(id) on delete restrict,
  submission_id uuid references public.submissions(id) on delete set null,
  provider public.payment_provider not null default 'stripe',
  status public.payment_status not null default 'pending',
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_event_id text,
  amount integer not null,
  currency text not null default 'eur',
  product_code text not null,
  description text,
  receipt_url text,
  paid_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_positive check (amount > 0),
  constraint payments_currency_lowercase check (currency = lower(currency)),
  constraint payments_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint payments_stripe_checkout_session_unique unique (stripe_checkout_session_id),
  constraint payments_stripe_payment_intent_unique unique (stripe_payment_intent_id),
  constraint payments_stripe_event_unique unique (stripe_event_id)
);

comment on table public.payments is 'Stripe payment records for paid reports and future paid services. Amount is stored in minor currency units.';
comment on column public.payments.amount is 'Amount in minor currency units, for example cents for EUR.';
comment on column public.payments.product_code is 'Internal product identifier such as paid_roadmap_report.';

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders(id) on delete restrict,
  submission_id uuid not null references public.submissions(id) on delete restrict,
  payment_id uuid references public.payments(id) on delete set null,
  status public.report_status not null default 'queued',
  report_type public.submission_type not null,
  report_version text not null,
  prompt_version text not null,
  openai_model text,
  title text,
  summary text,
  content jsonb not null default '{}'::jsonb,
  markdown_body text,
  pdf_storage_path text,
  pdf_public_url text,
  download_token text,
  download_expires_at timestamptz,
  generation_started_at timestamptz,
  generation_completed_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_content_is_object check (jsonb_typeof(content) = 'object'),
  constraint reports_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint reports_generated_has_content check (status not in ('generated','delivered') or (markdown_body is not null or content <> '{}'::jsonb)),
  constraint reports_download_token_unique unique (download_token)
);

comment on table public.reports is 'Generated assessment reports and paid roadmaps, including content, PDF delivery references, and generation state.';
comment on column public.reports.content is 'Structured report payload returned by the generation pipeline.';
comment on column public.reports.pdf_storage_path is 'Supabase Storage path or external PDF path when generated.';

create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders(id) on delete restrict,
  submission_id uuid references public.submissions(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  status public.review_request_status not null default 'received',
  requested_service text,
  founder_notes text,
  urgency text,
  calendly_event_uri text,
  calendly_invitee_uri text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  qualification_notes text,
  internal_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_requests_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.review_requests is 'Human review, advisory, or consultation requests created from review forms, report CTAs, or manual intake.';

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references public.founders(id) on delete set null,
  submission_id uuid references public.submissions(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  review_request_id uuid references public.review_requests(id) on delete set null,
  source public.event_source not null,
  event_name text not null,
  external_event_id text,
  idempotency_key text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint events_event_name_not_blank check (length(trim(event_name)) > 0),
  constraint events_payload_is_object check (jsonb_typeof(payload) = 'object'),
  constraint events_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint events_idempotency_key_unique unique (idempotency_key),
  constraint events_external_source_unique unique (source, external_event_id)
);

comment on table public.events is 'Append-only operational events from forms, payments, email, AI processing, and system actions.';
comment on column public.events.idempotency_key is 'Application-generated unique idempotency key used to prevent duplicate processing.';

create table if not exists public.processing_errors (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references public.founders(id) on delete set null,
  submission_id uuid references public.submissions(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  review_request_id uuid references public.review_requests(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  severity public.error_severity not null default 'error',
  source public.event_source not null default 'system',
  error_code text not null,
  message text not null,
  stack_trace text,
  payload jsonb not null default '{}'::jsonb,
  resolved boolean not null default false,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint processing_errors_payload_is_object check (jsonb_typeof(payload) = 'object'),
  constraint processing_errors_resolved_has_resolved_at check (resolved = false or resolved_at is not null),
  constraint processing_errors_error_code_not_blank check (length(trim(error_code)) > 0),
  constraint processing_errors_message_not_blank check (length(trim(message)) > 0)
);

comment on table public.processing_errors is 'Structured processing errors for webhook handling, report generation, payment reconciliation, and email delivery.';

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references public.founders(id) on delete set null,
  submission_id uuid references public.submissions(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  review_request_id uuid references public.review_requests(id) on delete set null,
  provider text not null default 'resend',
  status public.email_status not null default 'queued',
  resend_email_id text,
  template_key text not null,
  to_email text not null,
  from_email text not null,
  subject text not null,
  payload jsonb not null default '{}'::jsonb,
  queued_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  failed_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_logs_to_email_not_blank check (length(trim(to_email)) > 0),
  constraint email_logs_from_email_not_blank check (length(trim(from_email)) > 0),
  constraint email_logs_subject_not_blank check (length(trim(subject)) > 0),
  constraint email_logs_payload_is_object check (jsonb_typeof(payload) = 'object'),
  constraint email_logs_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint email_logs_resend_email_unique unique (resend_email_id)
);

comment on table public.email_logs is 'Outbound email log and delivery state for Resend-driven report, payment, and review communications.';

create table if not exists public.benchmark_sources (
  id uuid primary key default gen_random_uuid(),
  source_type public.benchmark_source_type not null,
  title text not null,
  publisher text,
  url text,
  published_at date,
  accessed_at timestamptz not null default now(),
  confidence public.benchmark_confidence not null default 'medium',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint benchmark_sources_title_not_blank check (length(trim(title)) > 0),
  constraint benchmark_sources_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint benchmark_sources_url_unique unique (url)
);

comment on table public.benchmark_sources is 'Source evidence registry for benchmark companies, patterns, and transactions.';

create table if not exists public.benchmark_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  website text,
  country text,
  region text,
  industry text,
  business_model text,
  stage text,
  founded_year integer,
  employee_count integer,
  description text,
  source_id uuid references public.benchmark_sources(id) on delete set null,
  confidence public.benchmark_confidence not null default 'medium',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint benchmark_companies_name_not_blank check (length(trim(name)) > 0),
  constraint benchmark_companies_normalized_name_not_blank check (length(trim(normalized_name)) > 0),
  constraint benchmark_companies_founded_year_reasonable check (founded_year is null or (founded_year >= 1800 and founded_year <= extract(year from now())::integer + 1)),
  constraint benchmark_companies_employee_count_positive check (employee_count is null or employee_count >= 0),
  constraint benchmark_companies_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint benchmark_companies_normalized_name_unique unique (normalized_name)
);

comment on table public.benchmark_companies is 'Benchmark company registry used to contextualize startup readiness, traction, valuation evidence, and pattern matching.';

create table if not exists public.benchmark_patterns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.benchmark_companies(id) on delete set null,
  source_id uuid references public.benchmark_sources(id) on delete set null,
  pattern_key text not null,
  pattern_name text not null,
  category text not null,
  stage text,
  industry text,
  region text,
  description text not null,
  evidence jsonb not null default '{}'::jsonb,
  implications text,
  confidence public.benchmark_confidence not null default 'medium',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint benchmark_patterns_key_not_blank check (length(trim(pattern_key)) > 0),
  constraint benchmark_patterns_name_not_blank check (length(trim(pattern_name)) > 0),
  constraint benchmark_patterns_category_not_blank check (length(trim(category)) > 0),
  constraint benchmark_patterns_description_not_blank check (length(trim(description)) > 0),
  constraint benchmark_patterns_evidence_is_object check (jsonb_typeof(evidence) = 'object')
);

comment on table public.benchmark_patterns is 'Reusable benchmark patterns derived from company evidence and source research.';

create table if not exists public.benchmark_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.benchmark_companies(id) on delete cascade,
  source_id uuid references public.benchmark_sources(id) on delete set null,
  transaction_type text not null,
  round_name text,
  announced_at date,
  amount numeric(18,2),
  currency text,
  valuation numeric(18,2),
  valuation_currency text,
  investors text[],
  revenue_multiple numeric(10,2),
  notes text,
  confidence public.benchmark_confidence not null default 'medium',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint benchmark_transactions_type_not_blank check (length(trim(transaction_type)) > 0),
  constraint benchmark_transactions_amount_positive check (amount is null or amount >= 0),
  constraint benchmark_transactions_valuation_positive check (valuation is null or valuation >= 0),
  constraint benchmark_transactions_currency_lowercase check (currency is null or currency = lower(currency)),
  constraint benchmark_transactions_valuation_currency_lowercase check (valuation_currency is null or valuation_currency = lower(valuation_currency)),
  constraint benchmark_transactions_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.benchmark_transactions is 'Funding, acquisition, valuation, and other benchmark transactions linked to benchmark companies.';

-- Indexes
create unique index if not exists founders_email_unique_idx on public.founders (email);
create index if not exists founders_created_at_idx on public.founders (created_at desc);
create index if not exists founders_country_idx on public.founders (country);
create index if not exists founders_utm_idx on public.founders (utm_source, utm_medium, utm_campaign);

create index if not exists submissions_founder_id_idx on public.submissions (founder_id);
create index if not exists submissions_type_status_idx on public.submissions (submission_type, status);
create index if not exists submissions_created_at_idx on public.submissions (created_at desc);
create index if not exists submissions_completed_at_idx on public.submissions (completed_at desc) where completed_at is not null;
create index if not exists submissions_score_total_idx on public.submissions (score_total desc) where score_total is not null;
create index if not exists submissions_tally_response_idx on public.submissions (tally_response_id) where tally_response_id is not null;
create index if not exists submissions_responses_gin_idx on public.submissions using gin (responses);
create index if not exists submissions_normalized_responses_gin_idx on public.submissions using gin (normalized_responses);

create index if not exists payments_founder_id_idx on public.payments (founder_id);
create index if not exists payments_submission_id_idx on public.payments (submission_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_created_at_idx on public.payments (created_at desc);
create index if not exists payments_paid_at_idx on public.payments (paid_at desc) where paid_at is not null;
create index if not exists payments_stripe_customer_idx on public.payments (stripe_customer_id) where stripe_customer_id is not null;

create index if not exists reports_founder_id_idx on public.reports (founder_id);
create index if not exists reports_submission_id_idx on public.reports (submission_id);
create index if not exists reports_payment_id_idx on public.reports (payment_id) where payment_id is not null;
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_download_token_idx on public.reports (download_token) where download_token is not null;

create index if not exists review_requests_founder_id_idx on public.review_requests (founder_id);
create index if not exists review_requests_submission_id_idx on public.review_requests (submission_id) where submission_id is not null;
create index if not exists review_requests_status_idx on public.review_requests (status);
create index if not exists review_requests_scheduled_at_idx on public.review_requests (scheduled_at desc) where scheduled_at is not null;
create index if not exists review_requests_created_at_idx on public.review_requests (created_at desc);

create index if not exists events_founder_id_idx on public.events (founder_id) where founder_id is not null;
create index if not exists events_submission_id_idx on public.events (submission_id) where submission_id is not null;
create index if not exists events_payment_id_idx on public.events (payment_id) where payment_id is not null;
create index if not exists events_report_id_idx on public.events (report_id) where report_id is not null;
create index if not exists events_review_request_id_idx on public.events (review_request_id) where review_request_id is not null;
create index if not exists events_source_name_idx on public.events (source, event_name);
create index if not exists events_occurred_at_idx on public.events (occurred_at desc);
create index if not exists events_payload_gin_idx on public.events using gin (payload);

create index if not exists processing_errors_unresolved_idx on public.processing_errors (created_at desc) where resolved = false;
create index if not exists processing_errors_severity_idx on public.processing_errors (severity, created_at desc);
create index if not exists processing_errors_submission_id_idx on public.processing_errors (submission_id) where submission_id is not null;
create index if not exists processing_errors_report_id_idx on public.processing_errors (report_id) where report_id is not null;
create index if not exists processing_errors_event_id_idx on public.processing_errors (event_id) where event_id is not null;

create index if not exists email_logs_founder_id_idx on public.email_logs (founder_id) where founder_id is not null;
create index if not exists email_logs_submission_id_idx on public.email_logs (submission_id) where submission_id is not null;
create index if not exists email_logs_report_id_idx on public.email_logs (report_id) where report_id is not null;
create index if not exists email_logs_status_idx on public.email_logs (status);
create index if not exists email_logs_to_email_idx on public.email_logs (to_email);
create index if not exists email_logs_created_at_idx on public.email_logs (created_at desc);

create index if not exists benchmark_sources_type_idx on public.benchmark_sources (source_type);
create index if not exists benchmark_sources_published_at_idx on public.benchmark_sources (published_at desc) where published_at is not null;
create index if not exists benchmark_sources_confidence_idx on public.benchmark_sources (confidence);

create index if not exists benchmark_companies_country_idx on public.benchmark_companies (country);
create index if not exists benchmark_companies_region_idx on public.benchmark_companies (region);
create index if not exists benchmark_companies_industry_idx on public.benchmark_companies (industry);
create index if not exists benchmark_companies_stage_idx on public.benchmark_companies (stage);
create index if not exists benchmark_companies_source_id_idx on public.benchmark_companies (source_id) where source_id is not null;

create index if not exists benchmark_patterns_key_idx on public.benchmark_patterns (pattern_key);
create index if not exists benchmark_patterns_category_idx on public.benchmark_patterns (category);
create index if not exists benchmark_patterns_stage_industry_region_idx on public.benchmark_patterns (stage, industry, region);
create index if not exists benchmark_patterns_company_id_idx on public.benchmark_patterns (company_id) where company_id is not null;
create index if not exists benchmark_patterns_source_id_idx on public.benchmark_patterns (source_id) where source_id is not null;
create index if not exists benchmark_patterns_active_idx on public.benchmark_patterns (active) where active = true;
create index if not exists benchmark_patterns_evidence_gin_idx on public.benchmark_patterns using gin (evidence);

create index if not exists benchmark_transactions_company_id_idx on public.benchmark_transactions (company_id);
create index if not exists benchmark_transactions_source_id_idx on public.benchmark_transactions (source_id) where source_id is not null;
create index if not exists benchmark_transactions_type_idx on public.benchmark_transactions (transaction_type);
create index if not exists benchmark_transactions_announced_at_idx on public.benchmark_transactions (announced_at desc) where announced_at is not null;
create index if not exists benchmark_transactions_round_name_idx on public.benchmark_transactions (round_name) where round_name is not null;

-- Updated-at triggers
drop trigger if exists trg_founders_set_updated_at on public.founders;
create trigger trg_founders_set_updated_at before update on public.founders for each row execute function app_private.set_updated_at();

drop trigger if exists trg_submissions_set_updated_at on public.submissions;
create trigger trg_submissions_set_updated_at before update on public.submissions for each row execute function app_private.set_updated_at();

drop trigger if exists trg_payments_set_updated_at on public.payments;
create trigger trg_payments_set_updated_at before update on public.payments for each row execute function app_private.set_updated_at();

drop trigger if exists trg_reports_set_updated_at on public.reports;
create trigger trg_reports_set_updated_at before update on public.reports for each row execute function app_private.set_updated_at();

drop trigger if exists trg_review_requests_set_updated_at on public.review_requests;
create trigger trg_review_requests_set_updated_at before update on public.review_requests for each row execute function app_private.set_updated_at();

drop trigger if exists trg_processing_errors_set_updated_at on public.processing_errors;
create trigger trg_processing_errors_set_updated_at before update on public.processing_errors for each row execute function app_private.set_updated_at();

drop trigger if exists trg_email_logs_set_updated_at on public.email_logs;
create trigger trg_email_logs_set_updated_at before update on public.email_logs for each row execute function app_private.set_updated_at();

drop trigger if exists trg_benchmark_sources_set_updated_at on public.benchmark_sources;
create trigger trg_benchmark_sources_set_updated_at before update on public.benchmark_sources for each row execute function app_private.set_updated_at();

drop trigger if exists trg_benchmark_companies_set_updated_at on public.benchmark_companies;
create trigger trg_benchmark_companies_set_updated_at before update on public.benchmark_companies for each row execute function app_private.set_updated_at();

drop trigger if exists trg_benchmark_patterns_set_updated_at on public.benchmark_patterns;
create trigger trg_benchmark_patterns_set_updated_at before update on public.benchmark_patterns for each row execute function app_private.set_updated_at();

drop trigger if exists trg_benchmark_transactions_set_updated_at on public.benchmark_transactions;
create trigger trg_benchmark_transactions_set_updated_at before update on public.benchmark_transactions for each row execute function app_private.set_updated_at();

-- Row Level Security
alter table public.founders enable row level security;
alter table public.submissions enable row level security;
alter table public.payments enable row level security;
alter table public.events enable row level security;
alter table public.reports enable row level security;
alter table public.review_requests enable row level security;
alter table public.processing_errors enable row level security;
alter table public.email_logs enable row level security;
alter table public.benchmark_companies enable row level security;
alter table public.benchmark_patterns enable row level security;
alter table public.benchmark_transactions enable row level security;
alter table public.benchmark_sources enable row level security;

-- Restrictive default: authenticated/anon users receive no direct access unless future documents explicitly add safe public read policies.
-- Service role bypasses RLS and is the only supported write path for application operations.
drop policy if exists founders_no_public_access on public.founders;
create policy founders_no_public_access on public.founders for all using (false) with check (false);

drop policy if exists submissions_no_public_access on public.submissions;
create policy submissions_no_public_access on public.submissions for all using (false) with check (false);

drop policy if exists payments_no_public_access on public.payments;
create policy payments_no_public_access on public.payments for all using (false) with check (false);

drop policy if exists events_no_public_access on public.events;
create policy events_no_public_access on public.events for all using (false) with check (false);

drop policy if exists reports_no_public_access on public.reports;
create policy reports_no_public_access on public.reports for all using (false) with check (false);

drop policy if exists review_requests_no_public_access on public.review_requests;
create policy review_requests_no_public_access on public.review_requests for all using (false) with check (false);

drop policy if exists processing_errors_no_public_access on public.processing_errors;
create policy processing_errors_no_public_access on public.processing_errors for all using (false) with check (false);

drop policy if exists email_logs_no_public_access on public.email_logs;
create policy email_logs_no_public_access on public.email_logs for all using (false) with check (false);

drop policy if exists benchmark_companies_no_public_access on public.benchmark_companies;
create policy benchmark_companies_no_public_access on public.benchmark_companies for all using (false) with check (false);

drop policy if exists benchmark_patterns_no_public_access on public.benchmark_patterns;
create policy benchmark_patterns_no_public_access on public.benchmark_patterns for all using (false) with check (false);

drop policy if exists benchmark_transactions_no_public_access on public.benchmark_transactions;
create policy benchmark_transactions_no_public_access on public.benchmark_transactions for all using (false) with check (false);

drop policy if exists benchmark_sources_no_public_access on public.benchmark_sources;
create policy benchmark_sources_no_public_access on public.benchmark_sources for all using (false) with check (false);

-- Grants
revoke all on schema app_private from anon, authenticated;
revoke all on all functions in schema app_private from anon, authenticated;

grant usage on schema public to anon, authenticated;
-- Do not grant table privileges to anon/authenticated. Server code uses service role only.

commit;
