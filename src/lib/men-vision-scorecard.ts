import type { MinistryLeaderReport } from "@/lib/ministry-report-types";

type Metric = { actual: number | null; target: number; unit: string; baseline?: number | null; growthPct?: number | null; reportedMonths: number };
type Quarter = { quarter: number; reportedMonths: number; reviewedMonths: number; reviewCompleted: boolean; prayerSessions: number | null; breakfastSessions: number | null; summary: string | null };
export type MenVisionScorecard = {
  metrics: { prayer: Metric; breakfast: Metric; sunday: Metric; prayerMeetings: Metric; breakfasts: Metric; quarterlyReviews: Metric };
  quarters: Quarter[];
  baselineEvidence: string | null;
  engagement: { followUps: number | null; emergingLeaders: number | null; fathersDayInvitations: number | null; fathersDayGuests: number | null };
  reportedMonths: number;
  missingMonths: string[];
  asOf: string;
};

function number(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function sumOrNull(rows: MinistryLeaderReport[], key: string) {
  const values = rows.map(row => number(row.responses[key])).filter((value): value is number => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

function baseline(rows: MinistryLeaderReport[], key: string) {
  const entry = rows.find(row => number(row.responses[key]) !== null && Boolean(String(row.responses.baselineEvidence || "").trim()));
  return entry ? number(entry.responses[key]) : null;
}

function growth(actual: number | null, base: number | null) {
  return actual !== null && base !== null && base > 0 ? Math.round((actual / base - 1) * 1000) / 10 : null;
}

/** Do not treat absent reporting as zero. Draft or returned reports are not evidence. */
export function buildMenVisionScorecard(allReports: MinistryLeaderReport[]): MenVisionScorecard {
  const reports = allReports.filter(row =>
    row.groupId === "group-men-legacy" && /^2027-(0[1-9]|1[0-2])$/.test(row.reportMonth) &&
    (row.status === "submitted" || row.status === "reviewed") && Boolean(row.submittedAt)
  ).sort((a, b) => a.reportMonth.localeCompare(b.reportMonth));

  const unique = [...new Map(reports.map(row => [row.reportMonth, row])).values()];
  const months = Array.from({ length: 12 }, (_, i) => "2027-" + String(i + 1).padStart(2, "0"));
  const prayerSessions = sumOrNull(unique, "prayerMeetingsHeld");
  const breakfastSessions = sumOrNull(unique, "breakfastMeetingsHeld");
  const prayerTotal = sumOrNull(unique, "prayerTotalAttendance");
  const breakfastTotal = sumOrNull(unique, "breakfastTotalAttendance");
  const prayerAverage = prayerTotal !== null && prayerSessions !== null && prayerSessions > 0 ? Math.round(prayerTotal / prayerSessions * 10) / 10 : null;
  const breakfastAverage = breakfastTotal !== null && breakfastSessions !== null && breakfastSessions > 0 ? Math.round(breakfastTotal / breakfastSessions * 10) / 10 : null;
  const sundayValues = unique.map(row => number(row.responses.sundayMenAverage)).filter((n): n is number => n !== null);
  const sundayAverage = sundayValues.length ? Math.round(sundayValues.reduce((a, b) => a + b, 0) / sundayValues.length * 10) / 10 : null;
  const prayerBase = baseline(unique, "prayer2026Baseline");
  const breakfastBase = baseline(unique, "breakfast2026Baseline");
  const sundayBase = baseline(unique, "sunday2026Baseline");

  const quarters: Quarter[] = Array.from({ length: 4 }, (_, i) => {
    const rows = unique.filter(r => Number(r.reportMonth.slice(-2)) >= i * 3 + 1 && Number(r.reportMonth.slice(-2)) <= i * 3 + 3);
    const completed = rows.find(r => r.status === "reviewed" && r.responses.quarterlyReviewCompleted === "Yes — completed" && String(r.responses.quarterlyActions || "").trim());
    return {
      quarter: i + 1,
      reportedMonths: rows.length,
      reviewedMonths: rows.filter(r => r.status === "reviewed").length,
      reviewCompleted: Boolean(completed),
      prayerSessions: sumOrNull(rows, "prayerMeetingsHeld"),
      breakfastSessions: sumOrNull(rows, "breakfastMeetingsHeld"),
      summary: completed ? String(completed.responses.quarterlyActions) : null,
    };
  });
  const completedReviews = quarters.filter(q => q.reviewCompleted).length;
  const baselineSource = unique.find(r => String(r.responses.baselineEvidence || "").trim());
  const metric = (actual: number | null, target: number, unit: string, reportedMonths: number, base?: number | null): Metric =>
    ({ actual, target, unit, reportedMonths, ...(base !== undefined ? { baseline: base, growthPct: growth(actual, base) } : {}) });
  return {
    metrics: {
      prayer: metric(prayerAverage, 30, "growth %", unique.filter(r => number(r.responses.prayerTotalAttendance) !== null && number(r.responses.prayerMeetingsHeld) !== null && number(r.responses.prayerMeetingsHeld)! > 0).length, prayerBase),
      breakfast: metric(breakfastAverage, 25, "growth %", unique.filter(r => number(r.responses.breakfastTotalAttendance) !== null && number(r.responses.breakfastMeetingsHeld) !== null && number(r.responses.breakfastMeetingsHeld)! > 0).length, breakfastBase),
      sunday: metric(sundayAverage, 20, "growth % (20–30% goal)", sundayValues.length, sundayBase),
      prayerMeetings: metric(prayerSessions, 12, "sessions", unique.filter(r => number(r.responses.prayerMeetingsHeld) !== null).length),
      breakfasts: metric(breakfastSessions, 6, "sessions", unique.filter(r => number(r.responses.breakfastMeetingsHeld) !== null).length),
      quarterlyReviews: metric(unique.length ? completedReviews : null, 4, "reviews", unique.length),
    },
    quarters,
    baselineEvidence: baselineSource ? String(baselineSource.responses.baselineEvidence) : null,
    engagement: { followUps: sumOrNull(unique, "menFollowUpsCount"), emergingLeaders: sumOrNull(unique, "leadershipDevelopmentCount"), fathersDayInvitations: sumOrNull(unique, "fathersDayInvitations"), fathersDayGuests: sumOrNull(unique, "fathersDayGuests") },
    reportedMonths: unique.length,
    missingMonths: months.filter(month => !unique.some(r => r.reportMonth === month)),
    asOf: new Date().toISOString(),
  };
}
