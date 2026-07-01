import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { env } from '@/lib/env';
import { parseTallyPayload, verifyTallyRequest } from '@/lib/tally';
import { sendEmail } from '@/lib/resend';

export async function POST(req: Request) {
  const body = await req.text();
  const payload = parseTallyPayload(JSON.parse(body));

  if (!verifyTallyRequest(req, env.TALLY_WEBHOOK_SECRET_FREE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reportToken = nanoid(32);
  const email = payload?.data?.email || '';

  await sendEmail({
    to: email || env.INTERNAL_ALERT_EMAIL || 'hello@example.com',
    subject: 'Your startup assessment is being prepared',
    html: `<p>Your report is being generated.</p><p>Token: ${reportToken}</p>`,
    text: `Your report is being generated. Token: ${reportToken}`,
  });

  return NextResponse.json({ ok: true, reportToken });
}
