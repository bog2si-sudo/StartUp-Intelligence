import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { parseTallyPayload, verifyTallyRequest } from '@/lib/tally';

export async function POST(req: Request) {
  const body = await req.text();
  const payload = parseTallyPayload(JSON.parse(body));

  if (!verifyTallyRequest(req, env.TALLY_WEBHOOK_SECRET_REVIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ ok: true, received: true, payload });
}
