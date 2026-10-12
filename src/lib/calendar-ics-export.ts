/** Build a minimal ICS file for one church event (device calendar export). */
export function buildIcsEventFile(input: {
  uid: string;
  title: string;
  dateKey: string;
  time24: string;
  durationMinutes?: number;
  location?: string;
  description?: string;
}) {
  const [hour, minute] = input.time24.split(":").map((part) => part.padStart(2, "0"));
  const start = `${input.dateKey.replace(/-/g, "")}T${hour}${minute}00`;
  const duration = input.durationMinutes ?? 90;
  const endDate = addMinutesToDateKey(input.dateKey, input.time24, duration);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shanah City Church//Worship Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(input.uid)}@shanah-city`,
    `DTSTAMP:${formatIcsUtcNow()}`,
    `DTSTART;TZID=America/Denver:${start}`,
    `DTEND;TZID=America/Denver:${endDate}`,
    `SUMMARY:${escapeIcs(input.title)}`,
  ];
  if (input.location?.trim()) {
    lines.push(`LOCATION:${escapeIcs(input.location.trim())}`);
  }
  if (input.description?.trim()) {
    lines.push(`DESCRIPTION:${escapeIcs(input.description.trim())}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

export function downloadIcsFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatIcsUtcNow() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function addMinutesToDateKey(dateKey: string, time24: string, minutes: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time24.split(":").map(Number);
  const when = new Date(year, month - 1, day, hour, minute, 0);
  when.setMinutes(when.getMinutes() + minutes);
  const y = when.getFullYear();
  const m = String(when.getMonth() + 1).padStart(2, "0");
  const d = String(when.getDate()).padStart(2, "0");
  const h = String(when.getHours()).padStart(2, "0");
  const min = String(when.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}T${h}${min}00`;
}
