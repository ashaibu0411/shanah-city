import Link from "next/link";
import type { ComponentProps } from "react";
import { appLinkPrefetchEnabled } from "@/components/app/app-link-prefetch";

/** App home links — preview builds skip RSC prefetch (Vercel Deployment Protection). */
export function PremiumHomeV4Link({ prefetch, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} prefetch={appLinkPrefetchEnabled(prefetch)} />;
}