import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { AGREEMENT_5, lesson, likertBank, q, scenarioBank } from "@/lib/marriage-stage2-content/builders";

const MODULE_ID = "s2-mod-02-family-background";

export function buildMod02FamilyModule(): MarriageModuleDefinition {
  const lessons = [
    lesson("m02-l01", "Your family story", "Childhood tone, safety, and belonging.", "learn", 1, {
      learnContent:
        "Every home teaches us something about love, money, conflict, and faith. Some lessons bless your marriage; others need gentle rewriting. Private reflections stay yours unless you choose to share.",
    }),
    lesson("m02-l02", "Parents & models", "What you saw modeled — and what you want to repeat or change.", "reflect", 2),
    lesson("m02-l03", "Communication patterns", "How feelings and disagreements were handled growing up.", "answer", 3),
    lesson("m02-l04", "Discipline & boundaries", "Rules, freedom, and respect in your childhood home.", "answer", 4),
    lesson("m02-l05", "Culture & traditions", "Holidays, food, language, and expectations from your background.", "answer", 5),
    lesson("m02-l06", "Money messages", "What you learned about spending, saving, and helping family.", "answer", 6),
    lesson("m02-l07", "In-laws & extended family", "Closeness, obligations, and healthy limits.", "answer", 7),
    lesson("m02-l08", "Patterns to continue or change", "Joint vision for your new household.", "agree", 8),
  ];

  const childhood = likertBank(MODULE_ID, "m02-l02", "m02-par", [
    "I felt emotionally safe at home most of the time.",
    "My parents showed affection to each other in front of us.",
    "Conflict in my home was usually resolved, not ignored.",
    "I knew I was loved even when I disappointed my parents.",
    "Rules were clear and applied fairly among siblings.",
    "My family talked openly about faith and prayer.",
    "I was encouraged to express opinions respectfully.",
    "Secrets or unspoken tension shaped our home.",
  ], { requiredIndexes: [0, 2] });

  const comm = likertBank(MODULE_ID, "m02-l03", "m02-com", [
    "Raised voices were common when adults disagreed.",
    "We avoided hard topics to keep peace.",
    "Apologies happened regularly in my home.",
    "Humor was used to deflect serious conversations.",
    "I learned to read moods before speaking.",
    "My family preferred texting or notes over face-to-face talks.",
    "Feelings were labeled as ‘dramatic’ or minimized.",
    "We had regular meals together without screens.",
    "Extended family influenced major decisions.",
  ]);

  const discipline = likertBank(MODULE_ID, "m02-l04", "m02-dis", [
    "Consequences were predictable, not unpredictable punishment.",
    "Grace was shown after discipline.",
    "Privacy was respected as I got older.",
    "Comparison between siblings was a problem.",
    "Chores were shared by everyone, not by gender alone.",
    "I could respectfully disagree with a parent.",
    "Fear was used to maintain control.",
    "Boundaries with relatives were healthy and clear.",
  ]);

  const culture = likertBank(MODULE_ID, "m02-l05", "m02-cul", [
    "Holiday traditions are important to my identity.",
    "Food and hospitality express love in my family.",
    "Language or accent shaped how I communicate affection.",
    "Gender roles in my culture still influence my expectations.",
    "Immigration or relocation stories affect how I view stability.",
    "We honor elders even when we disagree with them.",
    "Faith practices from my background still guide me.",
    "Blending cultures in marriage will require intentional conversation.",
  ]);

  const money = likertBank(MODULE_ID, "m02-l06", "m02-mon", [
    "Talking about money was normal growing up.",
    "Debt was seen as shameful or normal — I still feel that echo.",
    "Generosity to church and community was modeled.",
    "Parents supported extended family financially when needed.",
    "I was taught to save before spending on wants.",
    "Unexpected bills created panic in our home.",
    "We were transparent about income within the household.",
    "Financial secrets existed in my extended family.",
  ], { visibility: "private_reflection", journeyStage: "reflect" });

  const inlaws = likertBank(MODULE_ID, "m02-l07", "m02-in", [
    "Weekly contact with parents is expected in my family.",
    "My spouse should prioritize my parents’ opinions on big decisions.",
    "Couples should set boundaries even if relatives are disappointed.",
    "Holiday rotation between families feels fair when planned early.",
    "In-law conflict should stay between the spouse and their parents first.",
    "Grandparent involvement in parenting decisions is welcome.",
    "Cultural honor means never saying no to family requests.",
    "We need a united front before responding to extended family pressure.",
  ], { requiredIndexes: [2, 7] });

  const scenarios = scenarioBank(MODULE_ID, "m02-l07", "m02-sce", [
    {
      prompt:
        "Your parent expects weekly dinners, but your spouse needs quieter weekends. What is your first instinct?",
      options: [
        { id: "a", label: "Side with my parent out of honor" },
        { id: "b", label: "Side with my spouse without discussion" },
        { id: "c", label: "Schedule a calm talk with spouse, then respond together" },
        { id: "d", label: "Avoid the topic until someone is upset" },
      ],
    },
    {
      prompt: "A sibling asks for money again. You disagree with your spouse about helping.",
      options: [
        { id: "a", label: "Give quietly to keep peace" },
        { id: "b", label: "Refuse without explaining" },
        { id: "c", label: "Agree on a budget line for family support" },
        { id: "d", label: "Let whichever spouse is related decide alone" },
      ],
    },
  ]);

  const continueChange = [
    q(MODULE_ID, "m02-continue-1", "Name one family strength you want to carry into your marriage.", "short_answer", "shared_after_both_submit", {
      lessonId: "m02-l08",
      journeyStage: "agree",
      required: true,
    }),
    q(MODULE_ID, "m02-change-1", "Name one pattern you want to change with Christ’s help.", "short_answer", "shared_after_both_submit", {
      lessonId: "m02-l08",
      journeyStage: "agree",
      required: true,
    }),
    q(MODULE_ID, "m02-boundary-private", "Private: A boundary you need but have not voiced yet.", "long_reflection", "private_reflection", {
      lessonId: "m02-l07",
      journeyStage: "reflect",
    }),
    q(MODULE_ID, "m02-share-optional", "Optional: Something from your upbringing you want your partner to understand (share when ready).", "long_reflection", "explicit_consent_to_share", {
      lessonId: "m02-l02",
      journeyStage: "discuss",
      sensitivity: "high",
    }),
  ];

  const multi = Array.from({ length: 12 }, (_, i) =>
    q(
      MODULE_ID,
      `m02-agree-${i + 1}`,
      [
        "We will pray before responding to extended-family pressure.",
        "We will not share private marital details with relatives without agreement.",
        "We will alternate holidays unless we agree on a different plan.",
        "We will discuss gifts to family before giving above our budget.",
        "We will speak respectfully about each other’s parents.",
        "We will ask ‘what did your home teach you?’ before judging a reaction.",
        "We will protect date night from routine family interruptions.",
        "We will revisit boundaries yearly or when life stages change.",
        "We will involve a counselor if in-law conflict threatens unity.",
        "We will celebrate each other’s traditions, not compete.",
        "We will teach children both family stories with honor.",
        "We will say no together when needed, without guilt-tripping.",
      ][i]!,
      "agreement",
      "shared_after_both_submit",
      { lessonId: "m02-l08", journeyStage: "agree", options: [...AGREEMENT_5] },
    ),
  );

  const questions = [
    q(MODULE_ID, "m02-intro", "What do you hope to understand about your partner’s upbringing? (Private)", "long_reflection", "private_reflection", {
      lessonId: "m02-l01",
      journeyStage: "reflect",
    }),
    ...childhood,
    ...comm,
    ...discipline,
    ...culture,
    ...money,
    ...inlaws,
    ...scenarios,
    ...continueChange,
    ...multi,
  ];

  return {
    id: MODULE_ID,
    title: "Family background & upbringing",
    summary: "Childhood, culture, money messages, in-laws, and patterns you want to continue or change.",
    sortOrder: 102,
    programTypes: ["premarital", "enrichment", "guided"],
    lessons,
    meta: {
      stage2Section: "discover",
      activityKind: "assessment",
      estimatedMinutes: 85,
      pastoralGuide: "Sensitive disclosures stay private unless explicitly shared.",
    },
    questions,
  };
}
