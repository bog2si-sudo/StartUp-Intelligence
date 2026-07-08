/**
 * Slice 5.1 — Submission readiness and payload normalization.
 *
 * Pure, unit-testable functions with no I/O side effects.
 * Authority: 50_REASONING_IMPLEMENTATION_CONTRACT.md
 *
 * Usage:
 *   const { normalized, readiness } = normalizeAndValidate(submission.responses, submission.submission_type);
 *
 * To persist:
 *   await supabase.from('submissions').update({ normalized_responses: normalized }).eq('id', id);
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubmissionType = 'free' | 'paid' | 'review';
export type ReadinessStatus = 'ready' | 'incomplete' | 'invalid';

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export interface ReadinessResult {
  status: ReadinessStatus;
  missingRequiredFields: string[];
  validationErrors: ValidationError[];
}

/**
 * Normalized internal assessment object.
 *
 * All string fields default to empty string when absent.
 * All array fields default to empty array when absent.
 * Downstream slices must read from this object, not from the raw responses.
 *
 * Persistence: suitable for direct JSON serialization into submissions.normalized_responses.
 */
export interface NormalizedSubmission {
  // Submission metadata
  submission_type: SubmissionType | '';
  assessment_version: string;

  // Identity
  email: string;
  startup_name: string;
  founder_name: string;

  // Location and classification
  country: string;
  sector: string;
  stage: string;

  // Free assessment core fields (Form A)
  problem_statement: string;
  target_customer: string;
  product_status: string;
  revenue_band: string;
  paying_customers_band: string;
  acquisition_channel: string;
  biggest_constraint: string;
  next_spend_area: string[];
  six_month_objective: string;
  demand_evidence: string;
  additional_notes: string;

  // Paid report fields (Form B)
  website_url: string;
  one_sentence_description: string;
  founder_count: string;
  has_technical_founder: string;
  has_commercial_founder: string;
  industry_experience: string;
  team_size: string;
  main_team_gap: string;
  mau_band: string;
  revenue_growth_trend: string;
  conversion_retention_churn: string;
  strongest_demand_proof: string;
  product_stage: string;
  what_is_working: string;
  what_is_not_working: string;
  biggest_risk: string;
  biggest_competitor: string;
  twelve_month_objective: string;
  planned_spend: string[];
  funding_raised: string;

  // Review intake fields (Form C)
  next_stage_goal: string;
  decision_needed: string[];
  materials_available: string[];
  review_reason: string;
  preferred_review_type: string;
  timing: string;

  // Internal metadata — not a business field
  _normalizedAt: string;
}

// ---------------------------------------------------------------------------
// Required field lists per submission type
// Source: 03_TALLY_FORMS.md
// ---------------------------------------------------------------------------

const REQUIRED_FREE: ReadonlyArray<keyof NormalizedSubmission> = [
  'email',
  'startup_name',
  'country',
  'sector',
  'stage',
  'problem_statement',
  'target_customer',
  'product_status',
  'revenue_band',
  'paying_customers_band',
  'acquisition_channel',
  'biggest_constraint',
  'next_spend_area',
  'six_month_objective',
  'demand_evidence',
];

const REQUIRED_PAID: ReadonlyArray<keyof NormalizedSubmission> = [
  ...REQUIRED_FREE,
  'one_sentence_description',
  'founder_count',
  'has_technical_founder',
  'has_commercial_founder',
  'team_size',
  'main_team_gap',
  'revenue_growth_trend',
  'strongest_demand_proof',
  'product_stage',
  'what_is_working',
  'what_is_not_working',
  'biggest_risk',
  'twelve_month_objective',
  'planned_spend',
  'funding_raised',
];

const REQUIRED_REVIEW: ReadonlyArray<keyof NormalizedSubmission> = [
  'email',
  'startup_name',
  'country',
  'sector',
  'stage',
  'next_stage_goal',
  'decision_needed',
  'materials_available',
  'review_reason',
  'preferred_review_type',
  'timing',
];

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

function toNonEmptyString(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'number') return String(value);
  if (typeof value !== 'string') return '';
  const t = value.trim();
  return t.length > 0 ? t : '';
}

function extractStringFromData(data: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const s = toNonEmptyString(data[key]);
    if (s) return s;
  }
  return '';
}

function extractArrayFromData(data: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const val = data[key];
    if (Array.isArray(val)) {
      const arr = val.map(toNonEmptyString).filter(Boolean);
      if (arr.length > 0) return arr;
    }
    const s = toNonEmptyString(val);
    if (s) return [s];
  }
  return [];
}

function extractStringFromAnswers(answers: unknown[], keys: string[]): string {
  if (!Array.isArray(answers)) return '';
  for (const raw of answers) {
    const a = raw as Record<string, unknown>;
    const fieldId = toNonEmptyString((a?.field as any)?.id);
    if (!keys.includes(fieldId)) continue;
    const answer = a?.answer as any;
    const s =
      toNonEmptyString(answer?.value) ||
      toNonEmptyString(answer?.text) ||
      toNonEmptyString(answer?.email) ||
      toNonEmptyString(answer?.input?.value) ||
      toNonEmptyString(answer);
    if (s) return s;
  }
  return '';
}

