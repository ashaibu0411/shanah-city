/** Public path to the Shanah City logo used in push notifications. */
export const PUSH_ICON_PATH = "/shanah-city-logo.png";

/** Smaller badge image for web notification trays (Chrome/Android). */
export const PUSH_BADGE_PATH = "/push-badge-96.png";

export function getPublicAppOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return "https://shanah-city.vercel.app";
}

export function getPushIconUrl(origin = getPublicAppOrigin()) {
  return `${origin}${PUSH_ICON_PATH}`;
}

export function getPushBadgeUrl(origin = getPublicAppOrigin()) {
  return `${origin}${PUSH_BADGE_PATH}`;
}

export function withPushBranding<T extends { title: string; body: string; url: string }>(
  payload: T,
  origin = getPublicAppOrigin(),
) {
  return {
    ...payload,
    icon: getPushIconUrl(origin),
    badge: getPushBadgeUrl(origin),
  };
}
