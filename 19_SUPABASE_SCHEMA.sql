-- 19_SUPABASE_SCHEMA.sql

create table founders (
  id uuid primary key,
  email text unique not null,
  name text,
  country text,
  language text,
  consent boolean default false,
  created_at timestamptz default now()
);

create table assessments (
  id uuid primary key,
  founder_id uuid references founders(id),
  assessment_type text not null,
  assessment_version text,
  responses jsonb not null,
  completed_at timestamptz default now()
);

create table evidence (
  id uuid primary key,
  assessment_id uuid references assessments(id),
  scores jsonb,
  confidence jsonb,
  constraint_data jsonb,
  valuation jsonb,
  recommendations jsonb,
  reasoning_version text
);

create table benchmarks (
  id uuid primary key,
  country text,
  region text,
  sector text,
  business_model text,
  stage text,
  funding_round text,
  funding_amount numeric,
  public_valuation numeric,
  investors jsonb,
  confidence text,
  source text
);

create table decision_briefs (
  id uuid primary key,
  assessment_id uuid references assessments(id),
  markdown text,
  pdf_url text,
  model text,
  prompt_version text,
  created_at timestamptz default now()
);
