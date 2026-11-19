import type { ReactNode } from "react";
import { ChurchSiteFrame } from "@/components/church-site/ChurchSiteFrame";

export default function ChurchWebsiteLayout({ children }: {children: ReactNode}) {
  return <ChurchSiteFrame>{children}</ChurchSiteFrame>;
}