function extractArrayFromAnswers(answers: unknown[], keys: string[]): string[] {
  if (!Array.isArray(answers)) return [];
  for (const raw of answers) {
    const a = raw as Record<string, unknown>;
    const fieldId = toNonEmptyString((a?.field as any)?.id);
    if (!keys.includes(fieldId)) continue;
    const answer = a?.answer as any;
    if (Array.isArray(answer)) {
      const arr = answer.map(toNonEmptyString).filter(Boolean);
      if (arr.length > 0) return arr;
    }
    if (answer?.value && Array.isArray(answer.value)) {
      const arr = answer.value.map(toNonEmptyString).filter(Boolean);
      if (arr.length > 0) return arr;
    }
    const s = toNonEmptyString(answer?.value ?? answer?.text ?? answer);
    if (s) return [s];
  }
  return [];
}

function getString(
  data: Record<string, unknown>,
  answers: unknown[],
  keys: string[],
): string {
  return extractStringFromData(data, keys) || extractStringFromAnswers(answers, keys);
}

function getArray(
  data: Record<string, unknown>,
  answers: unknown[],
  keys: string[],
): string[] {
  const fromData = extractArrayFromData(data, keys);
  if (fromData.length > 0) return fromData;
  return extractArrayFromAnswers(answers, keys);
}

// ---------------------------------------------------------------------------
// Empty normalized object (returned when payload is structurally invalid)
// ---------------------------------------------------------------------------

