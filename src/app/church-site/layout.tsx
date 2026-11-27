import type { ReactNode } from "react";
import { ChurchSiteFrame } from "@/components/church-site/ChurchSiteFrame";
import "@/components/church-site/church-site-premium.css";
import "@/components/church-site/church-site-v5.css";

export default function ChurchWebsiteLayout({ children }: {children: ReactNode}) {
  return <ChurchSiteFrame>{children}</ChurchSiteFrame>;
}
