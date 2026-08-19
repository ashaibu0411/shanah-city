import { createHash } from "crypto";
import { getZonedDateParts } from "@/lib/denver-time";

export type ParsedIcsDate = {
  dateKey: string;
  hour: number;
  minute: number;
  dateOnly: boolean;
};

export type ParsedIcsEvent = {
  uid: string;
  summary: string;
  location: string;
  description: string;
  cancelled: boolean;
  recurrenceId: string | null;
  start: ParsedIcsDate;
  end: ParsedIcsDate | null;
  rrule: string | null;
};

const WEEKDAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

function unfoldIcs(raw: string) {
  return raw.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function unescapeIcs(value: string) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function parseNameParams(rawName: string) {
  const [name, ...rest] = rawName.split(";");
  const params: Record<string, string> = {};
  for (const part of rest) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1).replace(/^"|"$/g, "");
  }
  return { name: name.toUpperCase(), params };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function wallClockDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseIcsDateTime(value: string, params: Record<string, string>): ParsedIcsDate {
  const compact = value.replace(/[-:]/g, "");
  const dateOnly = params.VALUE === "DATE" || /^\d{8}$/.test(compact);

  if (dateOnly) {
    return {
      dateKey: wallClockDateKey(
        Number(compact.slice(0, 4)),
        Number(compact.slice(4, 6)),
        Number(compact.slice(6, 8)),
      ),
      hour: 0,
      minute: 0,
      dateOnly: true,
    };
  }

  const utc = compact.endsWith("Z");
  const stamp = compact.replace(/Z$/, "");
  const year = Number(stamp.slice(0, 4));
  const month = Number(stamp.slice(4, 6));
  const day = Number(stamp.slice(6, 8));
  const hour = Number(stamp.slice(9, 11) || "0");
  const minute = Number(stamp.slice(11, 13) || "0");

  if (utc) {
    const parts = getZonedDateParts(new Date(Date.UTC(year, month - 1, day, hour, minute)));
    return {
      dateKey: parts.dateKey,
      hour: parts.hour,
      minute: parts.minute,
      dateOnly: false,
    };
  }

  return {
    dateKey: wallClockDateKey(year, month, day),
    hour,
    minute,
    dateOnly: false,
  };
}

function parseRruleMap(rrule: string) {
  const map: Record<string, string> = {};
  for (const part of rrule.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    map[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1);
  }
  return map;
}

export function parseRruleWeekdays(rrule: string | null) {
  if (!rrule) return [] as number[];
  const map = parseRruleMap(rrule);
  if ((map.FREQ ?? "").toUpperCase() !== "WEEKLY") return [];
  const interval = Number(map.INTERVAL ?? "1");
  if (interval > 1) return [];

  const byDay = (map.BYDAY ?? "")
    .split(",")
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean)
    .map((token) => token.replace(/^-?\d+/, ""));

  return byDay
    .map((code) => WEEKDAY_CODES.indexOf(code as (typeof WEEKDAY_CODES)[number]))
    .filter((day) => day >= 0);
}

export function parseRruleUntilDate(rrule: string | null) {
  if (!rrule) return null;
  const until = parseRruleMap(rrule).UNTIL;
  if (!until) return null;
  return parseIcsDateTime(until, until.length === 8 ? { VALUE: "DATE" } : {}).dateKey;
}

export function parseRruleMonthlyNthWeekday(rrule: string | null) {
  if (!rrule) return null;
  const map = parseRruleMap(rrule);
  if ((map.FREQ ?? "").toUpperCase() !== "MONTHLY") return null;
  const byDay = (map.BYDAY ?? "").split(",")[0]?.trim().toUpperCase();
  if (!byDay) return null;
  const match = byDay.match(/^(\d+)(SU|MO|TU|WE|TH|FR|SA)$/);
  if (!match) return null;
  const nth = Number(match[1]);
  const weekday = WEEKDAY_CODES.indexOf(match[2] as (typeof WEEKDAY_CODES)[number]);
  if (nth !== 1 || weekday < 0) return null;
  return weekday;
}

export function outlookEventId(uid: string, suffix = "") {
  const hash = createHash("sha1").update(uid).digest("hex").slice(0, 20);
  return suffix ? `outlook-${hash}-${suffix}` : `outlook-${hash}`;
}

export function parseIcsEvents(raw: string): ParsedIcsEvent[] {
  const unfolded = unfoldIcs(raw);
  const events: ParsedIcsEvent[] = [];
  const blocks = unfolded.split("BEGIN:VEVENT");

  for (const block of blocks.slice(1)) {
    const body = block.split("END:VEVENT")[0] ?? "";
    const fields = new Map<string, { params: Record<string, string>; value: string }>();

    for (const line of body.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const colon = trimmed.indexOf(":");
      if (colon === -1) continue;
      const { name, params } = parseNameParams(trimmed.slice(0, colon));
      fields.set(name, { params, value: unescapeIcs(trimmed.slice(colon + 1)) });
    }

    const uid = fields.get("UID")?.value;
    const summary = fields.get("SUMMARY")?.value;
    const startField = fields.get("DTSTART");
    if (!uid || !summary || !startField) continue;

    const endField = fields.get("DTEND");
    events.push({
      uid,
      summary,
      location: fields.get("LOCATION")?.value ?? "",
      description: fields.get("DESCRIPTION")?.value ?? "",
      cancelled: (fields.get("STATUS")?.value ?? "").toUpperCase() === "CANCELLED",
      recurrenceId: fields.get("RECURRENCE-ID")?.value ?? null,
      start: parseIcsDateTime(startField.value, startField.params),
      end: endField ? parseIcsDateTime(endField.value, endField.params) : null,
      rrule: fields.get("RRULE")?.value ?? null,
    });
  }

  return events;
}
