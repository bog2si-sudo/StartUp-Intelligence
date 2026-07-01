import OpenAI from 'openai';
import { env } from './env';

export const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export async function runJsonPrompt({
  system,
  prompt,
  schemaDescription,
}: {
  system: string;
  prompt: string;
  schemaDescription: string;
}) {
  if (!openai) {
    throw new Error('OpenAI client is not configured.');
  }

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    input: [
      { role: 'system', content: `${system}\n\nExpected JSON schema:\n${schemaDescription}` },
      { role: 'user', content: prompt },
    ],
  });

  const text = response.output_text ?? '';
  return JSON.parse(text);
}
