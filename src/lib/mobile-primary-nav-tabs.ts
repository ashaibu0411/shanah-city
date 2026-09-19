import { site } from "@/lib/site";

/** Bottom bar tabs — Messages and the rest stay in the More sheet. */
export const mobilePrimaryNavTabs = [
  site.nav[0],
  site.nav[4],
  site.nav[2],
  site.nav.find((item) => item.href === "/live") ?? site.nav[1],
] as const;
