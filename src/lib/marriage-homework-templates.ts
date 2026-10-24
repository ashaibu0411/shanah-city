import type { MarriageHomeworkActivityDef, MarriageHomeworkTemplateSummary } from "@/lib/marriage-homework-types";

export const WEEK_1_HOMEWORK_TEMPLATE_KEY = "week-1-knowing-yourself";

const WEEK_1_ACTIVITIES: MarriageHomeworkActivityDef[] = [
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
];

export const MARRIAGE_HOMEWORK_TEMPLATES: Record<
  string,
  { title: string; description: string; activities: MarriageHomeworkActivityDef[] }
> = {
  [WEEK_1_HOMEWORK_TEMPLATE_KEY]: {
    title: "WEEK 1 — KNOWING YOURSELF BEFORE BECOMING ONE",
    description:
      "This week's goal is to understand yourself, your background, and the kind of marriage you want to build. Answer honestly and thoughtfully. You do not need to finish everything in one sitting.",
    activities: WEEK_1_ACTIVITIES,
  },
};

export function listHomeworkTemplateSummaries(): MarriageHomeworkTemplateSummary[] {
  return Object.entries(MARRIAGE_HOMEWORK_TEMPLATES).map(([key, t]) => ({
    key,
    title: t.title,
    description: t.description,
    activityCount: t.activities.length,
  }));
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
