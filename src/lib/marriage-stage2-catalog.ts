import type {
  MarriageModuleDefinition,
  MarriageStage2ActivityCategory,
} from "@/lib/marriage-counseling-types";

export type MarriageStage2ActivityDefinition = {
  id: string;
  moduleId: string;
  title: string;
  summary: string;
  category: MarriageStage2ActivityCategory;
  sortOrder: number;
};

export const STAGE2_CONTENT_VERSION = "stage2-2026.1";

function q(
  moduleId: string,
  id: string,
  prompt: string,
  type: MarriageModuleDefinition["questions"][0]["type"],
  visibility: MarriageModuleDefinition["questions"][0]["visibility"],
  extra?: Partial<MarriageModuleDefinition["questions"][0]>,
) {
  return {
    id,
    moduleId,
    prompt,
    type,
    required: true,
    visibility,
    discussionPrompt: extra?.discussionPrompt ?? "Share what you heard and what you want to try together.",
    ...extra,
  };
}

const likertOpts = [
  { id: "1", label: "Strongly disagree" },
  { id: "2", label: "Disagree" },
  { id: "3", label: "Neutral" },
  { id: "4", label: "Agree" },
  { id: "5", label: "Strongly agree" },
];

export const STAGE2_MODULES: MarriageModuleDefinition[] = [
  {
    id: "s2-temperament-discovery",
    title: "Temperament & personality discovery",
    summary:
      "Explore communication, emotions, social energy, decisions, conflict, and upbringing — strengths-focused, not a diagnosis.",
    sortOrder: 101,
    programTypes: ["premarital", "enrichment", "guided"],
    meta: {
      biblicalReflection: "God knit you together with purpose (Psalm 139). Differences can serve unity in Christ.",
      pastoralGuide: "Avoid labeling; celebrate gifts and name growth areas gently.",
    },
    questions: [
      q("s2-temperament-discovery", "tmp-comm-style", "After a hard day, I prefer to talk things through right away.", "likert", "shared_after_both_submit", { options: likertOpts }),
      q("s2-temperament-discovery", "tmp-emotion-express", "I usually know what I am feeling before I say it.", "likert", "shared_after_both_submit", { options: likertOpts }),
      q("s2-temperament-discovery", "tmp-social-energy", "Large group gatherings energize me more than quiet time alone.", "likert", "shared_after_both_submit", { options: likertOpts }),
      q("s2-temperament-discovery", "tmp-decisions", "I prefer to decide quickly once I have enough information.", "likert", "shared_after_both_submit", { options: likertOpts }),
      q("s2-temperament-discovery", "tmp-conflict", "During conflict I need space before continuing the conversation.", "likert", "shared_after_both_submit", { options: likertOpts }),
      q("s2-temperament-discovery", "tmp-childhood", "Growing up, conflict in my home was usually resolved openly.", "likert", "shared_after_both_submit", { options: likertOpts }),
      q(
        "s2-temperament-discovery",
        "tmp-framework-note",
        "Optional: Which traditional temperament description feels most familiar as a learning tool (not a label)?",
        "single_choice",
        "private_reflection",
        {
          required: false,
          allowSkip: true,
          options: [
            { id: "skip", label: "Prefer not to use frameworks" },
            { id: "sanguine", label: "Sanguine — expressive, people-oriented" },
            { id: "choleric", label: "Choleric — driven, direct" },
            { id: "melancholic", label: "Melancholic — thoughtful, detail-minded" },
            { id: "phlegmatic", label: "Phlegmatic — steady, peace-seeking" },
          ],
          explanation: "Educational only — not clinical assessment.",
        },
      ),
      q(
        "s2-temperament-discovery",
        "tmp-private-growth",
        "What is one pattern from childhood you want Christ to heal in your marriage?",
        "long_reflection",
        "private_reflection",
      ),
    ],
  },
  {
    id: "s2-financial-workshop",
    title: "Financial compatibility workshop",
    summary: "Budget priorities, debt, saving, giving, and goals — sensitive numbers stay private unless you choose to share.",
    sortOrder: 102,
    programTypes: ["premarital", "enrichment", "guided"],
    questions: [
      q("s2-financial-workshop", "fin-priority-giving", "Regular generous giving is a top financial priority for us.", "agreement", "shared_after_both_submit", { options: likertOpts }),
      q("s2-financial-workshop", "fin-priority-saving", "We should save before spending on wants.", "agreement", "shared_after_both_submit", { options: likertOpts }),
      q("s2-financial-workshop", "fin-debt-approach", "How should we approach existing debt?", "single_choice", "shared_after_both_submit", {
        options: [
          { id: "aggressive", label: "Pay down aggressively before major purchases" },
          { id: "balanced", label: "Balance debt paydown with life goals" },
          { id: "minimal", label: "Avoid new debt; slow paydown OK" },
        ],
      }),
      q(
        "s2-financial-workshop",
        "fin-scenario-bonus",
        "Scenario: One of you receives an unexpected bonus. What do you do first?",
        "scenario",
        "shared_after_both_submit",
        {
          options: [
            { id: "give", label: "Give / tithe first" },
            { id: "debt", label: "Apply to debt" },
            { id: "save", label: "Save for agreed goal" },
            { id: "discuss", label: "Schedule a money talk before deciding" },
          ],
        },
      ),
      q(
        "s2-financial-workshop",
        "fin-monthly-income",
        "Your approximate monthly take-home income (private — not shared with partner automatically).",
        "short_answer",
        "private_financial_disclosure",
        { sensitivity: "high" },
      ),
      q(
        "s2-financial-workshop",
        "fin-monthly-debt",
        "Total monthly debt payments you are responsible for (private).",
        "short_answer",
        "private_financial_disclosure",
        { sensitivity: "high" },
      ),
      q(
        "s2-financial-workshop",
        "fin-joint-goal",
        "One joint financial goal for the next 12 months (shared after both submit).",
        "short_answer",
        "shared_after_both_submit",
      ),
    ],
  },
  {
    id: "s2-scenario-library",
    title: "Relationship scenario simulator",
    summary: "Independent responses on real-life topics, then compare with discussion prompts.",
    sortOrder: 103,
    programTypes: ["premarital", "enrichment", "guided"],
    questions: [
      ["expectations", "We should spend most free time together as a couple.", "sce-exp-time"],
      ["communication", "If I am upset, my partner should ask what I need before offering advice.", "sce-comm-advice"],
      ["intimacy", "Physical intimacy is best when we have connected emotionally that day.", "sce-int-emotion"],
      ["parenting", "When we disagree on parenting, we will defer to the more experienced parent.", "sce-par-defer"],
      ["in-laws", "Holiday plans should prioritize our marriage household over extended family.", "sce-inlaw-holiday"],
      ["friendships", "Opposite-sex friendships require clear boundaries we both agree on.", "sce-friend-boundary"],
      ["trust", "Privacy on phones is OK if there is no pattern of broken trust.", "sce-trust-phone"],
      ["jealousy", "Jealous feelings should be shared honestly within 24 hours.", "sce-jeal-share"],
      ["career", "If one career requires relocation, we decide together even if one role is paused.", "sce-career-move"],
      ["faith", "We will pray together about major decisions before acting.", "sce-faith-pray"],
      ["household", "Household chores should be divided by gifting, not gender alone.", "sce-home-chores"],
    ].map(([tag, prompt, id]) =>
      q("s2-scenario-library", id, `[${tag}] ${prompt}`, "agreement", "shared_after_both_submit", {
        options: likertOpts,
        discussionPrompt: `Discuss this ${tag} scenario: what would honoring God and each other look like?`,
      }),
    ),
  },
  {
    id: "s2-learning-reflection",
    title: "Shared reflection & action planning",
    summary: "Capture what you learned and agree on next steps together.",
    sortOrder: 104,
    programTypes: ["premarital", "enrichment", "guided"],
    questions: [
      q(
        "s2-learning-reflection",
        "lr-learned",
        "What is one thing you learned about your partner this week?",
        "long_reflection",
        "shared_after_both_submit",
      ),
      q(
        "s2-learning-reflection",
        "lr-action",
        "What is one concrete action you will take this week?",
        "short_answer",
        "shared_after_both_submit",
      ),
      q(
        "s2-learning-reflection",
        "lr-private-prayer",
        "Private prayer request for your relationship (only you and counselor with consent).",
        "long_reflection",
        "counselor_with_consent",
      ),
    ],
  },
];

export const STAGE2_ACTIVITIES: MarriageStage2ActivityDefinition[] = STAGE2_MODULES.map((m) => ({
  id: `activity-${m.id}`,
  moduleId: m.id,
  title: m.title,
  summary: m.summary,
  category:
    m.id.includes("temperament") ? "temperament"
    : m.id.includes("financial") ? "financial"
    : m.id.includes("scenario") ? "scenario"
    : "learning",
  sortOrder: m.sortOrder,
}));
