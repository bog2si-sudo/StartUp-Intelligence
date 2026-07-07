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
