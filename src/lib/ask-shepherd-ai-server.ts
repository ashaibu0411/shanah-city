/**
 * Server-only AI calls for Ask Shepherd.
 * Credentials never exposed to the browser.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type AiChatResult =
  | { ok: true; text: string; model: string }
  | { ok: false; code: "not_configured" | "provider_error"; message: string };

function getModel() {
  return process.env.ASK_SHEPHERD_AI_MODEL?.trim() || "gpt-4o-mini";
}

function getApiUrl() {
  const explicit = process.env.ASK_SHEPHERD_AI_API_URL?.trim();
  if (explicit) return explicit;
  return "https://api.openai.com/v1/chat/completions";
}

export function isAskShepherdAiConfigured(): boolean {
  return Boolean(process.env.ASK_SHEPHERD_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim());
}

/** Test hook: override fetch for mocks. */
let fetchImpl: typeof fetch = globalThis.fetch;

export function setAskShepherdAiFetchForTests(fn: typeof fetch) {
  fetchImpl = fn;
}

export function resetAskShepherdAiFetchForTests() {
  fetchImpl = globalThis.fetch;
}

export async function callAskShepherdChat(messages: ChatMessage[]): Promise<AiChatResult> {
  const apiKey = process.env.ASK_SHEPHERD_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, code: "not_configured", message: "AI provider is not configured." };
  }

  const model = getModel();
  const url = getApiUrl();
  const maxTokens = Math.min(4096, Math.max(256, Number(process.env.ASK_SHEPHERD_AI_MAX_TOKENS) || 1200));

  const controller = new AbortController();
  const timeoutMs = Math.min(120_000, Math.max(5_000, Number(process.env.ASK_SHEPHERD_AI_TIMEOUT_MS) || 45_000));
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.4,
      }),
      signal: controller.signal,
    });

    const raw = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        code: "provider_error",
        message: raw.slice(0, 500) || `HTTP ${res.status}`,
      };
    }
    const data = JSON.parse(raw) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return { ok: false, code: "provider_error", message: "Empty model response." };
    }
    return { ok: true, text: text.slice(0, 24_000), model };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return { ok: false, code: "provider_error", message: msg };
  } finally {
    clearTimeout(timer);
  }
}
