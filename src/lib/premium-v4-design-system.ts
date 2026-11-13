/**
 * Shanah City Premium V4 shared tokens.
 *
 * These tokens are independent of the member's light/dark preference: an individual
 * page chooses a theme via data-sc-theme="cinematic" | "reading" | "workspace".
 * Do not apply V4 dark styles globally or change transactional forms.
 */
export const premiumV4Tokens = {
  navy: "#061329",
  deepBlue: "#152744",
  navyCard: "#1B2D4B",
  royalPurple: "#512D83",
  electricViolet: "#8B4DD8",
  metallicGold: "#E9BC72",
  warmCream: "#F6EBD5",
  white: "#FFFFFF",
  readingSurface: "#FFFCF5",
  readingInk: "#252233",
} as const;

export const premiumV4PageThemes = {
  "/live": "cinematic",
  "/sermons": "cinematic",
  /* /community — V6 light social feed (no cinematic navy shell) */
  "/calendar": "reading",
  "/devotions": "reading",
  "/give": "reading",
  "/groups": "reading",
  "/marriage": "workspace",
  "/admin": "workspace",
} as const;

export type PremiumV4Theme = "cinematic" | "reading" | "workspace";

export function premiumV4ThemeForPath(path: string): PremiumV4Theme | null {
  // Do not apply a blanket theme to deeply nested pages. A page must explicitly
  // adopt the design tokens/components after accessibility and screenshot review.
  return Object.prototype.hasOwnProperty.call(premiumV4PageThemes, path)
    ? premiumV4PageThemes[path as keyof typeof premiumV4PageThemes]
    : null;
}
