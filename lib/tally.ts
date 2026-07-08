import { z } from 'zod';

const tallyPayloadSchema = z.object({
  eventId: z.string().optional(),
  event_id: z.string().optional(),
  data: z.any().optional(),
  form_response: z.any().optional(),
});

export function verifyTallyRequest(req: Request, expectedSecret?: string) {
  if (!expectedSecret) {
    return false;
  }

  const signature = req.headers.get('x-tally-signature');
  if (!signature) {
    return false;
  }

  return signature === expectedSecret;
}

export function parseTallyPayload(payload: unknown): any {
  const parsed = tallyPayloadSchema.safeParse(payload);
  return parsed.success ? parsed.data : payload;
}

export function extractAssessmentVersion(payload: any): string {
  return payload?.data?.assessment_version || '';
}

export function extractEventId(payload: any): string {
  return payload?.eventId || payload?.event_id || '';
}

export function extractResponseId(payload: any): string {
  return payload?.data?.responseId || payload?.data?.submissionId || extractEventId(payload);
}

export function extractEmail(payload: any): string {
  return (
    payload?.data?.email ||
    payload?.form_response?.answers?.find((a: any) => a?.field?.id === 'email')?.answer?.email ||
    ''
  );
}

function toNonEmptyString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '';
}

function extractAnswerString(answer: any): string {
  if (!answer) {
    return '';
  }

  if (typeof answer === 'string') {
    return toNonEmptyString(answer);
  }

  return (
    toNonEmptyString(answer.value) ||
    toNonEmptyString(answer.text) ||
    toNonEmptyString(answer.email) ||
    toNonEmptyString(answer.input?.value)
  );
}

export function extractPaidLinkageToken(payload: any): string {
  const fromData =
    toNonEmptyString(payload?.data?.payment_linkage_token) ||
    toNonEmptyString(payload?.data?.shared_token) ||
    toNonEmptyString(payload?.data?.stripe_linkage_token) ||
    toNonEmptyString(payload?.data?.linkage_token);

  if (fromData) {
    return fromData;
  }

  const fromHidden =
    toNonEmptyString(payload?.form_response?.hidden?.payment_linkage_token) ||
    toNonEmptyString(payload?.form_response?.hidden?.shared_token);

  if (fromHidden) {
    return fromHidden;
  }

  const answers = Array.isArray(payload?.form_response?.answers) ? payload.form_response.answers : [];

  for (const answer of answers) {
    const fieldId = toNonEmptyString(answer?.field?.id);
    if (
      fieldId === 'payment_linkage_token' ||
      fieldId === 'shared_token' ||
      fieldId === 'stripe_linkage_token' ||
      fieldId === 'linkage_token'
    ) {
      const extracted = extractAnswerString(answer?.answer);
      if (extracted) {
        return extracted;
      }
    }
  }

  return '';
}

export function mapFreeFields(payload: any) {
  return {
    raw_payload: payload,
    email: extractEmail(payload),
    name: payload?.data?.founder_name || payload?.data?.name || '',
    company_name: payload?.data?.company_name || payload?.data?.startup_name || '',
    response_id: extractResponseId(payload),
    event_id: extractEventId(payload),
    source: 'tally-free',
  };
}

export function mapPaidFields(payload: any) {
  return {
    raw_payload: payload,
    email: extractEmail(payload),
    name: payload?.data?.founder_name || payload?.data?.name || '',
    company_name: payload?.data?.company_name || payload?.data?.startup_name || '',
    response_id: extractResponseId(payload),
    event_id: extractEventId(payload),
    payment_linkage_token: extractPaidLinkageToken(payload),
    source: 'tally-paid',
  };
}

export function mapReviewFields(payload: any) {
  return {
    raw_payload: payload,
    email: extractEmail(payload),
    name: payload?.data?.founder_name || payload?.data?.name || '',
    company_name: payload?.data?.company_name || payload?.data?.startup_name || '',
    response_id: extractResponseId(payload),
    event_id: extractEventId(payload),
    source: 'tally-review',
  };
}
