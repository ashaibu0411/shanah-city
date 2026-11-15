import type { MinistryLeaderReport } from "@/lib/ministry-report-types";

type Metric = { actual: number | null; target: number | null; unit: string; reportedMonths: number };
type Quarter = { quarter: number; reportedMonths: number; reviewedReports: number; touchpoints: number | null; bibleBrunch: number | null; reviewed: boolean; actions: string | null };
export type TransformedWomenScorecard = {
  metrics: {
    monthlyTouchpoints: Metric;
    bibleBrunch: Metric;
    firstTimeBrunchGuests: Metric;
    newWomenConnected: Metric;
    annualFlagship: Metric;
    quarterlyReviews: Metric;
    engagedWomen: Metric;
    sundayAttendance: Metric;
  };
  quarters: Quarter[];
  engagement: { newcomers: number | null; followUps: number | null; mentored: number | null; flagshipInvites: number | null; flagshipGuests: number | null; communityInvitations: number | null; communityFollowUps: number | null };
  baseline: number | null;
  baselineEvidence: string | null;
  sundayGrowthPercent: number | null;
  reportedMonths: number;
};

function nonNegative(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
function sum(rows: MinistryLeaderReport[], key: string): number | null {
  const values = rows.map(row => nonNegative(row.responses[key])).filter((n): n is number => n !== null);
  return values.length ? values.reduce((a, b) => a + b, 0) : null;
}
function average(rows: MinistryLeaderReport[], key: string): number | null {
  const values = rows.map(row => nonNegative(row.responses[key])).filter((n): n is number => n !== null);
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : null;
}

/** Submitted, reviewed reports only. Null means not reported, never presumed zero. */
export function buildTransformedWomenScorecard(allReports: MinistryLeaderReport[]): TransformedWomenScorecard {
  const valid = allReports.filter(row =>
    row.groupId === "group-shanah-ladies" && /^2027-(0[1-9]|1[0-2])$/.test(row.reportMonth)
    && (row.status === "submitted" || row.status === "reviewed") && Boolean(row.submittedAt)
  ).sort((a, b) => a.reportMonth.localeCompare(b.reportMonth));
  const rows = [...new Map(valid.map(row => [row.reportMonth, row])).values()];
  const baselineReport = rows.find(row =>
    nonNegative(row.responses.womensSunday2026Baseline) !== null && String(row.responses.baselineEvidence || "").trim()
  );
  const baseline = baselineReport ? nonNegative(baselineReport.responses.womensSunday2026Baseline) : null;
  const baselineEvidence = baselineReport ? String(baselineReport.responses.baselineEvidence) : null;
  const sunday = average(rows, "womensSundayAverage");
  const growth = baseline != null && baseline > 0 && sunday != null
    ? Math.round((sunday / baseline - 1) * 1000) / 10 : null;
  const quarters: Quarter[] = Array.from({ length: 4 }, (_, i) => {
    const qrows = rows.filter(row => {
      const month = Number(row.reportMonth.slice(5));
      return month >= i * 3 + 1 && month <= i * 3 + 3;
    });
    const reviewed = qrows.find(row => row.status === "reviewed"
      && row.responses.quarterlyReviewCompleted === "Yes — completed"
      && String(row.responses.quarterlyActions || "").trim());
    return {
      quarter: i + 1,
      reportedMonths: qrows.length,
      reviewedReports: qrows.filter(row => row.status === "reviewed").length,
      touchpoints: sum(qrows, "monthlyTouchpointsHeld"),
      bibleBrunch: sum(qrows, "bibleBrunchHeld"),
      reviewed: Boolean(reviewed),
      actions: reviewed ? String(reviewed.responses.quarterlyActions) : null,
    };
  });
  const metric = (actual: number | null, target: number | null, unit: string, key: string): Metric => ({
    actual, target, unit, reportedMonths: rows.filter(row => row.responses[key] !== undefined && row.responses[key] !== "").length,
  });
  return {
    metrics: {
      monthlyTouchpoints: metric(sum(rows, "monthlyTouchpointsHeld"), 12, "touchpoints", "monthlyTouchpointsHeld"),
      bibleBrunch: metric(sum(rows, "bibleBrunchHeld"), 6, "in-person gatherings", "bibleBrunchHeld"),
      firstTimeBrunchGuests: metric(sum(rows, "bibleBrunchFirstTimeCommunity"), 12, "first-time brunch participants", "bibleBrunchFirstTimeCommunity"),
      newWomenConnected: metric(sum(rows, "newWomenConnected"), 12, "distinct new connections", "newWomenConnected"),
      annualFlagship: metric(rows.length ? rows.some(row => row.responses.annualFlagshipHeld === "Yes — completed") ? 1 : 0 : null, 1, "flagship", "annualFlagshipHeld"),
      quarterlyReviews: metric(rows.length ? quarters.filter(q => q.reviewed).length : null, 4, "reviews", "quarterlyReviewCompleted"),
      engagedWomen: metric(average(rows, "membersEngaged"), null, "average engaged women", "membersEngaged"),
      sundayAttendance: metric(sunday, null, "average verified Sunday attendance", "womensSundayAverage"),
    },
    quarters,
    engagement: {
      newcomers: sum(rows, "newWomenConnected"),
      followUps: sum(rows, "womenFollowUpsCount"),
      mentored: sum(rows, "womenMentoredCount"),
      flagshipInvites: sum(rows, "flagshipInvitations"),
      flagshipGuests: sum(rows, "flagshipGuests"),
      communityInvitations: sum(rows, "communityInvitations"),
      communityFollowUps: sum(rows, "communityFollowUps"),
    },
    baseline,
    baselineEvidence,
    sundayGrowthPercent: growth,
    reportedMonths: rows.length,
  };
}
