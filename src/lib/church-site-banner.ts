import { prisma } from "@/lib/db";
import { getDenverWeekRange } from "@/lib/denver-time";
import { useDatabase } from "@/lib/use-database";

export type ChurchSiteBanner = {
  label: string;
  href: string;
};

/** Featured strip on the public church homepage (published weekly bulletin title). */
export async function getChurchSiteHomeBanner(): Promise<ChurchSiteBanner | null> {
  if (!useDatabase()) return null;
  try {
    const weekStart = getDenverWeekRange().since;
    const bulletin = await prisma.weeklyBulletin.findUnique({ where: { weekStart } });
    if (!bulletin?.published) return null;
    const title = bulletin.title.trim();
    if (!title) return null;
    return {
      label: title,
      href: "/events",
    };
  } catch {
    return null;
  }
}