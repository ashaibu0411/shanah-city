import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { lesson, likertBank, q } from "@/lib/marriage-stage2-content/builders";

const MODULE_ID = "s2-mod-06-intimacy";

export function buildMod06IntimacyModule(): MarriageModuleDefinition {
  const lessons = [
    lesson("m06-l01", "Consent & scope", "Adult-only, educational, pastorally appropriate.", "learn", 1, {
      learnContent:
        "This module covers emotional and physical intimacy in marriage with respect and boundaries. You may skip any item. Private answers are not shared with your partner automatically. You may request a private counselor conversation at any time.",
    }),
    lesson("m06-l02", "Emotional connection", "Feeling known before physical closeness.", "reflect", 2),
    lesson("m06-l03", "Affection & touch", "Non-sexual and sexual affection expectations.", "answer", 3),
    lesson("m06-l04", "Communication & consent", "Talking about desire, timing, and limits.", "answer", 4),
    lesson("m06-l05", "Differences in desire", "Seasons, stress, and patience.", "reflect", 5),
    lesson("m06-l06", "Family planning & seasons", "Including stress and life changes.", "answer", 6),
    lesson("m06-l07", "Agreements & review", "What you choose to share with each other.", "agree", 7),
  ];

  const optIn = q(
    MODULE_ID,
    "m06-opt-in",
    "I opt in to the intimacy learning activities in this module (required to proceed beyond intro).",
    "single_choice",
    "private_reflection",
    {
      lessonId: "m06-l01",
      required: true,
      options: [
        { id: "yes", label: "Yes — I am an adult and choose to proceed" },
        { id: "no", label: "Not now — I will skip sensitive sections" },
      ],
    },
  );

  const emotional = likertBank(
    MODULE_ID,
    "m06-l02",
    "m06-emo",
    [
      "Feeling emotionally safe is essential for physical intimacy.",
      "Affirmation during the day affects my desire at night.",
      "Unresolved conflict blocks closeness for me.",
      "Prayer together increases my sense of connection.",
      "I need patience when I am grieving or depressed.",
      "I prefer scheduled time for connection over only spontaneous.",
    ],
    { visibility: "private_reflection", journeyStage: "reflect" },
  );

  const affection = likertBank(
    MODULE_ID,
    "m06-l03",
    "m06-aff",
    [
      "Non-sexual touch during the day is important to me.",
      "I need clear verbal consent before sexual intimacy.",
      "I feel loved through gentle physical affection without expectation.",
      "Public displays of affection are comfortable for me.",
      "I need transition time between parenting and intimacy.",
      "I appreciate direct conversations about preferences.",
      "Stress from work often lowers my desire temporarily.",
      "After childbirth or medical seasons, I need extra patience.",
    ],
    { visibility: "private_reflection", journeyStage: "answer", requiredIndexes: [1] },
  );

  const consentTalk = [
    q(MODULE_ID, "m06-boundary-private", "Private: A boundary you want honored (share only if you choose later).", "long_reflection", "private_reflection", {
      lessonId: "m06-l04",
      sensitivity: "high",
    }),
    q(
      MODULE_ID,
      "m06-share-phrase",
      "Optional — share with partner after both submit if you grant consent: A phrase that helps you feel safe initiating closeness.",
      "short_answer",
      "explicit_consent_to_share",
      { lessonId: "m06-l04", sensitivity: "high" },
    ),
    q(MODULE_ID, "m06-counselor-request", "Request private counselor conversation about intimacy (counselor-only).", "long_reflection", "counselor_with_consent", {
      lessonId: "m06-l04",
      allowSkip: true,
      sensitivity: "high",
    }),
  ];

  const desire = likertBank(
    MODULE_ID,
    "m06-l05",
    "m06-des",
    [
      "Different levels of desire are normal in seasons of marriage.",
      "Rejection feels personal unless we talk about context.",
      "I am willing to schedule intimacy when life is busy.",
      "Medical or mental health issues affect desire and need compassion.",
      "Pornography or hidden media harms trust and intimacy.",
      "We should seek pastoral/medical help for persistent pain or fear.",
    ],
    { visibility: "private_reflection" },
  );

  const family = likertBank(
    MODULE_ID,
    "m06-l06",
    "m06-fam",
    [
      "We have discussed family planning expectations openly.",
      "Parenting fatigue should be named without blame.",
      "We agree that coercion has no place in marital intimacy.",
      "We will protect bedroom privacy from children appropriately.",
      "We will revisit intimacy rhythms after major life changes.",
    ],
    { visibility: "private_reflection" },
  );

  const sharedAgree = q(
    MODULE_ID,
    "m06-joint-nonsexual",
    "One non-sexual affection habit we agree to try for two weeks (shared after both submit):",
    "short_answer",
    "shared_after_both_submit",
    { lessonId: "m06-l07", journeyStage: "agree", required: true },
  );

  const sharedPrinciples = [
    "We will never use intimacy as punishment or manipulation.",
    "We will respect a clear ‘not tonight’ without guilt-tripping.",
    "We will prioritize emotional safety before physical intimacy.",
    "We will pray together about intimacy only when we both agree.",
    "We will seek pastoral or medical help for ongoing pain or fear.",
    "We will protect our bedroom privacy appropriately.",
    "We will discuss stress and fatigue honestly.",
    "We will avoid comparing our marriage to media portrayals.",
    "We will rebuild trust slowly after breaches with counselor support if needed.",
    "We will schedule connection time amid busy seasons.",
  ].map((prompt, i) =>
    q(MODULE_ID, `m06-agree-${i + 1}`, prompt, "agreement", "shared_after_both_submit", {
      lessonId: "m06-l07",
      journeyStage: "agree",
      options: [
        { id: "1", label: "Strongly disagree" },
        { id: "2", label: "Disagree" },
        { id: "3", label: "Partly agree" },
        { id: "4", label: "Agree" },
        { id: "5", label: "Strongly agree" },
      ],
    }),
  );

  const extra = Array.from({ length: 40 }, (_, i) =>
    q(
      MODULE_ID,
      `m06-edu-${i + 1}`,
      [
        "Education about anatomy and pleasure is helpful when respectful.",
        "Shame-based messages from culture still affect me.",
        "I want intimacy to reflect mutual service, not demand.",
        "Fatigue is a valid reason to pause — not an rejection of love.",
        "Humor can help unless it belittles.",
        "Past experiences may need healing with professional help.",
        "Trust is rebuilt slowly with consistency.",
        "I can say no without guilt.",
        "I can say yes with enthusiasm.",
        "Checking in after intimacy strengthens connection.",
        "Comparing our marriage to media portrayals is harmful.",
        "Prayer can be part of our intimacy rhythms if we both agree.",
        "Medical checkups matter for ongoing pain.",
        "Emotional affairs threaten intimacy as much as physical ones.",
        "We should protect our marriage from exploitative content.",
        "Seasons of abstinence for health need mutual understanding.",
        "Grandparents living with us affects privacy — we will plan.",
        "Travel and ministry schedules require intentional connection.",
        "Grief lowers desire and needs tenderness.",
        "Celebrating milestones can include affectionate rituals.",
        "I want to learn my spouse’s love language in touch.",
        "Silence after intimacy can feel disconnecting.",
        "Affirmation of beauty and worth matters to me.",
        "I need cleanliness and environment to feel relaxed.",
        "Temperature, lighting, and timing matter more than I admit.",
        "I prefer initiating sometimes, not only responding.",
        "I want us to ask ‘Is this OK?’ without awkwardness.",
        "We will not use intimacy as a weapon or reward.",
        "Counselor conversations can be requested privately.",
        "We honor God with our bodies in mutual consent.",
        "Fantasy that excludes my spouse concerns me.",
        "Stress management improves intimacy for me.",
        "Exercise and sleep affect my desire.",
        "Medication side effects should be discussed openly with doctors.",
        "Postpartum seasons need extra grace.",
        "Menopause/andropause conversations should be normalized.",
        "Infertility stress affects closeness — we will grieve together.",
        "Adoption or foster seasons change rhythms — we adapt.",
        "Long-distance seasons need creative connection.",
        "We revisit agreements as we age together.",
      ][i]!,
      "likert",
      "private_reflection",
      {
        lessonId: i < 20 ? "m06-l03" : "m06-l05",
        options: [
          { id: "1", label: "Strongly disagree" },
          { id: "2", label: "Disagree" },
          { id: "3", label: "Neutral" },
          { id: "4", label: "Agree" },
          { id: "5", label: "Strongly agree" },
        ],
        allowSkip: true,
      },
    ),
  );

  const questions = [optIn, ...emotional, ...affection, ...consentTalk, ...desire, ...family, sharedAgree, ...sharedPrinciples, ...extra];

  return {
    id: MODULE_ID,
    title: "Sex, intimacy & affection",
    summary: "Consent-based, educational module for married couples — private by default, pastoral review required to enable.",
    sortOrder: 106,
    programTypes: ["premarital", "enrichment", "guided"],
    lessons,
    meta: {
      stage2Section: "discover",
      activityKind: "reflection",
      estimatedMinutes: 70,
      contentWarning: "Skip anytime; request counselor support; not graphic.",
      pastoralGuide: "Do not pressure disclosure; honor trauma and safety.",
    },
    questions,
  };
}
