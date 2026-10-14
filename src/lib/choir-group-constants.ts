import { CALENDAR_GROUP_TABS } from "@/lib/church-groups";

export const SHANAH_WORSHIP_GROUP_ID = CALENDAR_GROUP_TABS.choir;

export const CHOIR_BRAND_TAGLINE = "One Sound. One Heart. One Presence.";

/** Replace with a dedicated choir hero asset when available. */
export const CHOIR_HERO_IMAGE_PATH = "/home/home-gallery-45.jpg";
/** Cropped worship photo for the choir home welcome banner (no overlay text). */
export const CHOIR_HOME_WELCOME_IMAGE_PATH = "/home/shanah-worship-welcome.jpg";

export const CHOIR_WORD_FOR_TEAM = {
  reference: "Psalm 100:2 (KJV)",
  text: "Serve the LORD with gladness: come before his presence with singing.",
};

export const CHOIR_PREPARATION_ITEMS = [
  { id: "listen", label: "Listen to assigned songs" },
  { id: "practice", label: "Practice my vocal or instrumental part" },
  { id: "notes", label: "Review service notes" },
  { id: "availability", label: "Confirm my availability" },
] as const;

export type ChoirPreparationItemId = (typeof CHOIR_PREPARATION_ITEMS)[number]["id"];

export function choirPlanKey(serviceDate: string, serviceTime: string) {
  return `${serviceDate}|${serviceTime}`;
}
