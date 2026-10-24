import type {
  MarriageModuleDefinition,
  MarriageQuestionDefinition,
  MarriageQuestionType,
} from "@/lib/marriage-counseling-types";

export type WrittenQuestionGuidance = {
  explanation: string;
  writingExamples: string[];
};

/** Guidance keyed by question id (unique across Stage 1 curriculum). */
export const WRITTEN_QUESTION_GUIDANCE: Record<string, WrittenQuestionGuidance> = {
  "kyp-strength": {
    explanation: "Name one quality or skill you bring—not a whole list. Think about what your partner already appreciates.",
    writingExamples: [
      "I stay calm when plans change and help us think clearly.",
      "I am consistent about encouraging people when they feel discouraged.",
      "I am good at planning details so important things do not get forgotten.",
      "I listen patiently before I respond in tense moments.",
    ],
  },
  "kyp-growth": {
    explanation: "Describe one area where you want to grow for the sake of your relationship—not everything you wish you could fix at once.",
    writingExamples: [
      "I want to speak up sooner instead of letting small hurts pile up.",
      "I want to manage my tone when I feel criticized.",
      "I want to be more consistent with apologies when I am wrong.",
      "I want to balance work stress so it does not spill into our time together.",
    ],
  },
  "fb-traditions": {
    explanation: "List traditions you hope to continue, adapt, or create in your marriage—not every memory from childhood.",
    writingExamples: [
      "Sunday family meals after church",
      "Prayer or devotions at certain times of day",
      "Holiday celebrations with extended family",
      "Birthday or anniversary rituals that made you feel valued",
      "Regular visits or calls to parents or grandparents",
      "Family meetings to talk through plans or conflicts",
    ],
  },
  "fb-parents-model": {
    explanation: "Describe what you observed about marriage growing up—helpful patterns and ones you want to handle differently. There is no right answer.",
    writingExamples: [
      "They showed affection openly and apologized after arguments",
      "They worked as a team on finances even when money was tight",
      "Conflict was often avoided until it exploded",
      "One parent carried most of the emotional work at home",
      "Faith and prayer were part of daily life",
      "I did not see much modeling of healthy conflict repair",
    ],
  },
  "fb-finance-upbringing": {
    explanation: "Summarize messages you heard about money—spoken or unspoken—not exact amounts or account details.",
    writingExamples: [
      "Save first; do not show off spending",
      "Always help family when they ask",
      "Debt should be avoided at all costs",
      "God owns everything—we are stewards",
      "Money talk was private or stressful",
      "If you work hard, you deserve to enjoy what you earn",
    ],
  },
  "fb-sensitive": {
    explanation: "Optional. Share only what you are ready to name here; you may prefer to discuss some topics first with your counselor.",
    writingExamples: [
      "Past abuse or trauma I am not ready to detail in writing",
      "Family addiction or mental health history",
      "Painful divorce or abandonment in my upbringing",
      "Legal or immigration stress in my family story",
      "Nothing at this time—I prefer to wait for counseling",
    ],
  },
  "com-listen": {
    explanation: "Finish the sentence with specific behaviors that help you feel understood—not vague “when you care.”",
    writingExamples: [
      "…puts their phone down and makes eye contact",
      "…summarizes what I said before giving advice",
      "…asks gentle questions instead of fixing immediately",
      "…follows up later after I share something hard",
    ],
  },
  "com-safety": {
    explanation: "Private reflection. Name boundaries, fears, or safety needs in conflict. You choose what to share with your partner later.",
    writingExamples: [
      "If voices are raised, I need a pause before we continue",
      "I need us to agree that neither of us will block exits or follow aggressively",
      "Past experiences make certain tones feel unsafe—I want pastoral support",
      "I want a code word that means we stop and resume when calm",
    ],
  },
  "int-emotional": {
    explanation: "Describe emotional closeness in your own words—non-sexual connection, trust, and feeling known.",
    writingExamples: [
      "Sharing daily highs and lows without judgment",
      "Praying together about fears and hopes",
      "Being honest about stress without being fixed immediately",
      "Small affirmations and quality time without distractions",
    ],
  },
  "int-expectations": {
    explanation: "Share hopes and assumptions respectfully. You may skip if you prefer to discuss this in counseling first.",
    writingExamples: [
      "I hope we can talk openly about what helps us feel close",
      "I need us to check in when one of us feels distant",
      "I want initiation to feel mutual, not one-sided pressure",
      "We may need time to learn each other’s rhythms after marriage",
    ],
  },
  "int-boundaries": {
    explanation: "Name limits that protect dignity, consent, and respect—what must never be pressured or ignored.",
    writingExamples: [
      "Either of us can say no without guilt or punishment",
      "We do not use intimacy to settle unrelated arguments",
      "We agree on privacy around our bodies and health",
      "Past experiences are shared only when each person feels ready",
    ],
  },
  "int-private": {
    explanation: "Optional counselor-only note. You control whether this is shared with your partner through consent settings.",
    writingExamples: [
      "History I am not ready to discuss with my partner yet",
      "Questions about past relationships I want pastoral guidance on",
      "Medical or emotional concerns affecting intimacy",
      "Nothing to add here at this time",
    ],
  },
  "faith-church": {
    explanation: "Describe realistic involvement—attendance, serving, small groups—not an ideal you cannot sustain.",
    writingExamples: [
      "Weekly worship plus a midweek group when possible",
      "Serving on a rotation that respects family time",
      "Prioritizing one campus community even if we travel for work",
      "Growing together through shared devotions at home",
    ],
  },
  "faith-lead": {
    explanation: "Describe partnership in spiritual life—not one person controlling the other’s faith.",
    writingExamples: [
      "We pray together and encourage personal time with God",
      "We decide major giving and service choices together",
      "We invite mentors when we feel stuck spiritually",
      "We protect Sabbath rest as a family rhythm",
    ],
  },
  "roles-labor": {
    explanation: "Describe how planning, remembering, and coordinating should be shared—not who is “better” at everything.",
    writingExamples: [
      "Split calendars and reminders so one person is not the default planner",
      "Rotate who tracks bills, appointments, and family updates",
      "Check in weekly about mental load—not only when something is missed",
      "Adjust roles by season (school, travel, new jobs)",
    ],
  },
  "ch-timing": {
    explanation: "Share your sense of timing if children are desired—ranges or seasons, not medical details.",
    writingExamples: [
      "After at least one year of marriage to settle as a couple",
      "When we are financially stable and aligned on parenting values",
      "We are open and need more prayer and conversation",
      "Not planning children—we want to be clear about that",
    ],
  },
  "ch-faith": {
    explanation: "Describe values and practices you hope to pass on—church, prayer, character, community.",
    writingExamples: [
      "Regular church and age-appropriate Bible teaching",
      "Prayer at meals and bedtime",
      "Serving others as a family habit",
      "Grace-based discipline agreed on together",
    ],
  },
  "tr-privacy": {
    explanation: "Explain healthy privacy vs secrecy—trust with transparency, not surveillance.",
    writingExamples: [
      "Private journaling or friendship conversations that are not hidden affairs",
      "Shared finances with agreed check-ins, not password policing",
      "Space for personal prayer or reflection",
      "Transparency about significant relationships and travel",
    ],
  },
  "eh-support": {
    explanation: "Name concrete actions that help you feel cared for when life is heavy.",
    writingExamples: [
      "Check in with a text during a stressful day",
      "Listen without trying to fix immediately",
      "Help with a task so I can rest",
      "Pray with me or sit quietly together",
    ],
  },
  "eh-grief": {
    explanation: "Describe what helps when you are sad, disappointed, or grieving—you may skip if not ready.",
    writingExamples: [
      "Give me space first, then ask how you can help",
      "Do not minimize my feelings with quick fixes",
      "Stay close physically—a hug or sitting together",
      "Help me reach professional support if I am overwhelmed",
    ],
  },
  "eh-private": {
    explanation: "Optional counselor-only. Share only what you choose; this is not a diagnosis form.",
    writingExamples: [
      "Past counseling or treatment I want pastoral awareness of",
      "Family history of depression or anxiety",
      "Current stress I am managing with professional help",
      "Prefer to discuss in person only",
    ],
  },
  "vis-five": {
    explanation: "Paint a realistic picture of hopes for the next five years—marriage, work, ministry, family, location.",
    writingExamples: [
      "Stable jobs with margin for rest and hospitality",
      "Owning or renting a home where we can host others",
      "Serving in one ministry together without burnout",
      "Starting or growing our family if that is our shared hope",
    ],
  },
  "vis-ministry": {
    explanation: "Optional. Describe how you imagine serving together—local church, community, or missions.",
    writingExamples: [
      "Mentoring younger couples at church",
      "Volunteering in kids or youth ministry on a shared schedule",
      "Short-term mission trips with clear boundaries",
      "Hospitality ministry from our home",
    ],
  },
  "vis-dream": {
    explanation: "Share a personal dream your partner should know—career, education, creative goal, or life hope.",
    writingExamples: [
      "Finishing a degree while working part time",
      "Starting a small business with clear family boundaries",
      "Caring for aging parents while building our home",
      "Writing, music, or art that matters to my sense of purpose",
    ],
  },
  "rd-commit": {
    explanation: "Describe what covenant means to you spiritually and practically—not a perfect marriage fantasy.",
    writingExamples: [
      "Choosing each other again even when feelings fluctuate",
      "Seeking help before giving up when we are stuck",
      "Keeping God at the center of decisions and forgiveness",
      "Building habits of honesty, prayer, and repair",
    ],
  },
  "rd-unresolved": {
    explanation: "List topics where you want counselor or mentor support—you may skip sensitive items here.",
    writingExamples: [
      "Extended family boundaries and holidays",
      "Debt disclosure and a shared budget plan",
      "Past relationship history we have not fully discussed",
      "Differing expectations about work and rest",
    ],
  },
  "rd-final": {
    explanation: "One clear commitment you want your partner to hear today—specific and doable.",
    writingExamples: [
      "I will bring concerns to you within 48 hours instead of stewing silently",
      "I will pray with you before major decisions",
      "I will honor your need for rest on Sundays",
      "I will ask for help when I feel overwhelmed",
    ],
  },
  "rd-counselor": {
    explanation: "Optional shared list for your next session—questions for your pastor or counselor.",
    writingExamples: [
      "How do we navigate in-law expectations fairly?",
      "What does healthy conflict look like for us?",
      "How should we plan finances in our first year?",
      "When should we revisit intimacy questions in counseling?",
    ],
  },
  "fg-need": {
    explanation: "In your own words, what forgiveness is—and is not—in marriage.",
    writingExamples: [
      "Releasing the right to punish while still seeking repair",
      "Choosing trust-building steps after betrayal",
      "Asking God for grace when I feel stuck",
      "Forgiveness does not mean ignoring unsafe behavior",
    ],
  },
  "fg-repair": {
    explanation: "Describe first steps after hurt—what helps trust begin to rebuild.",
    writingExamples: [
      "A sincere apology that names the hurt without excuses",
      "Agreeing on a concrete change for next time",
      "Time together to listen before solving",
      "Pastoral or counselor support for deeper wounds",
    ],
  },
  "wr-rest": {
    explanation: "Describe rest you can share—Sabbath, hobbies, unplugged time—not only vacations.",
    writingExamples: [
      "One evening a week with no work messages",
      "Walks or worship playlists together",
      "Protecting sleep by shutting screens early",
      "Monthly day trip without obligations",
    ],
  },
  "wr-hours": {
    explanation: "Explain boundaries that keep work from crowding marriage and family time.",
    writingExamples: [
      "No laptops at the dinner table",
      "Agreeing on latest work hours except emergencies",
      "Planning vacations where I am truly offline",
      "Sharing calendars so surprises are rare",
    ],
  },
  "hb-private": {
    explanation: "Optional counselor-only. Name habits or concerns you prefer to discuss privately first.",
    writingExamples: [
      "Substance use patterns that worry me",
      "Gambling, pornography, or spending habits",
      "Family history of addiction",
      "Nothing to share here right now",
    ],
  },
  "gr-support": {
    explanation: "Finish the sentence with what helps when you grieve loss, disappointment, or change.",
    writingExamples: [
      "…sit with me without rushing me to feel better",
      "…handle practical tasks while I process",
      "…check in gently for weeks, not just the first day",
      "…pray with me when words are hard",
    ],
  },
  "cu-blend": {
    explanation: "Describe what blending cultures, languages, or traditions will require from both of you.",
    writingExamples: [
      "Learning each other’s family customs and food traditions",
      "Choosing which holidays to prioritize",
      "Language differences in conflict or humor",
      "Respecting parents while setting our own household norms",
    ],
  },
  "cv-mentors": {
    explanation: "Optional. Name couples or mentors whose marriage you respect—not celebrities.",
    writingExamples: [
      "Our small-group leaders who pray together regularly",
      "An older couple at church we could ask for advice",
      "A pastor or counselor we already trust",
      "Friends who model forgiveness after conflict",
    ],
  },
  "joy-plan": {
    explanation: "One practical way you will protect fun, romance, or gratitude in everyday life.",
    writingExamples: [
      "Monthly date nights on the calendar",
      "Weekly gratitude texts or notes",
      "Annual trip or adventure we save for together",
      "Laughing together through games or shared hobbies",
    ],
  },
};

