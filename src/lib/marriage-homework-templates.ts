import type { MarriageHomeworkActivityDef, MarriageHomeworkTemplateSummary } from "@/lib/marriage-homework-types";
import { enrichHomeworkActivities } from "@/lib/marriage-homework-written-guidance";
import { PREMARITAL_HOMEWORK_TEMPLATE_META } from "@/lib/marriage-homework-template-meta";
import {
  PREMARITAL_AFTER_S2_ACTIVITIES,
  PREMARITAL_AFTER_S3_ACTIVITIES,
  PREMARITAL_AFTER_S4_ACTIVITIES,
  PREMARITAL_AFTER_S5_ACTIVITIES,
  PREMARITAL_AFTER_S6_ACTIVITIES,
  PREMARITAL_AFTER_S7_ACTIVITIES,
  PREMARITAL_AFTER_S8_ACTIVITIES,
} from "@/lib/marriage-premarital-homework-template-bodies";

export const WEEK_1_HOMEWORK_TEMPLATE_KEY = "week-1-knowing-yourself";

const WEEK_1_ACTIVITIES: MarriageHomeworkActivityDef[] = enrichHomeworkActivities([
  {
    id: "activity-a",
    kind: "individual_writing",
    title: "Activity A — Personal reflection",
    instructions:
      "Answer honestly and thoughtfully. You do not need to finish everything in one sitting. Your partner cannot see your private answers.",
    questions: [
      {
        id: "a1",
        prompt:
          "What are three strengths you believe you will bring into this marriage? Explain each briefly.",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "a2",
        prompt:
          "What are two habits, weaknesses, or personal attitudes you believe you need to work on before marriage?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "a3",
        prompt:
          "What did you learn about marriage from the home where you grew up? What would you like to carry forward, and what would you like to do differently?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "a4",
        prompt:
          "When you feel hurt, disappointed, angry, or misunderstood, how do you usually respond? Give an example if you feel comfortable.",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "a5",
        prompt:
          "What kind of husband or wife do you want to become over the next five years? Describe the character, habits, and values you want to develop.",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "activity-b",
    kind: "joint_discussion",
    title: "Activity B — Our future home",
    instructions:
      "Set aside 30 uninterrupted minutes together. Discuss the prompt below, then each answer the reflection questions independently.",
    discussionPrompt:
      "What kind of home do we want to build, and what should people experience when they enter our home?",
    questions: [
      {
        id: "b1",
        prompt: "What three values should define our home?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "b2",
        prompt: "What did I learn about my partner's expectations?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "b3",
        prompt: "What is one practical step we can take toward that vision?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "activity-c",
    kind: "scripture_reflection",
    title: "Activity C — Scripture reflection",
    instructions: "Read the passages below, then answer in your own words.",
    scriptureRefs: ["Genesis 2:18–25", "Proverbs 24:3–4"],
    questions: [
      {
        id: "c1",
        prompt: "What does becoming one mean to you beyond the wedding ceremony?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "c2",
        prompt: "What is one principle from these Scriptures that you want to practice in your marriage?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "c3",
        prompt: "What area of your relationship needs more wisdom or understanding?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "activity-d",
    kind: "curriculum_link",
    title: "Activity D — Curriculum",
    instructions:
      "Complete the linked learning modules in Marriage Prep. Your module answers are saved separately — you do not re-enter them here.",
    moduleIds: ["mod-01-knowing-yourself"],
    optionalModuleIds: ["mod-02-family-background"],
    questions: [],
  },
]);

export const MARRIAGE_HOMEWORK_TEMPLATES: Record<
  string,
  { title: string; description: string; activities: MarriageHomeworkActivityDef[] }
> = {
  [WEEK_1_HOMEWORK_TEMPLATE_KEY]: {
    title: "After Session 1 — Knowing yourself before Session 2",
    description:
      "Assigned after your Session 1 meeting (Foundations of Marriage). Complete before Session 2 (Knowing Yourself and Your Background). Estimated time: about 90 minutes, in more than one sitting if needed. Private answers stay private; your partner cannot see your individual reflections.",
    activities: WEEK_1_ACTIVITIES,
  },
  "premarital-after-s2-communication": {
    title: "After Session 2 — Communication practice before Session 3",
    description:
      "Assigned after Session 2. Complete before Session 3 (Communication and Conflict). Estimated time: about 75 minutes. Practice listening and name your conflict habits without blaming.",
    activities: PREMARITAL_AFTER_S2_ACTIVITIES,
  },
  "premarital-after-s3-money": {
    title: "After Session 3 — Money and stewardship before Session 4",
    description:
      "Assigned after Session 3. Complete before Session 4 (Money and Financial Stewardship). Estimated time: about 70 minutes. Be transparent about patterns; this is not legal or tax advice.",
    activities: PREMARITAL_AFTER_S3_ACTIVITIES,
  },
  "premarital-after-s4-family": {
    title: "After Session 4 — Family and boundaries before Session 5",
    description:
      "Assigned after Session 4. Complete before Session 5 (Family, Boundaries and In-Laws). Estimated time: about 80 minutes. Honor different family backgrounds without shame.",
    activities: PREMARITAL_AFTER_S4_ACTIVITIES,
  },
  "premarital-after-s5-intimacy-trust": {
    title: "After Session 5 — Intimacy and trust before Session 6",
    description:
      "Assigned after Session 5. Complete before Session 6 (Intimacy, Trust and Commitment). Estimated time: about 75 minutes. Sensitive topics may be discussed privately with your counselor.",
    activities: PREMARITAL_AFTER_S5_ACTIVITIES,
  },
  "premarital-after-s6-faith-home": {
    title: "After Session 6 — Faith and home vision before Session 7",
    description:
      "Assigned after Session 6. Complete before Session 7 (Faith, Purpose and Building a Home). Estimated time: about 75 minutes.",
    activities: PREMARITAL_AFTER_S6_ACTIVITIES,
  },
  "premarital-after-s7-readiness-prep": {
    title: "After Session 7 — Readiness check before Session 8",
    description:
      "Assigned after Session 7. Complete before Session 8 (Marriage Readiness and Final Review). Estimated time: about 60 minutes. Honesty helps your pastor bless you well.",
    activities: PREMARITAL_AFTER_S7_ACTIVITIES,
  },
  "premarital-after-s8-sendoff": {
    title: "After Session 8 — First month of marriage",
    description:
      "Assigned after your final counseling session. Estimated time: about 45 minutes over your first weeks as a married couple. Optional celebration module included.",
    activities: PREMARITAL_AFTER_S8_ACTIVITIES,
  },
};

export function listHomeworkTemplateSummaries(): MarriageHomeworkTemplateSummary[] {
  return Object.entries(MARRIAGE_HOMEWORK_TEMPLATES).map(([key, t]) => {
    const meta = PREMARITAL_HOMEWORK_TEMPLATE_META[key];
    return {
      key,
      title: t.title,
      description: t.description,
      activityCount: t.activities.length,
      timingLabel: meta?.timingLabel,
      assignedAfterLabel: meta?.assignedAfterLabel,
      preparingForLabel: meta?.preparingForLabel,
      postProgramNote: meta?.postProgramNote,
      estimatedMinutes: meta?.estimatedMinutes,
    };
  });
}

export function cloneTemplateActivities(templateKey: string): MarriageHomeworkActivityDef[] {
  const template = MARRIAGE_HOMEWORK_TEMPLATES[templateKey];
  if (!template) throw new Error("Unknown homework template.");
  return JSON.parse(JSON.stringify(template.activities)) as MarriageHomeworkActivityDef[];
}

export function templateMeta(templateKey: string) {
  const template = MARRIAGE_HOMEWORK_TEMPLATES[templateKey];
  if (!template) throw new Error("Unknown homework template.");
  return { title: template.title, description: template.description };
}
