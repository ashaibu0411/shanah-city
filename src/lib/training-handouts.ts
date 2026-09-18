export type TrainingHandoutSlug =
  | "choir-worship-leader"
  | "finance-team"
  | "comms-team"
  | "kids-ministry-leader"
  | "frontliners-ushering"
  | "follow-up-guest-care"
  | "media-team"
  | "devotion-writers"
  | "senior-associate-pastor"
  | "admin-group"
  | "ministry-group-leader"
  | "assistant-group-leader"
  | "member-quick-reference";

export type TrainingHandout = {
  slug: TrainingHandoutSlug;
  file: string;
  title: string;
  description: string;
  /** Optional companion PDF (same folder as HTML handouts). */
  pdfFile?: string;
};

export const TRAINING_HANDOUTS: TrainingHandout[] = [
  {
    slug: "choir-worship-leader",
    file: "choir-worship-leader.html",
    pdfFile: "choir-worship-leader-guide.pdf",
    title: "Choir / Worship leader",
    description: "Full worship planner guide (PDF) with diagrams, setlists, My Part, monthly report",
  },
  {
    slug: "finance-team",
    file: "finance-team.html",
    title: "Finance team",
    description: "Weekly counts, giving records, thank-yous, monthly report",
  },
  {
    slug: "comms-team",
    file: "comms-team.html",
    title: "Comms team",
    description: "Comms calendar, ministry requests, promote to app",
  },
  {
    slug: "kids-ministry-leader",
    file: "kids-ministry-leader.html",
    title: "Kids ministry leader",
    description: "Check-in, lessons, pickup codes, incidents",
  },
  {
    slug: "frontliners-ushering",
    file: "frontliners-ushering.html",
    title: "FrontLiners & ushering",
    description: "Volunteer check-in, usher schedules, rosters",
  },
  {
    slug: "follow-up-guest-care",
    file: "follow-up-guest-care.html",
    title: "Follow-up / guest care",
    description: "Guest queue, 48-hour follow-up, status updates",
  },
  {
    slug: "media-team",
    file: "media-team.html",
    title: "Media team",
    description: "Photo upload, live stream, monthly report",
  },
  {
    slug: "devotion-writers",
    file: "devotion-writers.html",
    title: "Devotion writers (Team ZNCF)",
    description: "Draft, schedule, publish daily devotions",
  },
  {
    slug: "senior-associate-pastor",
    file: "senior-associate-pastor.html",
    title: "Senior / Associate pastor",
    description: "Overview dashboard, review leader reports",
  },
  {
    slug: "admin-group",
    file: "admin-group.html",
    title: "Admin group",
    description: "Full church operations portal",
  },
  {
    slug: "ministry-group-leader",
    file: "ministry-group-leader.html",
    title: "Ministry group leader",
    description: "Manage team, events, polls, monthly report",
  },
  {
    slug: "assistant-group-leader",
    file: "assistant-group-leader.html",
    title: "Assistant group leader",
    description: "What assistants can and cannot do",
  },
  {
    slug: "member-quick-reference",
    file: "member-quick-reference.html",
    title: "Member quick reference",
    description: "Share with your team — devotions, groups, give, check-in",
  },
];

const handoutBySlug = new Map(TRAINING_HANDOUTS.map((entry) => [entry.slug, entry]));

export function getTrainingHandoutBySlug(slug: string): TrainingHandout | undefined {
  return handoutBySlug.get(slug as TrainingHandoutSlug);
}

export function trainingHandoutAppPath(slug: TrainingHandoutSlug) {
  return `/training/handout/${slug}`;
}

export function trainingHandoutStaticPath(handout: Pick<TrainingHandout, "file">) {
  return `/training/${handout.file}`;
}
