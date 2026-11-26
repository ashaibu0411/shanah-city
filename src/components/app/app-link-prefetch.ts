/** Next.js RSC prefetch fails on Vercel Deployment Protection; disable only on preview. */
export function appLinkPrefetchEnabled(explicit?: boolean) {
  if (explicit !== undefined) return explicit;
  return process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview";
}