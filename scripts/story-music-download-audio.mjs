/**
 * Download approved source audio with Retry-After and bounded exponential backoff.
 */

export function parseRetryAfterMs(retryAfterHeader) {
  if (!retryAfterHeader?.trim()) return null;
  const trimmed = retryAfterHeader.trim();
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const dateMs = Date.parse(trimmed);
  if (Number.isFinite(dateMs)) return Math.max(0, dateMs - Date.now());
  return null;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} url
 * @param {{ maxAttempts?: number, label?: string }} [opts]
 */
export async function fetchAudioWithRetry(url, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? 5;
  const label = opts.label ?? url.slice(0, 80);
  let lastStatus = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(url, {
      headers: { "User-Agent": "ShanahCityStoryMusic/1.0 (approved-ingest)" },
    });
    if (response.ok) return response;

    lastStatus = response.status;
    const retryable = response.status === 429 || response.status === 503;
    if (!retryable || attempt >= maxAttempts) {
      throw new Error(
        `Download failed HTTP ${response.status} for ${label}${retryable ? " (rate limit; retries exhausted)" : ""}`,
      );
    }

    const fromHeader = parseRetryAfterMs(response.headers.get("Retry-After"));
    const backoff = Math.min(120_000, 8_000 * 2 ** (attempt - 1));
    const waitMs = fromHeader ?? backoff;
    console.error(
      `HTTP ${response.status} for ${label}; waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt}/${maxAttempts})`,
    );
    await sleep(waitMs);
  }

  throw new Error(`Download failed HTTP ${lastStatus}`);
}
