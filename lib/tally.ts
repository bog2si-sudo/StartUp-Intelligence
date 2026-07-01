import { z } from 'zod';

const tallyPayloadSchema = z.object({
  event_id: z.string().optional(),
  data: z.any().optional(),
  form_response: z.any().optional(),
});

export function verifyTallyRequest(req: Request, expectedSecret?: string) {
  const signature = req.headers.get('x-tally-signature');
  if (!expectedSecret) {
    return true;
  }

  if (!signature) {
    throw new Error('Missing Tally signature.');
  }

  return signature === expectedSecret;
}

export function parseTallyPayload(payload: unknown): any {
  const parsed = tallyPayloadSchema.safeParse(payload);
  return parsed.success ? parsed.data : payload;
}

export function mapFreeFields(payload: any) {
  return {
    raw_payload: payload,
    email: payload?.data?.email || payload?.form_response?.answers?.find((a: any) => a?.field?.id === 'email')?.answer?.email || '',
    company_name: payload?.data?.company_name || '',
    source: 'tally-free',
  };
}

export function mapPaidFields(payload: any) {
  return {
    raw_payload: payload,
    email: payload?.data?.email || '',
    company_name: payload?.data?.company_name || '',
    source: 'tally-paid',
  };
}

export function mapReviewFields(payload: any) {
  return {
    raw_payload: payload,
    email: payload?.data?.email || '',
    company_name: payload?.data?.company_name || '',
    source: 'tally-review',
  };
}
