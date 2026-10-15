import type { MarriageProgramTrackEntry, MarriageProgramType } from "@/lib/marriage-counseling-types";

const PREMARITAL_ORDER: MarriageProgramTrackEntry[] = [
  ...[
    "mod-01-knowing-yourself",
    "mod-02-family-background",
    "mod-03-communication",
    "mod-04-money",
    "mod-05-intimacy",
    "mod-06-faith",
    "mod-07-roles",
    "mod-08-children",
    "mod-09-trust",
    "mod-10-emotional-health",
    "mod-11-vision",
    "mod-12-readiness",
  ].map((moduleId) => ({ moduleId, required: true })),
  { moduleId: "mod-13-forgiveness", required: false },
  { moduleId: "mod-14-in-laws", required: false },
  { moduleId: "mod-18-culture", required: false },
  { moduleId: "mod-19-covenant", required: false },
];

const ENRICHMENT_ORDER: MarriageProgramTrackEntry[] = [
  { moduleId: "mod-03-communication", required: true },
  { moduleId: "mod-04-money", required: true },
  { moduleId: "mod-06-faith", required: true },
  { moduleId: "mod-07-roles", required: true },
  { moduleId: "mod-10-emotional-health", required: true },
  { moduleId: "mod-11-vision", required: true },
  { moduleId: "mod-13-forgiveness", required: false },
  { moduleId: "mod-15-work", required: false },
  { moduleId: "mod-17-grief", required: false },
  { moduleId: "mod-20-celebration", required: false },
];

export const DEFAULT_PROGRAM_TRACKS: Record<MarriageProgramType, MarriageProgramTrackEntry[]> = {
  premarital: PREMARITAL_ORDER,
  enrichment: ENRICHMENT_ORDER,
  guided: [],
};
