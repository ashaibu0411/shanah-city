/**
 * Ask Shepherd — server-side and public UI flags (defaults off).
 */
export function isAskShepherdEnabledServer(): boolean {
  return process.env.ASK_SHEPHERD_ENABLED === "1" || process.env.ASK_SHEPHERD_ENABLED === "true";
}

export function isAskShepherdUiPublicEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ASK_SHEPHERD === "1" || process.env.NEXT_PUBLIC_ASK_SHEPHERD === "true";
}
