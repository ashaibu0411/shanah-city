import { site } from "@/lib/site";

/** Bottom bar tabs — anything else (including Media) stays in the More sheet. */
export const mobilePrimaryNavTabs = [
  site.nav[0],
  site.nav[4],
  site.nav[2],
  site.nav.find((item) => item.href === "/messages") ?? site.nav[6],
] as const;
