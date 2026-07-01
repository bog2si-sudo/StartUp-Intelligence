import { Resend } from 'resend';
import { env } from './env';

export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!resend || !env.RESEND_FROM_EMAIL) {
    return null;
  }

  return resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
    text,
  });
}
