import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function POST(req: Request) {
  const signature = (await headers()).get('stripe-signature');
  const body = await req.text();

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, received: true, body: body.slice(0, 80) });
}
