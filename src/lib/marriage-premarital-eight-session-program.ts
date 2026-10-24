import { WEEK_1_HOMEWORK_TEMPLATE_KEY } from "@/lib/marriage-homework-templates";
import { PREMARITAL_SESSION_TEACHING_GUIDES } from "@/lib/marriage-premarital-session-guides";

export type PremaritalProgramSessionStatus = "not_started" | "in_progress" | "completed";

export type PremaritalProgramModuleLink = {
  moduleId: string;
  /** When false, couple sees as recommended enrichment — not required for session completion. */
  recommendedForSession: boolean;
};

export type PremaritalProgramSessionDefinition = {
  sessionKey: string;
  order: number;
  title: string;
  purpose: string;
  recommendedMinutesMin: number;
  recommendedMinutesMax: number;
  scriptures: Array<{ reference: string; text: string }>;
  teachingSections: Array<{ heading: string; paragraphs: string[] }>;
  discussionQuestions: string[];
  reflectionPrompts: string[];
  linkedModules: PremaritalProgramModuleLink[];
  homeworkTemplateKeys: string[];
  completionChecklist: string[];
};

export const PREMARITAL_EIGHT_SESSION_PROGRAM_KEY = "premarital-eight-session-v1";

export const PREMARITAL_PROGRAM_SESSIONS: PremaritalProgramSessionDefinition[] = [
  {
    sessionKey: "session-1-foundations",
    order: 1,
    title: "Foundations of Marriage",
    purpose:
      "Establish a shared biblical vision for marriage as covenant, not contract — and clarify why you are preparing before God and one another.",
    recommendedMinutesMin: 75,
    recommendedMinutesMax: 90,
    scriptures: [
      {
        reference: "Genesis 2:24",
        text: "Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh.",
      },
      {
        reference: "Ephesians 5:31–32",
        text: "Therefore a man shall leave his father and mother and hold fast to his wife, and the two shall become one flesh. This mystery is profound, and I am saying that it refers to Christ and the church.",
      },
      {
        reference: "Malachi 2:14",
        text: "The Lord was witness between you and the wife of your youth, to whom you have been faithless, though she is your companion and your wife by covenant.",
      },
    ],
    ...PREMARITAL_SESSION_TEACHING_GUIDES["session-1-foundations"],
    linkedModules: [
      { moduleId: "mod-06-faith", recommendedForSession: true },
      { moduleId: "mod-19-covenant", recommendedForSession: false },
    ],
    homeworkTemplateKeys: [],
    completionChecklist: [
      "Opened in prayer and named one hope for this counseling journey",
      "Couple articulated marriage as covenant in their own words",
      "Discussed role of church community and accountability",
      "Agreed on next session focus and any assessments to complete",
    ],
  },
  {
    sessionKey: "session-2-knowing-yourself",
    order: 2,
    title: "Knowing Yourself and Your Background",
    purpose:
      "Help each partner understand personal story, temperament, and family-of-origin patterns that will shape married life.",
    recommendedMinutesMin: 75,
    recommendedMinutesMax: 90,
    scriptures: [
      {
        reference: "Psalm 139:13–14",
        text: "For you formed my inward parts; you knitted me together in my mother's womb. I praise you, for I am fearfully and wonderfully made.",
      },
      {
        reference: "Galatians 6:5",
        text: "For each will have to bear his own load.",
      },
    ],
    ...PREMARITAL_SESSION_TEACHING_GUIDES["session-2-knowing-yourself"],
    linkedModules: [
      { moduleId: "mod-01-knowing-yourself", recommendedForSession: true },
      { moduleId: "mod-02-family-background", recommendedForSession: true },
      { moduleId: "mod-10-emotional-health", recommendedForSession: true },
    ],
    homeworkTemplateKeys: [WEEK_1_HOMEWORK_TEMPLATE_KEY],
    completionChecklist: [
      "Each partner shared one formative story from childhood or adolescence",
      "Named one strength and one growth area from family background",
      "Reviewed assessment progress for Knowing Yourself modules",
      "Released or reviewed Week 1 homework if appropriate",
    ],
  },
  {
    sessionKey: "session-3-communication",
    order: 3,
    title: "Communication and Conflict",
    purpose:
      "Build habits of listening, repair, and Christ-honoring conflict before pressure rises in marriage.",
    recommendedMinutesMin: 75,
    recommendedMinutesMax: 90,
    scriptures: [
      {
        reference: "James 1:19",
        text: "Let every person be quick to hear, slow to speak, slow to anger.",
      },
      {
        reference: "Ephesians 4:15",
        text: "Speaking the truth in love, we are to grow up in every way into him who is the head, into Christ.",
      },
    ],
    ...PREMARITAL_SESSION_TEACHING_GUIDES["session-3-communication"],
    linkedModules: [
      { moduleId: "mod-03-communication", recommendedForSession: true },
      { moduleId: "mod-13-forgiveness", recommendedForSession: false },
    ],
    homeworkTemplateKeys: [],
    completionChecklist: [
      "Practiced a listening exercise (repeat-back) on a low-stakes topic",
      "Identified one unhealthy conflict pattern to watch for",
      "Named a repair step each partner can offer after tension",
      "Linked communication module assessments to session notes",
    ],
  },
  {
    sessionKey: "session-4-money",
    order: 4,
    title: "Money and Financial Stewardship",
    purpose:
      "Align on stewardship, transparency, debt, giving, and decision-making before shared accounts and major purchases.",
    recommendedMinutesMin: 75,
    recommendedMinutesMax: 90,
    scriptures: [
      {
        reference: "Proverbs 3:9–10",
        text: "Honor the Lord with your wealth and with the firstfruits of all your produce.",
      },
      {
        reference: "Luke 16:10",
        text: "One who is faithful in a very little is also faithful in much.",
      },
    ],
    ...PREMARITAL_SESSION_TEACHING_GUIDES["session-4-money"],
    linkedModules: [{ moduleId: "mod-04-money", recommendedForSession: true }],
    homeworkTemplateKeys: [],
    completionChecklist: [
      "Discussed current income, debt, and giving patterns at a high level",
      "Agreed on transparency norms (what must always be shared)",
      "Identified one financial goal for the first year of marriage",
      "Reviewed money module assessment together as allowed by consent",
    ],
  },
  {
    sessionKey: "session-5-family-boundaries",
    order: 5,
    title: "Family, Boundaries and In-Laws",
    purpose:
      "Honor parents while cleaving to spouse; plan for children, roles, and extended family with clear boundaries.",
    recommendedMinutesMin: 75,
    recommendedMinutesMax: 90,
    scriptures: [
      {
        reference: "Genesis 2:24",
        text: "A man shall leave his father and his mother and hold fast to his wife.",
      },
      {
        reference: "Ephesians 6:1–4",
        text: "Children, obey your parents in the Lord… Fathers, do not provoke your children to anger, but bring them up in the discipline and instruction of the Lord.",
      },
    ],
    ...PREMARITAL_SESSION_TEACHING_GUIDES["session-5-family-boundaries"],
    linkedModules: [
      { moduleId: "mod-07-roles", recommendedForSession: true },
      { moduleId: "mod-08-children", recommendedForSession: true },
      { moduleId: "mod-14-in-laws", recommendedForSession: false },
    ],
    homeworkTemplateKeys: [],
    completionChecklist: [
      "Discussed expectations for holidays and family visits",
      "Named one boundary each partner needs with extended family",
      "Aligned on timeline or openness regarding children if applicable",
      "Reviewed roles and children module responses as consented",
    ],
  },
  {
    sessionKey: "session-6-intimacy-trust",
    order: 6,
    title: "Intimacy, Trust and Commitment",
    purpose:
      "Address emotional and physical intimacy, purity, trust, and safety with pastoral clarity and discretion.",
    recommendedMinutesMin: 75,
    recommendedMinutesMax: 90,
    scriptures: [
      {
        reference: "1 Corinthians 7:3–5",
        text: "The husband should give to his wife her conjugal rights, and likewise the wife to her husband.",
      },
      {
        reference: "Song of Solomon 8:6–7",
        text: "Set me as a seal upon your heart… for love is strong as death.",
      },
    ],
    ...PREMARITAL_SESSION_TEACHING_GUIDES["session-6-intimacy-trust"],
    linkedModules: [
      { moduleId: "mod-05-intimacy", recommendedForSession: true },
      { moduleId: "mod-09-trust", recommendedForSession: true },
    ],
    homeworkTemplateKeys: [],
    completionChecklist: [
      "Discussed expectations for emotional and physical intimacy in marriage",
      "Addressed trust, honesty, and any needed accountability",
      "Confirmed both partners feel safe to raise concerns with counselor",
      "Reviewed intimacy and trust assessments within consent boundaries",
    ],
  },
  {
    sessionKey: "session-7-faith-purpose",
    order: 7,
    title: "Faith, Purpose and Building a Home",
    purpose:
      "Unite around shared mission, spiritual rhythms, work/rest, and the kind of home you will build together.",
    recommendedMinutesMin: 75,
    recommendedMinutesMax: 90,
    scriptures: [
      {
        reference: "Joshua 24:15",
        text: "As for me and my house, we will serve the Lord.",
      },
      {
        reference: "Colossians 3:23–24",
        text: "Whatever you do, work heartily, as for the Lord and not for men.",
      },
    ],
    ...PREMARITAL_SESSION_TEACHING_GUIDES["session-7-faith-purpose"],
    linkedModules: [
      { moduleId: "mod-11-vision", recommendedForSession: true },
      { moduleId: "mod-18-culture", recommendedForSession: false },
      { moduleId: "mod-15-work", recommendedForSession: false },
    ],
    homeworkTemplateKeys: [],
    completionChecklist: [
      "Named shared spiritual practices for the first year of marriage",
      "Discussed vocation, rest, and household rhythms",
      "Aligned on a one-sentence vision for your home",
      "Reviewed vision module and optional culture/work modules",
    ],
  },
  {
    sessionKey: "session-8-readiness-review",
    order: 8,
    title: "Marriage Readiness and Final Review",
    purpose:
      "Synthesize learning, name remaining growth areas, bless the couple, and confirm readiness — without rushing unresolved serious concerns.",
    recommendedMinutesMin: 75,
    recommendedMinutesMax: 90,
    scriptures: [
      {
        reference: "Ecclesiastes 4:12",
        text: "A threefold cord is not quickly broken.",
      },
      {
        reference: "Philippians 1:6",
        text: "He who began a good work in you will bring it to completion at the day of Jesus Christ.",
      },
    ],
    ...PREMARITAL_SESSION_TEACHING_GUIDES["session-8-readiness-review"],
    linkedModules: [
      { moduleId: "mod-12-readiness", recommendedForSession: true },
      { moduleId: "mod-16-addiction", recommendedForSession: false },
      { moduleId: "mod-17-grief", recommendedForSession: false },
      { moduleId: "mod-20-celebration", recommendedForSession: false },
    ],
    homeworkTemplateKeys: [],
    completionChecklist: [
      "Reviewed outstanding assessments and homework",
      "Named top three strengths of the relationship",
      "Named one or two areas for continued growth after the wedding",
      "Pastoral blessing and plan for post-wedding follow-up if needed",
    ],
  },
];

export function getPremaritalSessionDefinition(sessionKey: string) {
  return PREMARITAL_PROGRAM_SESSIONS.find((s) => s.sessionKey === sessionKey) ?? null;
}

export function allPremaritalModuleIdsInProgram(): string[] {
  const ids = new Set<string>();
  for (const session of PREMARITAL_PROGRAM_SESSIONS) {
    for (const link of session.linkedModules) ids.add(link.moduleId);
  }
  return [...ids];
}
