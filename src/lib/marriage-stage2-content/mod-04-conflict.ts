import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { lesson, q, scenarioBank } from "@/lib/marriage-stage2-content/builders";

const MODULE_ID = "s2-mod-04-conflict-lab";

const REPAIR_OPTIONS = [
  { id: "pause", label: "Pause with agreed signal; return within 24 hours" },
  { id: "listen", label: "Each speaks 3 minutes uninterrupted" },
  { id: "pray", label: "Pray together before solving" },
  { id: "write", label: "Write feelings first, then discuss" },
  { id: "counselor", label: "Involve counselor if stuck or unsafe" },
];

export function buildMod04ConflictModule(): MarriageModuleDefinition {
  const lessons = [
    lesson("m04-l01", "Healthy conflict vs harm", "Mutual respect — not threats, coercion, or abuse.", "learn", 1, {
      learnContent:
        "This lab is for ordinary marital disagreement. If you fear your partner, are threatened, coerced, or harmed, stop here and seek immediate safety and pastoral/counselor help — do not treat abuse as a communication problem.",
    }),
    lesson("m04-l02", "Money tensions", "Spending, secrecy, and goals.", "practice", 2),
    lesson("m04-l03", "Relatives & boundaries", "In-laws, holidays, and loyalty.", "practice", 3),
    lesson("m04-l04", "Household & fairness", "Chores, standards, and exhaustion.", "practice", 4),
    lesson("m04-l05", "Trust & transparency", "Phones, friendships, and follow-through.", "practice", 5),
    lesson("m04-l06", "Parenting & discipline", "United front with kids.", "practice", 6),
    lesson("m04-l07", "Career & time", "Work hours, moves, and ambition.", "practice", 7),
    lesson("m04-l08", "Intimacy & connection", "Feeling pursued, heard, and safe.", "practice", 8),
    lesson("m04-l09", "Conflict repair worksheet", "Name the hurt, own your part, plan next steps.", "agree", 9),
  ];

  const money = scenarioBank(MODULE_ID, "m04-l02", "m04-mon", [
    {
      prompt: "You discover a purchase over your informal spending limit. First response?",
      options: [
        { id: "a", label: "Confront immediately in anger" },
        { id: "b", label: "Ask when you can talk calmly about budgets" },
        { id: "c", label: "Hide your own spending in retaliation" },
        { id: "d", label: "Cancel shared cards without discussion" },
      ],
    },
    {
      prompt: "One spouse wants to lend money to family; the other refuses.",
      options: [
        { id: "a", label: "Lend secretly" },
        { id: "b", label: "Refuse all giving permanently" },
        { id: "c", label: "Set a giving cap you both agree on" },
        { id: "d", label: "Let guilt decide each time" },
      ],
    },
  ]);

  const relatives = scenarioBank(MODULE_ID, "m04-l03", "m04-rel", [
    {
      prompt: "A parent criticizes your spouse during a visit.",
      options: [
        { id: "a", label: "Stay silent to keep peace" },
        { id: "b", label: "Defend spouse later privately only" },
        { id: "c", label: "United response: ‘We will speak respectfully in our home.’" },
        { id: "d", label: "Argue with parent in front of spouse" },
      ],
    },
    {
      prompt: "Holiday plans double-book both families.",
      options: [
        { id: "a", label: "Choose your family without consulting" },
        { id: "b", label: "Skip holidays to avoid conflict" },
        { id: "c", label: "Plan rotation early together" },
        { id: "d", label: "Go separate ways without talking" },
      ],
    },
  ]);

  const household = scenarioBank(MODULE_ID, "m04-l04", "m04-home", [
    {
      prompt: "Dishes pile up after a long week. You feel resentment.",
      options: [
        { id: "a", label: "Silent treatment until they notice" },
        { id: "b", label: "List every failure from the past month" },
        { id: "c", label: "Ask for a 10-minute chore reset meeting" },
        { id: "d", label: "Do it all yourself and explode later" },
      ],
    },
    {
      prompt: "Standards differ: ‘clean enough’ vs ‘deep clean.’",
      options: [
        { id: "a", label: "Impose your standard" },
        { id: "b", label: "Agree on minimums and optional deep cleans" },
        { id: "c", label: "Stop caring and live in mess" },
        { id: "d", label: "Hire help without discussing cost" },
      ],
    },
  ]);

  const trust = scenarioBank(MODULE_ID, "m04-l05", "m04-tru", [
    {
      prompt: "A private message notification makes one spouse anxious.",
      options: [
        { id: "a", label: "Demand passwords" },
        { id: "b", label: "Share boundaries and reassurance requests" },
        { id: "c", label: "Spy without telling" },
        { id: "d", label: "Mock the worry" },
      ],
    },
    {
      prompt: "A promise to arrive home by 7 is broken repeatedly.",
      options: [
        { id: "a", label: "Label them untrustworthy forever" },
        { id: "b", label: "Discuss patterns and realistic expectations" },
        { id: "c", label: "Punish with cold distance" },
        { id: "d", label: "Stop telling them when you are hurt" },
      ],
    },
  ]);

  const parenting = scenarioBank(MODULE_ID, "m04-l06", "m04-par", [
    {
      prompt: "Child misbehaves in public; spouses disagree on discipline.",
      options: [
        { id: "a", label: "Correct spouse in front of child" },
        { id: "b", label: "Defer to whoever is louder" },
        { id: "c", label: "Tag-team: one handles child, debrief later" },
        { id: "d", label: "Ignore behavior to avoid conflict" },
      ],
    },
    {
      prompt: "Grandparent undermines your house rules.",
      options: [
        { id: "a", label: "Let it go to avoid drama" },
        { id: "b", label: "Speak as a couple with clear boundaries" },
        { id: "c", label: "Stop visiting entirely without talk" },
        { id: "d", label: "Blame spouse for their parents" },
      ],
    },
  ]);

  const career = scenarioBank(MODULE_ID, "m04-l07", "m04-car", [
    {
      prompt: "Overtime threatens date night again.",
      options: [
        { id: "a", label: "Cancel date without discussion" },
        { id: "b", label: "Renegotiate work boundaries together" },
        { id: "c", label: "Resent quietly" },
        { id: "d", label: "Quit job impulsively" },
      ],
    },
    {
      prompt: "Relocation offer benefits career but uproots spouse’s support network.",
      options: [
        { id: "a", label: "Decide alone — it is your job" },
        { id: "b", label: "Joint discernment with timeline and trial plan" },
        { id: "c", label: "Refuse all moves forever" },
        { id: "d", label: "Guilt-trip until they agree" },
      ],
    },
  ]);

  const intimacy = scenarioBank(MODULE_ID, "m04-l08", "m04-int", [
    {
      prompt: "One spouse feels rejected when initiation is declined.",
      options: [
        { id: "a", label: "Pressure until yes" },
        { id: "b", label: "Talk about timing, stress, and affection alternatives" },
        { id: "c", label: "Withdraw affection entirely" },
        { id: "d", label: "Compare to other couples" },
      ],
    },
    {
      prompt: "Emotional distance after a fight lingers for days.",
      options: [
        { id: "a", label: "Pretend nothing happened" },
        { id: "b", label: "Use repair steps and check-in" },
        { id: "c", label: "Bring up every old wound" },
        { id: "d", label: "Seek entertainment to avoid talking" },
      ],
    },
  ]);

  const reflections = Array.from({ length: 18 }, (_, i) =>
    q(
      MODULE_ID,
      `m04-ref-${i + 1}`,
      [
        "After this scenario, what feeling showed up first in you?",
        "What story did you tell yourself about your partner’s motive?",
        "What need was underneath your reaction?",
        "What would honoring God look like in the next 10 minutes?",
        "Where could you take responsibility without taking all blame?",
        "What boundary would protect love without punishing?",
        "What would a timeout look like for us?",
        "How can we invite prayer into this pattern?",
        "What apology might be needed from you?",
        "What forgiveness might you need to extend?",
        "What practical agreement would prevent repeat?",
        "Who could we ask for mentor support?",
        "What trigger should we name for next time?",
        "How does your family-of-origin shape this fight?",
        "What is one sentence your spouse needs to hear?",
        "What is one behavior you will change this week?",
        "How will we check back in on this agreement?",
        "What would make you feel safe continuing the talk?",
      ][i]!,
      i % 3 === 0 ? "long_reflection" : "short_answer",
      i % 4 === 0 ? "private_reflection" : "shared_after_both_submit",
      { lessonId: "m04-l09", journeyStage: "reflect" },
    ),
  );

  const repair = [
    q(MODULE_ID, "m04-repair-hurt", "Conflict repair: Name the hurt without attacking character.", "long_reflection", "shared_after_both_submit", {
      lessonId: "m04-l09",
      journeyStage: "agree",
      required: true,
    }),
    q(MODULE_ID, "m04-repair-own", "Own your part specifically (behavior, not identity).", "long_reflection", "shared_after_both_submit", {
      lessonId: "m04-l09",
      journeyStage: "agree",
      required: true,
    }),
    q(MODULE_ID, "m04-repair-next", "Next step we agree to try:", "single_choice", "shared_after_both_submit", {
      lessonId: "m04-l09",
      journeyStage: "agree",
      options: REPAIR_OPTIONS,
      required: true,
    }),
    q(MODULE_ID, "m04-unsafe-private", "Private: If any scenario felt unsafe, note that here (counselor can follow up with consent).", "long_reflection", "counselor_with_consent", {
      lessonId: "m04-l01",
      journeyStage: "reflect",
      sensitivity: "high",
    }),
  ];

  const extraTopics: Array<[string, string, string[]]> = [
    [
      "m04-l02",
      "m04-mon-x",
      [
        "Partner hides a small purchase; trust feels shaken.",
        "Income drops suddenly; fear about bills rises.",
        "One wants to tithe during a tight month; the other fears insolvency.",
        "Retirement account vs paying off car loan debate.",
        "Partner wants to help sibling again; budget is already tight.",
        "Credit score surprise when applying for housing.",
      ],
    ],
    [
      "m04-l03",
      "m04-rel-x",
      [
        "Relative drops by unannounced during date night.",
        "Spouse feels you defend your parent more than your marriage.",
        "Cultural expectation to live near parents conflicts with job offer.",
        "In-law gives unsolicited parenting advice.",
        "Holiday gift spending escalates yearly.",
        "Family group chat turns critical of your spouse.",
      ],
    ],
    [
      "m04-l04",
      "m04-home-x",
      [
        "One sleeps in after night shift; chores feel uneven.",
        "Standards for children’s room cleanliness differ.",
        "Meal planning falls on one spouse repeatedly.",
        "Pet care responsibilities ignored.",
        "Laundry piles up during busy ministry season.",
        "Yard work postponed until someone snaps.",
      ],
    ],
    [
      "m04-l05",
      "m04-tru-x",
      [
        "Friendship with ex surfaces old insecurity.",
        "Work spouse jokes make partner uncomfortable.",
        "Forgotten promise about time home erodes trust.",
        "Hidden calendar event discovered.",
        "Flirty comment at party not addressed.",
        "Financial account not disclosed early in marriage.",
      ],
    ],
    [
      "m04-l06",
      "m04-par-x",
      [
        "Screen time rules differ for children.",
        "Spouse undermines timeout in the moment.",
        "Teen privacy vs safety monitoring debate.",
        "Discipline style mirrors harsh childhood patterns.",
        "Co-sleeping disagreement with newborn.",
        "Step-parent role boundaries unclear.",
      ],
    ],
    [
      "m04-l07",
      "m04-car-x",
      [
        "Side hustle consumes evenings.",
        "Ministry travel schedule strains home life.",
        "Partner feels career dreams are paused.",
        "Education pursuit requires household sacrifice.",
        "Commission-based income creates feast/famine stress.",
        "Boss expects availability on Sabbath rest.",
      ],
    ],
    [
      "m04-l08",
      "m04-int-x",
      [
        "Stress after miscarriage or loss affects closeness.",
        "Feeling more like roommates than lovers.",
        "Different love languages after childbirth.",
        "Fatigue from caregiving for aging parents.",
        "Comparison to past relationships mentioned in fight.",
        "Avoiding affection to avoid expectation.",
      ],
    ],
  ];

  const genericOptions = [
    { id: "a", label: "Escalate to win the point" },
    { id: "b", label: "Withdraw and stew silently" },
    { id: "c", label: "Pause, pray, and schedule a repair talk" },
    { id: "d", label: "Involve a mentor or counselor early" },
  ];

  const extraScenarios = extraTopics.flatMap(([lessonId, prefix, prompts]) =>
    scenarioBank(
      MODULE_ID,
      lessonId,
      prefix,
      prompts.map((prompt) => ({ prompt: `Scenario: ${prompt} Your first move?`, options: genericOptions })),
    ),
  );

  const questions = [
    ...money,
    ...relatives,
    ...household,
    ...trust,
    ...parenting,
    ...career,
    ...intimacy,
    ...extraScenarios,
    ...reflections,
    ...repair,
  ];

  return {
    id: MODULE_ID,
    title: "Conflict resolution laboratory",
    summary: "Realistic simulations, repair worksheet, and safety guidance — not for abuse situations.",
    sortOrder: 104,
    programTypes: ["premarital", "enrichment", "guided"],
    lessons,
    meta: {
      stage2Section: "scenarios",
      activityKind: "scenario",
      estimatedMinutes: 75,
      contentWarning: "Stop and seek help if you fear your partner or feel unsafe.",
    },
    questions,
  };
}
