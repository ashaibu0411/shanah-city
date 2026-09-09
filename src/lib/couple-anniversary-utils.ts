/** Days until next anniversary (0 = today). Returns null if invalid. */
export function daysUntilAnniversary(anniversaryDate: string, reference = new Date()) {
  const parts = anniversaryDate.trim().split("-");
  if (parts.length < 2) return null;

  const month = Number(parts.length >= 3 ? parts[1] : parts[0]);
  const day = Number(parts.length >= 3 ? parts[2] : parts[1]);
  if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);

  let target = new Date(start.getFullYear(), month - 1, day);
  target.setHours(0, 0, 0, 0);
  if (target.getTime() < start.getTime()) {
    target = new Date(start.getFullYear() + 1, month - 1, day);
  }

  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

export function yearsMarried(anniversaryDate: string, reference = new Date()) {
  const parts = anniversaryDate.trim().split("-");
  if (parts.length < 3) return null;
  const year = Number(parts[0]);
  if (!year) return null;
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!month || !day) return null;

  let years = reference.getFullYear() - year;
  const beforeAnniversary =
    reference.getMonth() + 1 < month ||
    (reference.getMonth() + 1 === month && reference.getDate() < day);
  if (beforeAnniversary) years -= 1;
  return Math.max(0, years);
}

export function shouldShowAnniversaryNudge(anniversaryDate: string | null | undefined, reference = new Date()) {
  if (!anniversaryDate) return false;
  const days = daysUntilAnniversary(anniversaryDate, reference);
  return days != null && days >= 0 && days <= 7;
}

export function formatAnniversaryInputValue(value?: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return "";
}
