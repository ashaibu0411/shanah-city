type LinkPrefetch = boolean | "auto" | "unstable_forceStale" | null | undefined;

/** Next.js RSC prefetch fails on Vercel Deployment Protection; disable only on preview. */
export function appLinkPrefetchEnabled(explicit?: LinkPrefetch): LinkPrefetch {
  if (explicit !== undefined && explicit !== null) return explicit;
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") return false;
  return undefined;
}