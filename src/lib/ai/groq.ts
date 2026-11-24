const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-20b';
const TIMEOUT_MS = 30_000;
const MAX_COMPLETION_TOKENS = 1024;

export type GroqMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type GroqErrorKind = 'missing-key' | 'rate-limited' | 'timeout' | 'network' | 'bad-response';

export class GroqError extends Error {
  readonly kind: GroqErrorKind;
  readonly status: number | null;

  constructor(kind: GroqErrorKind, message: string, status: number | null = null) {
    super(message);
    this.name = 'GroqError';
    this.kind = kind;
    this.status = status;
  }
}

type CompletionResponse = {
  choices?: { message?: { content?: string | null } }[];
};

type ErrorResponse = {
  error?: { message?: string };
};

function apiKey(): string {
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY?.trim();
  if (!key) throw new GroqError('missing-key', 'EXPO_PUBLIC_GROQ_API_KEY is not set.');
  return key;
}

function model(): string {
  return process.env.EXPO_PUBLIC_GROQ_MODEL?.trim() || DEFAULT_MODEL;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorResponse;
    return body.error?.message ?? `Groq responded with ${response.status}.`;
  } catch {
    return `Groq responded with ${response.status}.`;
  }
}

export async function chatCompletion(messages: GroqMessage[]): Promise<string> {
  const key = apiKey();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model(),
        messages,
        reasoning_effort: 'low',
        include_reasoning: false,
        max_completion_tokens: MAX_COMPLETION_TOKENS,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    if (controller.signal.aborted) throw new GroqError('timeout', 'Groq took too long to respond.');
    throw new GroqError('network', e instanceof Error ? e.message : 'Network request failed.');
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) {
    throw new GroqError('rate-limited', await readErrorMessage(response), 429);
  }
  if (!response.ok) {
    throw new GroqError('bad-response', await readErrorMessage(response), response.status);
  }

  let body: CompletionResponse;
  try {
    body = (await response.json()) as CompletionResponse;
  } catch {
    throw new GroqError('bad-response', 'Groq sent a reply that could not be read.', response.status);
  }

  const content = body.choices?.[0]?.message?.content?.trim();
  if (!content) throw new GroqError('bad-response', 'Groq sent an empty reply.', response.status);
  return content;
}
