import type { MinistryLeaderReport } from "@/lib/ministry-report-types";

export type MinistryKey = "worship" | "young-adults" | "kids";
export type VisionScoreMetric = { key: string; label: string; target: number | null; actual: number | null; unit: string };
export type VisionQuarter = { quarter: number; reports: number; reviewedReports: number; leadershipReview: boolean; summary: string | null };
export type VisionMinistryScorecard = { ministry: MinistryKey; title: string; metrics: VisionScoreMetric[]; quarters: VisionQuarter[]; reportedMonths: number };

type Configuration = {
  title: string;
  groupId: string;
  metrics: Array<{ key: string; label: string; target: number | null; type: "sum" | "mean" | "yes" | "exists"; field: string; unit: string }>;
  reviewField: string;
  actionField: string;
};

export const VISION_SCORE_CONFIG: Record<MinistryKey, Configuration> = {
  worship: {
    title: "Shanah Worship", groupId: "group-choir",
    reviewField: "worshipQuarterlyReviewed", actionField: "worshipQuarterlyActions",
    metrics: [
      { key: "worshipAtWell", label: "Worship at the Well editions", target: 4, type: "sum", field: "worshipAtWellHeld", unit: "editions" },
      { key: "training", label: "Monthly worship training checkpoints", target: 12, type: "sum", field: "worshipMonthlyTraining", unit: "checkpoints" },
      { key: "services", label: "Worship services led or supported", target: null, type: "sum", field: "servicesLed", unit: "services" },
      { key: "rehearsals", label: "Rehearsals held", target: null, type: "sum", field: "rehearsalsHeld", unit: "rehearsals" },
      { key: "newParticipants", label: "New worship participants", target: null, type: "sum", field: "newWorshipParticipants", unit: "people" },
      { key: "communityGuests", label: "First-time community worship guests", target: null, type: "sum", field: "worshipCommunityGuests", unit: "guests" },
    ],
  },
  "young-adults": {
    title: "Young Adults", groupId: "group-young-adults",
    reviewField: "youngQuarterlyReviewed", actionField: "youngQuarterlyActions",
    metrics: [
      { key: "monthly", label: "Bible study & fellowship checkpoints", target: 12, type: "sum", field: "youngMonthlyTouchpoints", unit: "touchpoints" },
      { key: "quarterly", label: "Quarterly community connections", target: 4, type: "sum", field: "youngQuarterlyConnections", unit: "gatherings" },
      { key: "remnant", label: "Proposed Remnant Experience", target: 1, type: "yes", field: "youngFlagshipHeld", unit: "flagship" },
      { key: "attendance", label: "Average gathering attendance", target: null, type: "mean", field: "averageAttendance", unit: "attendees" },
      { key: "newMembers", label: "New young adults connected", target: null, type: "sum", field: "newYoungAdults", unit: "people" },
      { key: "mentored", label: "Young adults mentored", target: null, type: "sum", field: "youngMentored", unit: "mentoring engagements" },
      { key: "followUps", label: "New guest follow-ups", target: null, type: "sum", field: "youngGuestFollowUps", unit: "conversations" },
    ],
  },
  kids: {
    title: "Shanah Kids", groupId: "group-kids",
    reviewField: "kidsQuarterlyReviewed", actionField: "kidsQuarterlyActions",
    metrics: [
      { key: "monthly", label: "Monthly curriculum and volunteer checkpoints", target: 12, type: "yes", field: "kidsMonthlyCheckpoint", unit: "completed months" },
      { key: "services", label: "Sunday classroom services covered", target: null, type: "sum", field: "kidsServicesCovered", unit: "services" },
      { key: "children", label: "Average children served", target: null, type: "mean", field: "childrenServed", unit: "children" },
      { key: "families", label: "New families connected", target: null, type: "sum", field: "newFamilies", unit: "families" },
      { key: "trained", label: "Volunteers trained or mentored", target: null, type: "sum", field: "kidsVolunteersTrained", unit: "volunteers" },
      { key: "vbs", label: "June Vacation Bible School completed", target: 1, type: "yes", field: "kidsVbsHeld", unit: "annual VBS" },
      { key: "kidsSunday", label: "Kids Sunday Celebration completed", target: 1, type: "yes", field: "kidsSundayCelebrationHeld", unit: "Sunday finale" },
      { key: "vbsAttendance", label: "Aggregate VBS session attendance", target: null, type: "sum", field: "kidsVbsAggregateAttendance", unit: "session attendances" },
      { key: "vbsNewFamilies", label: "New families connected through VBS", target: null, type: "sum", field: "kidsVbsNewFamilies", unit: "families" },
      { key: "vbsVolunteers", label: "VBS volunteers who served", target: null, type: "sum", field: "kidsVbsVolunteers", unit: "volunteers" },
    ],
  },
};

function number(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function buildVisionMinistryScorecard(ministry: MinistryKey, all: MinistryLeaderReport[]): VisionMinistryScorecard {
  const config = VISION_SCORE_CONFIG[ministry];
  const valid = all.filter(r => r.groupId === config.groupId
    && /^2027-(0[1-9]|1[0-2])$/.test(r.reportMonth)
    && ["submitted", "reviewed"].includes(r.status)
    && Boolean(r.submittedAt))
    .sort((a, b) => a.reportMonth.localeCompare(b.reportMonth));
  // One accepted report per ministry per month. Drafts and returned reports cannot inflate progress.
  const reports = [...new Map(valid.map(r => [r.reportMonth, r])).values()];
  const metrics = config.metrics.map(metric => {
    const reported = reports.filter(r => r.responses[metric.field] != null && r.responses[metric.field] !== "");
    let actual: number | null = null;
    if (metric.type === "yes") {
      const validRows = reported.filter(r => ["Yes — completed", "No — not completed"].includes(String(r.responses[metric.field])));
      actual = validRows.length ? validRows.filter(r => r.responses[metric.field] === "Yes — completed").length : null;
    } else {
      const values = reported.map(r => number(r.responses[metric.field])).filter((n): n is number => n !== null);
      if (values.length) {
        const total = values.reduce((a, b) => a + b, 0);
        actual = metric.type === "mean" ? Math.round(total / values.length * 10) / 10 : total;
      }
    }
    return { key: metric.key, label: metric.label, target: metric.target, actual, unit: metric.unit };
  });
  const quarters: VisionQuarter[] = Array.from({ length: 4 }, (_, quarter) => {
    const rows = reports.filter(r => {
      const m = Number(r.reportMonth.slice(-2));
      return m >= quarter * 3 + 1 && m <= quarter * 3 + 3;
    });
    const accepted = rows.find(r => r.status === "reviewed"
      && r.responses[config.reviewField] === "Yes — completed"
      && String(r.responses[config.actionField] ?? "").trim());
    return { quarter: quarter + 1, reports: rows.length,
      reviewedReports: rows.filter(r => r.status === "reviewed").length,
      leadershipReview: Boolean(accepted),
      summary: accepted ? String(accepted.responses[config.actionField]) : null };
  });
  metrics.push({ key: "quarterlyReviews", label: "Quarterly pastoral reviews", target: 4,
    actual: reports.length ? quarters.filter(q => q.leadershipReview).length : null, unit: "reviews" });
  return { ministry, title: config.title, metrics, quarters, reportedMonths: reports.length };
}
