import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  TALLY_WEBHOOK_SECRET_FREE: z.string().min(1).optional(),
  TALLY_WEBHOOK_SECRET_PAID: z.string().min(1).optional(),
  TALLY_WEBHOOK_SECRET_REVIEW: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

export const env = parsed.success ? parsed.data : ({} as z.infer<typeof envSchema>);