function buildEmpty(submissionType: SubmissionType | ''): NormalizedSubmission {
  return {
    submission_type: submissionType,
    assessment_version: '',
    email: '',
    startup_name: '',
    founder_name: '',
    country: '',
    sector: '',
    stage: '',
    problem_statement: '',
    target_customer: '',
    product_status: '',
    revenue_band: '',
    paying_customers_band: '',
    acquisition_channel: '',
    biggest_constraint: '',
    next_spend_area: [],
    six_month_objective: '',
    demand_evidence: '',
    additional_notes: '',
    website_url: '',
    one_sentence_description: '',
    founder_count: '',
    has_technical_founder: '',
    has_commercial_founder: '',
    industry_experience: '',
    team_size: '',
    main_team_gap: '',
    mau_band: '',
    revenue_growth_trend: '',
    conversion_retention_churn: '',
    strongest_demand_proof: '',
    product_stage: '',
    what_is_working: '',
    what_is_not_working: '',
    biggest_risk: '',
    biggest_competitor: '',
    twelve_month_objective: '',
    planned_spend: [],
    funding_raised: '',
    next_stage_goal: '',
    decision_needed: [],
    materials_available: [],
    review_reason: '',
    preferred_review_type: '',
    timing: '',
    _normalizedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Normalize a raw Tally payload (stored in submissions.responses) into a
 * stable NormalizedSubmission object suitable for downstream pipeline slices.
 *
 * Handles two Tally payload shapes:
 *   - payload.data.*         — flat key/value pairs keyed by backend field name
 *   - payload.form_response  — structured Tally form response (answers[], hidden{})
 *
 * Returns a fully typed object with empty-string / empty-array defaults so
 * downstream code never encounters undefined.
 */
export function normalizeSubmission(
  responses: unknown,
  submissionType: SubmissionType | '' = '',
): NormalizedSubmission {
  if (responses === null || responses === undefined || typeof responses !== 'object') {
    return buildEmpty(submissionType);
  }

  const payload = responses as Record<string, unknown>;
  const formResponse = payload.form_response as Record<string, unknown> | undefined;

  // Merge hidden fields (lower precedence) with data fields (higher precedence)
  const hidden: Record<string, unknown> =
    formResponse?.hidden && typeof formResponse.hidden === 'object'
      ? (formResponse.hidden as Record<string, unknown>)
      : {};

  const data: Record<string, unknown> =
    payload.data && typeof payload.data === 'object'
      ? { ...hidden, ...(payload.data as Record<string, unknown>) }
      : { ...hidden };

  const answers: unknown[] = Array.isArray(formResponse?.answers)
    ? (formResponse!.answers as unknown[])
    : [];

  const s = (keys: string[]) => getString(data, answers, keys);
  const a = (keys: string[]) => getArray(data, answers, keys);

  return {
    submission_type: submissionType,
    assessment_version: s(['assessment_version']),

    // Identity
    email: s(['email']),
    startup_name: s(['startup_name', 'company_name']),
    founder_name: s(['founder_name', 'name']),

    // Location / classification
    country: s(['country']),
    sector: s(['sector', 'industry']),
    stage: s(['stage']),

    // Free core
    problem_statement: s(['problem_statement']),
    target_customer: s(['target_customer']),
    product_status: s(['product_status']),
    revenue_band: s(['revenue_band']),
    paying_customers_band: s(['paying_customers_band']),
    acquisition_channel: s(['acquisition_channel']),
    biggest_constraint: s(['biggest_constraint']),
    next_spend_area: a(['next_spend_area']),
    six_month_objective: s(['six_month_objective']),
    demand_evidence: s(['demand_evidence']),
    additional_notes: s(['additional_notes']),

    // Paid
    website_url: s(['website_url']),
    one_sentence_description: s(['one_sentence_description']),
    founder_count: s(['founder_count']),
    has_technical_founder: s(['has_technical_founder']),
    has_commercial_founder: s(['has_commercial_founder']),
    industry_experience: s(['industry_experience']),
    team_size: s(['team_size']),
    main_team_gap: s(['main_team_gap']),
    mau_band: s(['mau_band']),
    revenue_growth_trend: s(['revenue_growth_trend']),
    conversion_retention_churn: s(['conversion_retention_churn']),
    strongest_demand_proof: s(['strongest_demand_proof']),
    product_stage: s(['product_stage']),
    what_is_working: s(['what_is_working']),
    what_is_not_working: s(['what_is_not_working']),
    biggest_risk: s(['biggest_risk']),
    biggest_competitor: s(['biggest_competitor']),
    twelve_month_objective: s(['twelve_month_objective']),
    planned_spend: a(['planned_spend']),
    funding_raised: s(['funding_raised']),

    // Review
    next_stage_goal: s(['next_stage_goal']),
    decision_needed: a(['decision_needed']),
    materials_available: a(['materials_available']),
    review_reason: s(['review_reason']),
    preferred_review_type: s(['preferred_review_type']),
    timing: s(['timing']),

    _normalizedAt: new Date().toISOString(),
  };
}

/**
 * Validate a normalized submission for pipeline readiness.
 *
 * Returns:
 *   - 'ready'      — all required fields present and valid
 *   - 'incomplete' — some required fields missing or a format error present
 *   - 'invalid'    — all required fields missing (nothing was extractable)
 *
 * Required field sets differ per submission_type (free / paid / review).
 * When type is unknown/empty, the free required set is used.
 */
export function validateSubmissionReadiness(
  normalized: NormalizedSubmission,
  submissionType?: SubmissionType | '',
): ReadinessResult {
  const type = submissionType ?? normalized.submission_type;

  const requiredFields: ReadonlyArray<keyof NormalizedSubmission> =
    type === 'paid'
      ? REQUIRED_PAID
      : type === 'review'
        ? REQUIRED_REVIEW
        : REQUIRED_FREE;

  const missingRequiredFields: string[] = [];
  const validationErrors: ValidationError[] = [];

  for (const field of requiredFields) {
    const val = normalized[field];
    const present = Array.isArray(val)
      ? (val as string[]).length > 0
      : typeof val === 'string' && val.length > 0;

    if (!present) {
      missingRequiredFields.push(field);
      validationErrors.push({
        field,
        code: 'required_field_missing',
        message: `Required field "${field}" is absent or empty.`,
      });
    }
  }

  // Format validation: email must look like an address when present
  if (
    normalized.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)
  ) {
    validationErrors.push({
      field: 'email',
      code: 'invalid_email_format',
      message: 'The email field does not contain a valid address.',
    });
  }

  const formatErrors = validationErrors.filter(
    (e) => e.code !== 'required_field_missing',
  );

  let status: ReadinessStatus;
  if (missingRequiredFields.length === 0 && formatErrors.length === 0) {
    status = 'ready';
  } else if (missingRequiredFields.length >= requiredFields.length) {
    // Nothing was extractable — structurally invalid
    status = 'invalid';
  } else {
    status = 'incomplete';
  }

  return { status, missingRequiredFields, validationErrors };
}

/**
 * Convenience wrapper.
 *
 * When responses is null/undefined/non-object, returns status 'invalid'
 * immediately without calling normalizeSubmission.
 *
 * Otherwise normalizes and validates in one call.
 */
export function normalizeAndValidate(
  responses: unknown,
  submissionType: SubmissionType | '' = '',
): { normalized: NormalizedSubmission; readiness: ReadinessResult } {
  if (responses === null || responses === undefined || typeof responses !== 'object') {
    const normalized = buildEmpty(submissionType);
    return {
      normalized,
      readiness: {
        status: 'invalid',
        missingRequiredFields: ['responses'],
        validationErrors: [
          {
            field: 'responses',
            code: 'invalid_payload',
            message:
              'Submission responses payload is null, undefined, or not an object.',
          },
        ],
      },
    };
  }

  const normalized = normalizeSubmission(responses, submissionType);
  const readiness = validateSubmissionReadiness(normalized, submissionType);
  return { normalized, readiness };
}
