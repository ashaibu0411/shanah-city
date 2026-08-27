import { ADMIN_GROUP_ID, CHURCH_MINISTRY_GROUPS, TEAM_ZNCF_GROUP_ID } from "@/lib/church-groups";
import { isMediaGroup } from "@/lib/media-group";
import type { GroupCategory } from "@/lib/group-types";

import type { MinistryReportPrefillOption } from "@/lib/ministry-report-scenarios";
import { enrichReportQuestions } from "@/lib/ministry-report-scenarios";

export type MinistryReportStatus = "draft" | "submitted" | "reviewed" | "returned";

export type MinistryReportQuestionType = "text" | "textarea" | "number" | "select" | "rating";

export type MinistryReportQuestion = {
  id: string;
  label: string;
  hint?: string;
  type: MinistryReportQuestionType;
  required?: boolean;
  options?: string[];
  prefillOptions?: MinistryReportPrefillOption[];
  numberPresets?: number[];
  min?: number;
  max?: number;
};

export type MinistryReportTemplate = {
  key: string;
  title: string;
  expectations: string[];
  questions: MinistryReportQuestion[];
};

export type MinistryReportResponses = Record<string, string | number>;

export type MinistryLeaderReport = {
  id: string;
  reportMonth: string;
  groupId: string;
  groupName: string;
  templateKey: string;
  responses: MinistryReportResponses;
  leaderNotes?: string;
  status: MinistryReportStatus;
  submittedAt?: string;
  submittedBy?: string;
  submittedByName?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewerNotes?: string;
  actionSteps?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type MinistryReportSummary = {
  reportMonth: string;
  total: number;
  submitted: number;
  reviewed: number;
  missing: number;
  groups: Array<{
    groupId: string;
    groupName: string;
    status: MinistryReportStatus | "missing";
    submittedAt?: string;
    submittedByName?: string;
  }>;
};

export const MINISTRY_REPORT_EXCLUDED_GROUP_IDS = new Set([
  ADMIN_GROUP_ID,
  "group-pastors",
  TEAM_ZNCF_GROUP_ID,
  "group-leaders",
  "group-team-lead",
]);

const REPORTABLE_CATEGORY: GroupCategory[] = ["ministry", "choir", "youth", "small-group", "other"];

/** Groups that use FrontLiners scheduling but not monthly leader reports. */
export const MINISTRY_REPORT_SKIPPED_GROUP_IDS = new Set(["group-frontliners"]);

const TEAM_SHEPHERDING_QUESTIONS: MinistryReportQuestion[] = [
  {
    id: "absentMembers",
    label: "Team members absent from church or showing struggle",
    hint: "Who has been inconsistent? Any pastoral, family, or health concerns?",
    type: "textarea",
    required: true,
  },
  {
    id: "absentFollowUp",
    label: "Follow-up you did for absent or struggling members",
    hint: "Calls, texts, visits, or conversations — and the outcome.",
    type: "textarea",
    required: true,
  },
  {
    id: "newMembersCount",
    label: "New members who joined your team this month",
    type: "number",
    min: 0,
    required: true,
  },
  {
    id: "newMembers",
    label: "New members — names and how you onboarded them",
    type: "textarea",
  },
  {
    id: "membersSatOrLeft",
    label: "Members asked to sit, rotated off, or who left the team",
    hint: "Who, why, what happened, and any follow-up still needed.",
    type: "textarea",
    required: true,
  },
  {
    id: "teamActivitiesCount",
    label: "Team touchpoints for growth, unity, and love",
    hint: "Meetings, prayer, training, fellowship, or outings.",
    type: "number",
    required: true,
    min: 0,
  },
  {
    id: "teamActivities",
    label: "Describe those team activities (or why none were held)",
    type: "textarea",
    required: true,
  },
  {
    id: "shepherdingGaps",
    label: "If you did not follow up, build unity, or shepherd your team — why?",
    hint: "Time, volunteers, clarity, conflict, or support you need from leadership.",
    type: "textarea",
  },
];

const COMMON_QUESTIONS: MinistryReportQuestion[] = [
  {
    id: "ministryHealth",
    label: "Overall ministry health (1 = struggling, 5 = thriving)",
    type: "rating",
    required: true,
    min: 1,
    max: 5,
  },
  {
    id: "activeVolunteers",
    label: "How many active volunteers served this month?",
    type: "number",
    required: true,
    min: 0,
  },
  {
    id: "attendanceEngagement",
    label: "Attendance & engagement trends",
    hint: "Who showed up consistently? Anyone drifting away?",
    type: "textarea",
    required: true,
  },
  {
    id: "wins",
    label: "Top wins this month",
    hint: "Celebrate progress — souls, service, teamwork, or growth.",
    type: "textarea",
    required: true,
  },
  {
    id: "challenges",
    label: "Challenges or roadblocks",
    type: "textarea",
    required: true,
  },
  {
    id: "prayerNeeds",
    label: "Prayer needs for your team",
    type: "textarea",
  },
  {
    id: "resourceNeeds",
    label: "Resources needed",
    hint: "Equipment, budget, space, training, or extra hands.",
    type: "textarea",
  },
  {
    id: "upcomingEvents",
    label: "Plans for next month",
    type: "textarea",
    required: true,
  },
  {
    id: "leaderHealth",
    label: "How are you doing as a leader?",
    hint: "Burnout, encouragement, time with God, support you need.",
    type: "textarea",
    required: true,
  },
];

const COMMON_EXPECTATIONS = [
  "Submit by the 5th of each month for the prior month.",
  "Know your people — track attendance, concerns, and celebrations.",
  "Follow up with absent members within a week.",
  "Document team changes (new members, transitions, or releases).",
  "Be honest about gaps — the goal is support, not shame.",
  "Name specific people or dates when possible.",
  "Flag urgent needs in challenges or resource fields.",
];

function template(
  key: string,
  title: string,
  expectations: string[],
  extraQuestions: MinistryReportQuestion[],
): MinistryReportTemplate {
  return {
    key,
    title,
    expectations: [...expectations, ...COMMON_EXPECTATIONS],
    questions: [...extraQuestions, ...TEAM_SHEPHERDING_QUESTIONS, ...COMMON_QUESTIONS],
  };
}

export const MINISTRY_REPORT_TEMPLATES: Record<string, MinistryReportTemplate> = {
  default: template("default", "Ministry Leader Report", ["Lead with clarity and shepherd your volunteers well."], []),
  choir: template(
    "choir",
    "Worship & Choir Report",
    [
      "Prepare worship that ushers people into God's presence.",
      "Communicate setlists and rehearsals at least one week ahead.",
      "Ensure every service has sound, slides, and musicians covered.",
    ],
    [
      {
        id: "servicesLed",
        label: "Worship services you led or supported",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "rehearsalsHeld",
        label: "Rehearsals or team meetings held",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "rehearsalAttendance",
        label: "Rehearsal attendance & punctuality",
        type: "textarea",
        required: true,
      },
      {
        id: "musicianNeeds",
        label: "Musicians, vocalists, or tech gaps",
        type: "textarea",
      },
    ],
  ),
  kids: template(
    "kids",
    "Kids Ministry Report",
    [
      "Every child checked in safely and returned to the right parent.",
      "Lesson materials ready before Sunday.",
      "Volunteers briefed on safety and classroom flow.",
    ],
    [
      {
        id: "childrenServed",
        label: "Average children per service/week",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "newFamilies",
        label: "New families in kids ministry this month",
        type: "number",
        min: 0,
      },
      {
        id: "curriculumProgress",
        label: "Curriculum & lesson readiness",
        type: "textarea",
        required: true,
      },
      {
        id: "safetyConcerns",
        label: "Safety, check-in, or classroom concerns",
        type: "textarea",
      },
      {
        id: "volunteerGaps",
        label: "Volunteer scheduling gaps",
        type: "textarea",
      },
    ],
  ),
  teens: template(
    "teens",
    "Teens Ministry Report",
    [
      "Create a safe space for teens to encounter Jesus.",
      "Follow up with absent students within the week.",
      "Coordinate with parents on major events.",
    ],
    [
      {
        id: "youthAttendance",
        label: "Average teen attendance per gathering",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "newYouth",
        label: "New teens who connected this month",
        type: "number",
        min: 0,
      },
      {
        id: "discipleshipMoments",
        label: "Discipleship highlights & conversations",
        type: "textarea",
        required: true,
      },
      {
        id: "parentEngagement",
        label: "Parent communication & engagement",
        type: "textarea",
      },
    ],
  ),
  youngAdults: template(
    "youngAdults",
    "Young Adults Ministry Report",
    [
      "Build a community where young adults grow in Christ and belong.",
      "Follow up with absent members and invite them back personally.",
      "Plan regular fellowship that fosters accountability and joy.",
    ],
    [
      {
        id: "gatheringsHeld",
        label: "Young adult gatherings or Bible studies held",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "averageAttendance",
        label: "Average attendance per gathering",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "newYoungAdults",
        label: "New young adults who connected this month",
        type: "number",
        min: 0,
      },
      {
        id: "discipleshipHighlights",
        label: "Discipleship, mentorship, and life-on-life moments",
        type: "textarea",
        required: true,
      },
      {
        id: "communityOutreach",
        label: "Outreach, invites, or social fellowship planned",
        type: "textarea",
      },
    ],
  ),
  ushering: template(
    "ushering",
    "Ushering Ministry Report",
    [
      "Every service staffed with trained ushers and greeters before doors open.",
      "Guests welcomed warmly and seated with care.",
      "Offering, communion, and emergency flow communicated to your team.",
    ],
    [
      {
        id: "servicesCovered",
        label: "Services with full ushering coverage",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "ushersOnRotation",
        label: "Active ushers on rotation",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "guestWelcomeHighlights",
        label: "Guest welcome highlights or concerns",
        type: "textarea",
        required: true,
      },
      {
        id: "trainingNeeds",
        label: "Training, uniforms, or scheduling needs",
        type: "textarea",
      },
    ],
  ),
  ladies: template(
    "ladies",
    "Women's Ministry Report",
    [
      "Foster authentic fellowship and discipleship among women.",
      "Plan at least one touchpoint (meeting, call, or outreach) per month.",
    ],
    [
      {
        id: "meetingsHeld",
        label: "Meetings, circles, or events held",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "membersEngaged",
        label: "Women actively engaged this month",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "discipleshipHighlights",
        label: "Discipleship & fellowship highlights",
        type: "textarea",
        required: true,
      },
      {
        id: "outreachPlans",
        label: "Outreach or invite opportunities",
        type: "textarea",
      },
    ],
  ),
  men: template(
    "men",
    "Men's Ministry Report",
    [
      "Build men who lead their homes and serve the church.",
      "Hold accountable, consistent gatherings.",
    ],
    [
      {
        id: "meetingsHeld",
        label: "Meetings or brotherhood gatherings held",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "membersEngaged",
        label: "Men actively engaged this month",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "discipleshipHighlights",
        label: "Discipleship & accountability highlights",
        type: "textarea",
        required: true,
      },
      {
        id: "outreachPlans",
        label: "Outreach or invite opportunities",
        type: "textarea",
      },
    ],
  ),
  followUp: template(
    "followUp",
    "Follow-Up & Care Report",
    [
      "Contact every new guest within 48 hours.",
      "Log outcomes so pastoral care can follow through.",
      "Escalate urgent pastoral needs immediately.",
    ],
    [
      {
        id: "membersCalled",
        label: "Members you called or checked on",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "guestsContacted",
        label: "First-time guests contacted",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "returnVisitors",
        label: "Guests who returned after follow-up",
        type: "number",
        min: 0,
      },
      {
        id: "followUpFeedback",
        label: "Feedback from calls & visits",
        hint: "Prayer requests, concerns, testimonies, or referrals.",
        type: "textarea",
        required: true,
      },
      {
        id: "unreachableList",
        label: "People not yet reached",
        type: "textarea",
      },
      {
        id: "pastoralEscalations",
        label: "Needs requiring pastoral attention",
        type: "textarea",
        required: true,
      },
    ],
  ),
  prayer: template(
    "prayer",
    "Prayer Ministry Report",
    [
      "Cover church services, leaders, and prayer requests faithfully.",
      "Protect confidentiality of shared requests.",
    ],
    [
      {
        id: "prayerMeetingsHeld",
        label: "Prayer meetings or shifts covered",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "prayerRequestsHandled",
        label: "Prayer requests received & prayed over",
        type: "number",
        min: 0,
      },
      {
        id: "intercessorsActive",
        label: "Active intercessors this month",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "breakthroughs",
        label: "Testimonies or breakthroughs",
        type: "textarea",
      },
    ],
  ),
  finance: template(
    "finance",
    "Finance Team Report",
    [
      "Weekly offering counts submitted by Monday after service.",
      "Reconcile cash, checks, and digital giving accurately.",
    ],
    [
      {
        id: "weeksRecorded",
        label: "Weekly count sheets submitted on time",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "discrepancies",
        label: "Discrepancies or corrections this month",
        type: "textarea",
      },
      {
        id: "givingTrends",
        label: "Giving trends or observations",
        type: "textarea",
      },
    ],
  ),
  media: template(
    "media",
    "Media Team Report",
    [
      "Every service live-streamed or recorded with clear audio.",
      "Slides, lyrics, and camera angles prepared before rehearsal.",
      "Archive photos and sermon media within one week.",
    ],
    [
      {
        id: "servicesCovered",
        label: "Services covered (live, slides, or stream)",
        type: "number",
        required: true,
        min: 0,
      },
      {
        id: "contentPublished",
        label: "Photos, clips, or posts published",
        type: "number",
        min: 0,
      },
      {
        id: "streamQuality",
        label: "Stream & presentation quality",
        type: "select",
        required: true,
        options: ["Excellent", "Good", "Needs improvement", "Major issues"],
      },
      {
        id: "equipmentIssues",
        label: "Equipment or software issues",
        type: "textarea",
      },
      {
        id: "volunteerTraining",
        label: "Volunteer training & handoffs",
        type: "textarea",
      },
    ],
  ),
};

const GROUP_TEMPLATE_MAP: Record<string, keyof typeof MINISTRY_REPORT_TEMPLATES> = {
  "group-choir": "choir",
  "group-kids": "kids",
  "group-teens": "teens",
  "group-young-adults": "youngAdults",
  "group-ushering": "ushering",
  "group-shanah-ladies": "ladies",
  "group-men-legacy": "men",
  "group-prayer": "prayer",
  "group-finance": "finance",
};

export function currentReportMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function previousReportMonth(date = new Date()) {
  const copy = new Date(date);
  copy.setDate(1);
  copy.setMonth(copy.getMonth() - 1);
  return currentReportMonth(copy);
}

export function formatReportMonth(reportMonth: string) {
  const [year, month] = reportMonth.split("-").map(Number);
  if (!year || !month) return reportMonth;
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function isReportableMinistryGroup(group: {
  id: string;
  name: string;
  category: GroupCategory;
}) {
  if (MINISTRY_REPORT_EXCLUDED_GROUP_IDS.has(group.id)) {
    return false;
  }
  if (MINISTRY_REPORT_SKIPPED_GROUP_IDS.has(group.id)) {
    return false;
  }
  if (isMediaGroup(group)) {
    return true;
  }
  if (CHURCH_MINISTRY_GROUPS.some((seed) => seed.id === group.id)) {
    return group.id !== ADMIN_GROUP_ID;
  }
  if (/follow[\s-]?up/i.test(group.name)) {
    return true;
  }
  if (/usher/i.test(group.name)) {
    return true;
  }
  return REPORTABLE_CATEGORY.includes(group.category);
}

export function resolveReportTemplateKey(group: { id: string; name: string }) {
  if (isMediaGroup(group)) {
    return "media";
  }
  if (/follow[\s-]?up/i.test(group.name)) {
    return "followUp";
  }
  if (/usher/i.test(group.name)) {
    return "ushering";
  }
  if (/young adult/i.test(group.name)) {
    return "youngAdults";
  }
  return GROUP_TEMPLATE_MAP[group.id] ?? "default";
}

export function getReportTemplateForGroup(group: { id: string; name: string }) {
  const key = resolveReportTemplateKey(group);
  const template = MINISTRY_REPORT_TEMPLATES[key] ?? MINISTRY_REPORT_TEMPLATES.default;
  return {
    ...template,
    questions: enrichReportQuestions(template.questions),
  };
}

export function emptyResponsesForTemplate(template: MinistryReportTemplate): MinistryReportResponses {
  const responses: MinistryReportResponses = {};
  for (const question of template.questions) {
    if (question.type === "number" || question.type === "rating") {
      responses[question.id] = "";
    } else {
      responses[question.id] = "";
    }
  }
  return responses;
}

export function validateReportResponses(
  template: MinistryReportTemplate,
  responses: MinistryReportResponses,
) {
  const missing: string[] = [];

  for (const question of template.questions) {
    if (!question.required) continue;
    const value = responses[question.id];
    if (value === undefined || value === "" || value === null) {
      missing.push(question.label);
      continue;
    }
    if (question.type === "number" || question.type === "rating") {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        missing.push(question.label);
        continue;
      }
      if (question.min !== undefined && numeric < question.min) {
        missing.push(question.label);
      }
      if (question.max !== undefined && numeric > question.max) {
        missing.push(question.label);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(`Please complete required fields: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}`);
  }
}

export function mergeResponses(
  template: MinistryReportTemplate,
  responses: MinistryReportResponses,
): MinistryReportResponses {
  const merged = emptyResponsesForTemplate(template);
  for (const question of template.questions) {
    const value = responses[question.id];
    if (value === undefined || value === "") continue;
    if (question.type === "number" || question.type === "rating") {
      const numeric = Number(value);
      merged[question.id] = Number.isFinite(numeric) ? numeric : "";
    } else {
      merged[question.id] = String(value);
    }
  }
  return merged;
}
