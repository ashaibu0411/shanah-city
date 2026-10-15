import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { AGREEMENT_5, lesson, likertBank, q, scenarioBank } from "@/lib/marriage-stage2-content/builders";

const MODULE_ID = "s2-financial-workshop";

const DEFAULT_BUDGET_LINES = [
  { id: "housing", label: "Housing (rent/mortgage)" },
  { id: "utilities", label: "Utilities" },
  { id: "food", label: "Food & groceries" },
  { id: "transport", label: "Transportation" },
  { id: "debt", label: "Debt payments" },
  { id: "savings", label: "Savings & emergency fund" },
  { id: "giving", label: "Giving & tithe" },
  { id: "family", label: "Supporting extended family" },
  { id: "personal", label: "Personal / fun" },
  { id: "other", label: "Other" },
];

export function buildMod05FinancialModule(): MarriageModuleDefinition {
  const lessons = [
    lesson("m05-l01", "Financial personalities", "Spender, saver, planner, generous — without shame.", "learn", 1),
    lesson("m05-l02", "Priorities & values", "What money represents to each of you.", "answer", 2),
    lesson("m05-l03", "Debt & credit", "Honest talk without automatic sharing of numbers.", "reflect", 3),
    lesson("m05-l04", "Hypothetical budget builder", "Practice balancing a sample month together.", "practice", 4),
    lesson("m05-l05", "Simulations", "Bonuses, emergencies, and disagreements.", "practice", 5),
    lesson("m05-l06", "Giving & family support", "Expectations and limits.", "agree", 6),
    lesson("m05-l07", "Goals & emergency plan", "Shared targets for the next 12 months.", "agree", 7),
  ];

  const personality = likertBank(MODULE_ID, "m05-l01", "m05-per", [
    "I feel anxious when I do not know our account balances.",
    "I enjoy spontaneous treats even on a tight month.",
    "I prefer paying cash/debit over carrying balances.",
    "Generous giving matters even when money is tight.",
    "I trust long-term investing over keeping everything in savings.",
    "Coupons, sales, and planning give me satisfaction.",
    "I would rather earn more than cut lifestyle heavily.",
    "Financial surprises (bills, repairs) feel personal failures.",
  ], { requiredIndexes: [0, 3] });

  const priorities = likertBank(MODULE_ID, "m05-l02", "m05-pri", [
    "We should save before spending on wants.",
    "Experiences (travel, events) are worth saving for.",
    "Helping family financially is a top priority.",
    "Retirement saving should start now, even if small.",
    "Children’s education funds matter more than new cars.",
    "We should agree on any purchase over a set threshold.",
    "Separate fun money for each spouse reduces conflict.",
    "Debt freedom is more urgent than home upgrades.",
  ], { requiredIndexes: [5] });

  const debtPrivate = [
    q(MODULE_ID, "m05-income-private", "Approximate monthly take-home income (private — never auto-shared).", "short_answer", "private_financial_disclosure", {
      lessonId: "m05-l03",
      sensitivity: "high",
    }),
    q(MODULE_ID, "m05-debt-private", "Total monthly debt payments you are responsible for (private).", "short_answer", "private_financial_disclosure", {
      lessonId: "m05-l03",
      sensitivity: "high",
    }),
    q(MODULE_ID, "m05-credit-note", "Private note: anything about credit history you want your counselor to know (optional).", "long_reflection", "private_financial_disclosure", {
      lessonId: "m05-l03",
      allowSkip: true,
      sensitivity: "high",
    }),
  ];

  const budget = q(MODULE_ID, "m05-hypothetical-budget", "Build a hypothetical monthly budget (sample income — your real numbers stay private unless you share).", "budget_worksheet", "shared_after_both_submit", {
    lessonId: "m05-l04",
    journeyStage: "practice",
    required: true,
    explanation: "Totals should not exceed income. Use whole dollars.",
  });

  const simulations = scenarioBank(MODULE_ID, "m05-l05", "m05-sim", [
    {
      prompt: "Unexpected bonus: what first?",
      options: [
        { id: "give", label: "Give / tithe first" },
        { id: "debt", label: "Apply to debt" },
        { id: "save", label: "Emergency savings" },
        { id: "discuss", label: "Schedule money talk before deciding" },
      ],
    },
    {
      prompt: "Car repair wipes the emergency fund.",
      options: [
        { id: "card", label: "Use credit and argue later" },
        { id: "plan", label: "Rebuild plan together with timeline" },
        { id: "borrow", label: "Borrow from family quietly" },
        { id: "ignore", label: "Delay repair unsafely" },
      ],
    },
    {
      prompt: "One spouse wants a subscription the other sees as waste.",
      options: [
        { id: "cancel", label: "Cancel without discussion" },
        { id: "trial", label: "Trial period then review" },
        { id: "hide", label: "Hide the charge" },
        { id: "both", label: "Each gets equal ‘fun money’" },
      ],
    },
  ]);

  const giving = Array.from({ length: 10 }, (_, i) =>
    q(
      MODULE_ID,
      `m05-giv-${i + 1}`,
      [
        "We will agree on a giving percentage or amount before changing it.",
        "Supporting parents will have a budget cap we both honor.",
        "We will not lend money we cannot afford to lose.",
        "We will discuss large gifts before committing.",
        "We will pray over major financial decisions.",
        "We will review statements together monthly.",
        "We will use hypothetical budgets before trying real ones.",
        "We will celebrate debt milestones together.",
        "We will not shame each other for past money mistakes.",
        "We will involve a counselor if money talks turn contemptuous.",
      ][i]!,
      "agreement",
      "shared_after_both_submit",
      { lessonId: "m05-l06", options: [...AGREEMENT_5] },
    ),
  );

  const goals = [
    q(MODULE_ID, "m05-goal-joint", "One joint financial goal for the next 12 months:", "short_answer", "shared_after_both_submit", {
      lessonId: "m05-l07",
      required: true,
    }),
    q(MODULE_ID, "m05-emergency-target", "Emergency fund target we agree to work toward (dollar amount or months of expenses):", "short_answer", "shared_after_both_submit", {
      lessonId: "m05-l07",
      required: true,
    }),
  ];

  const workshopDrills = likertBank(MODULE_ID, "m05-l05", "m05-w", [
    "We can talk about money without contempt.",
    "I know our approximate monthly needs vs wants.",
    "I am willing to delay purchases to meet a joint goal.",
    "Financial stress is a team problem, not one spouse’s failure.",
    "We should celebrate progress on debt or savings milestones.",
    "I am open to financial coaching or classes together.",
    "I avoid checking accounts when anxious — and that hurts us.",
    "We align major purchases with prayer and budget review.",
  ]);

  const extraLikert = likertBank(MODULE_ID, "m05-l02", "m05-x", [
    "I am comfortable discussing money weekly.",
    "I learned to hide purchases to avoid conflict.",
    "Budget apps help us; spreadsheets overwhelm us.",
    "We should combine accounts after marriage.",
    "Financial transparency builds intimacy for me.",
    "I fear being controlled through money.",
    "We should consult a steward or advisor for big decisions.",
    "Tithing comes before discretionary spending.",
    "I prefer one partner to manage bills if we agree on reviews.",
    "Financial stress affects our physical intimacy.",
    "We should teach children about money early.",
    "Windfalls should fund shared goals first.",
  ]);

  const moreScenarios = scenarioBank(MODULE_ID, "m05-l05", "m05-s2", [
    {
      prompt: "Medical bill payment plan offered — what matters most?",
      options: [
        { id: "a", label: "Pay minimums elsewhere to afford it" },
        { id: "b", label: "Negotiate plan together on a call" },
        { id: "c", label: "Ignore until collections" },
        { id: "d", label: "One spouse decides alone" },
      ],
    },
    {
      prompt: "Friends invite you on an expensive trip.",
      options: [
        { id: "a", label: "Put it on credit without talking" },
        { id: "b", label: "Decline together with gratitude" },
        { id: "c", label: "Save jointly and revisit next year" },
        { id: "d", label: "Go solo and hide cost" },
      ],
    },
  ]);

  const questions = [
    ...personality,
    ...priorities,
    ...debtPrivate,
    budget,
    ...simulations,
    ...moreScenarios,
    ...giving,
    ...goals,
    ...extraLikert,
    ...workshopDrills,
  ];

  return {
    id: MODULE_ID,
    title: "Financial compatibility workshop",
    summary: "Personalities, priorities, debt talks, hypothetical budget builder, simulations, and shared goals.",
    sortOrder: 105,
    programTypes: ["premarital", "enrichment", "guided"],
    lessons,
    meta: {
      stage2Section: "agreements",
      activityKind: "budget_worksheet",
      estimatedMinutes: 90,
      pastoralGuide: "Never pressure partners to disclose numbers; celebrate honesty and planning.",
    },
    questions,
  };
}

export { DEFAULT_BUDGET_LINES };