export const WRITTEN_RESPONSE_QUESTION_TYPES: MarriageQuestionType[] = [
  "short_answer",
  "long_reflection",
];

export function isWrittenResponseQuestion(type: MarriageQuestionType): boolean {
  return WRITTEN_RESPONSE_QUESTION_TYPES.includes(type);
}

export function enrichQuestionWithWrittenGuidance(
  question: MarriageQuestionDefinition,
): MarriageQuestionDefinition {
  if (!isWrittenResponseQuestion(question.type)) return question;
  const guide = WRITTEN_QUESTION_GUIDANCE[question.id];
  if (!guide) return question;
  return {
    ...question,
    explanation: guide.explanation,
    writingExamples: guide.writingExamples,
  };
}

export function enrichModulesWithWrittenGuidance(
  modules: MarriageModuleDefinition[],
): MarriageModuleDefinition[] {
  return modules.map((mod) => ({
    ...mod,
    questions: mod.questions.map(enrichQuestionWithWrittenGuidance),
  }));
}

export type WrittenGuidanceValidationIssue = {
  moduleId: string;
  questionId: string;
  message: string;
};

export function validateWrittenQuestionGuidanceForModules(
  modules: MarriageModuleDefinition[],
): WrittenGuidanceValidationIssue[] {
  const issues: WrittenGuidanceValidationIssue[] = [];
  for (const mod of modules) {
    for (const q of mod.questions) {
      if (!isWrittenResponseQuestion(q.type)) continue;
      if (!q.prompt?.trim()) {
        issues.push({ moduleId: mod.id, questionId: q.id, message: "Missing prompt." });
      }
      if (!q.explanation?.trim()) {
        issues.push({ moduleId: mod.id, questionId: q.id, message: "Missing explanation (what we mean)." });
      }
      const examples = q.writingExamples?.filter((e) => e.trim()) ?? [];
      if (examples.length < 3) {
        issues.push({
          moduleId: mod.id,
          questionId: q.id,
          message: "Need at least three writing examples.",
        });
      }
    }
  }
  return issues;
}

export function countWrittenResponseQuestions(modules: MarriageModuleDefinition[]): number {
  let n = 0;
  for (const mod of modules) {
    for (const q of mod.questions) {
      if (isWrittenResponseQuestion(q.type)) n += 1;
    }
  }
  return n;
}
