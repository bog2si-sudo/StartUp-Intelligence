import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { env } from '@/lib/env';
import { parseTallyPayload, verifyTallyRequest } from '@/lib/tally';
import { sendEmail } from '@/lib/resend';

export async function POST(req: Request) {
  if (!env.TALLY_WEBHOOK_SECRET_PAID) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const body = await req.text();
  const payload = parseTallyPayload(JSON.parse(body));

  if (!verifyTallyRequest(req, env.TALLY_WEBHOOK_SECRET_PAID)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reportToken = nanoid(32);
  const email = payload?.data?.email || '';

  await sendEmail({
    to: email,
    subject: 'Complete your paid report checkout',
    html: `<p>Complete your checkout to receive your report.</p><p>Token: ${reportToken}</p>`,
    text: `Complete your checkout to receive your report. Token: ${reportToken}`,
  });

  return NextResponse.json({ ok: true, reportToken });
}
