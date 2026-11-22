export const FASTING_TIME_ZONE = "America/Denver";
export const FASTING_GUIDE_YEAR = 2026;
export const FASTING_GUIDE_START = "2026-11-30";
export const FASTING_GUIDE_END = "2026-12-13";
export const FASTING_GUIDE_NOTIFY_HOUR = 7;
export const FASTING_GUIDE_NOTIFY_MINUTE = 0;
export const FASTING_GUIDE_DAYS = [
  ["Consecration for Expansion", "Romans 12:1–2"],
  ["Breaking the Limitations", "Isaiah 54:2–3"],
  ["Divine Enlargement", "1 Chronicles 4:10"],
  ["Evidence of God's Promises", "Hebrews 11:1–2"],
  ["Supernatural Fruitfulness", "Genesis 26:12–14"],
  ["Restoration of Lost Years", "Joel 2:25–27"],
  ["Open Doors and Divine Opportunities", "Revelation 3:7–8"],
  ["Financial and Material Expansion", "Deuteronomy 8:18"],
  ["Expansion of Shanah City", "Isaiah 54:2–3"],
  ["Families and Generational Blessings", "Isaiah 44:3–4"],
  ["Divine Speed and Acceleration", "Amos 9:13"],
  ["Victory Over Opposition", "Isaiah 54:17"],
  ["Manifestation and Testimonies", "Luke 1:45"],
  ["Thanksgiving and Prophetic Entrustment", "Psalm 65:11"],
] as const;
export function fastingGuideDay(reference = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: FASTING_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(reference);
  const index = Math.round((Date.parse(date + "T00:00:00Z") - Date.parse(FASTING_GUIDE_START + "T00:00:00Z")) / 86400000);
  return index >= 0 && index < FASTING_GUIDE_DAYS.length ? index + 1 : null;
}
export function fastingGuideNotifyDue(reference = new Date()) {
  const day = fastingGuideDay(reference);
  if (!day) return null;
  const parts = new Intl.DateTimeFormat("en-US", {timeZone: FASTING_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23"}).formatToParts(reference);
  const hour = Number(parts.find(p=>p.type==="hour")?.value ?? -1);
  const minute = Number(parts.find(p=>p.type==="minute")?.value ?? -1);
  return hour === FASTING_GUIDE_NOTIFY_HOUR && minute >= FASTING_GUIDE_NOTIFY_MINUTE && minute < FASTING_GUIDE_NOTIFY_MINUTE + 15 ? day : null;
}
