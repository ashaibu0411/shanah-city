import type {
  MarriageModuleDefinition,
  MarriageProgramType,
  MarriageQuestionDefinition,
  MarriageQuestionType,
} from "@/lib/marriage-counseling-types";
import {
  AGREEMENT_SCALE_OPTIONS,
  CHILDHOOD_HOME_TONE_OPTIONS,
} from "@/lib/marriage-counseling-response-scales";
import { enrichModulesWithWrittenGuidance } from "@/lib/marriage-written-question-guidance";

export const MARRIAGE_COUNSELING_CONTENT_VERSION = "2026.2";
export const MARRIAGE_CONSENT_VERSION = "2026.1";

const ALL_PROGRAMS: MarriageProgramType[] = ["premarital", "enrichment", "guided"];

function q(
  moduleId: string,
  id: string,
  prompt: string,
  type: MarriageQuestionType,
  opts: Partial<MarriageQuestionDefinition> = {},
): MarriageQuestionDefinition {
  return {
    id,
    moduleId,
    prompt,
    type,
    required: opts.required ?? true,
    visibility: opts.visibility ?? "shared_after_both_submit",
    options: opts.options,
    explanation: opts.explanation,
    writingExamples: opts.writingExamples,
    discussionPrompt: opts.discussionPrompt,
    allowSkip: opts.allowSkip,
    sensitivity: opts.sensitivity,
    min: opts.min,
    max: opts.max,
  };
}

function moduleDef(
  id: string,
  title: string,
  summary: string,
  sortOrder: number,
  questions: MarriageQuestionDefinition[],
  programTypes: MarriageProgramType[] = ALL_PROGRAMS,
): MarriageModuleDefinition {
  return { id, title, summary, sortOrder, programTypes, questions };
}

const MARRIAGE_COUNSELING_MODULES_RAW: MarriageModuleDefinition[] = [
  moduleDef("mod-01-knowing-yourself", "Knowing Yourself & Your Partner", "Personality, emotions, conflict, and strengths.", 1, [
    q("mod-01-knowing-yourself", "kyp-temperament", "Which temperament description feels most familiar as a starting point (not a label)?", "single_choice", {
      options: [
        { id: "sanguine", label: "Sanguine — expressive, people-oriented" },
        { id: "choleric", label: "Choleric — driven, direct" },
        { id: "melancholic", label: "Melancholic — thoughtful, detail-oriented" },
        { id: "phlegmatic", label: "Phlegmatic — calm, steady" },
        { id: "mixed", label: "A mix / none fit well" },
      ],
      explanation: "Traditional temperaments are reflective tools, not clinical diagnoses.",
      discussionPrompt: "Share one behavior that fits you better than a single label.",
    }),
    q("mod-01-knowing-yourself", "kyp-recharge", "After a demanding week, what helps you recharge most?", "single_choice", {
      options: [
        { id: "alone", label: "Quiet time alone" },
        { id: "partner", label: "Low-key time with my partner" },
        { id: "friends", label: "Time with friends or community" },
        { id: "activity", label: "Physical activity or a project" },
      ],
      discussionPrompt: "How can we honor both of our recharge needs?",
    }),
    q("mod-01-knowing-yourself", "kyp-conflict", "When conflict starts, I usually…", "scenario", {
      options: [
        { id: "address", label: "Address it quickly" },
        { id: "pause", label: "Need space, then return" },
        { id: "avoid", label: "Avoid until it fades" },
        { id: "shutdown", label: "Shut down emotionally" },
      ],
      discussionPrompt: "What helps you feel safe when we disagree?",
    }),
    q("mod-01-knowing-yourself", "kyp-express", "I feel most loved when my partner…", "multiple_choice", {
      options: [
        { id: "words", label: "Uses affirming words" },
        { id: "time", label: "Gives focused time" },
        { id: "acts", label: "Helps with practical acts of service" },
        { id: "touch", label: "Shows affection physically" },
        { id: "gifts", label: "Gives thoughtful gifts" },
      ],
    }),
    q("mod-01-knowing-yourself", "kyp-strength", "Name one strength you bring to this relationship.", "short_answer", {
      discussionPrompt: "Thank your partner for sharing — reflect back what you heard.",
    }),
    q("mod-01-knowing-yourself", "kyp-growth", "Name one area where you want to grow for your partner's sake.", "long_reflection", {
      visibility: "private_reflection",
      discussionPrompt: "Share only what you both feel ready to discuss.",
    }),
  ]),
  moduleDef("mod-02-family-background", "Family Background", "Household patterns, traditions, and models you grew up with.", 2, [
    q("mod-02-family-background", "fb-household", "How would you describe the emotional tone of your childhood home?", "single_choice", {
      options: CHILDHOOD_HOME_TONE_OPTIONS,
      explanation: "Choose the option that fits best overall — there is no perfect label.",
    }),
    q("mod-02-family-background", "fb-traditions", "Which family traditions matter most to you going forward?", "long_reflection", {
      explanation: "List a few traditions (holidays, meals, faith practices, visits, etc.) and why they matter to you.",
      discussionPrompt: "Which traditions do we want to keep, adapt, or create new?",
    }),
    q("mod-02-family-background", "fb-parents-model", "What did you learn about marriage from your parents or caregivers?", "long_reflection", {
      allowSkip: true,
      discussionPrompt: "What do we want to imitate — and what do we want to do differently?",
    }),
    q("mod-02-family-background", "fb-conflict", "How was conflict handled in your family?", "single_choice", {
      options: [
        { id: "open", label: "Openly discussed" },
        { id: "avoided", label: "Mostly avoided" },
        { id: "heated", label: "Often heated" },
        { id: "mixed", label: "Mixed / depends" },
      ],
      allowSkip: true,
    }),
    q("mod-02-family-background", "fb-finance-upbringing", "What messages about money did you receive growing up?", "short_answer", { allowSkip: true }),
    q("mod-02-family-background", "fb-sensitive", "Is there anything from your background you prefer to discuss privately with a counselor first?", "long_reflection", {
      visibility: "counselor_with_consent",
      required: false,
      sensitivity: "high",
      allowSkip: true,
    }),
  ]),
  moduleDef("mod-03-communication", "Communication & Conflict", "Listening, repair, boundaries, and respectful disagreement.", 3, [
    q("mod-03-communication", "com-pref", "When something bothers me, I prefer to…", "preferred_response", {
      options: [
        { id: "now", label: "Talk about it soon" },
        { id: "written", label: "Write it out first" },
        { id: "scheduled", label: "Schedule a calm time" },
        { id: "signal", label: "Use a code word / signal first" },
      ],
    }),
    q("mod-03-communication", "com-listen", "I feel heard when my partner…", "short_answer", {
      discussionPrompt: "Practice summarizing what you heard before responding.",
    }),
    q("mod-03-communication", "com-apology", "A meaningful apology includes… (pick all that apply)", "multiple_choice", {
      options: [
        { id: "ownership", label: "Clear ownership" },
        { id: "empathy", label: "Empathy for impact" },
        { id: "change", label: "Plan to change behavior" },
        { id: "time", label: "Time without defensiveness" },
      ],
    }),
    q("mod-03-communication", "com-repair", "After a disagreement, what helps you reconnect?", "single_choice", {
      options: [
        { id: "talk", label: "Talking it through" },
        { id: "affection", label: "Physical affection" },
        { id: "space", label: "Space then check-in" },
        { id: "prayer", label: "Prayer together" },
        { id: "service", label: "Acts of kindness" },
      ],
    }),
    q("mod-03-communication", "com-scenario", "Your partner raises their voice during an argument. You would most likely…", "scenario", {
      options: [
        { id: "pause", label: "Ask for a pause" },
        { id: "match", label: "Raise yours too" },
        { id: "withdraw", label: "Withdraw silently" },
        { id: "stay", label: "Stay and keep talking" },
      ],
      discussionPrompt: "Agree on a pause plan that protects safety and respect.",
    }),
    q("mod-03-communication", "com-safety", "If you ever feel unsafe in conflict, I want you to know…", "long_reflection", {
      visibility: "private_reflection",
      sensitivity: "high",
      allowSkip: true,
      explanation: "Safety concerns can be shared privately with pastoral care — not automatically with your partner.",
    }),
  ]),
  moduleDef("mod-04-money", "Money & Finances", "Spending, saving, giving, and decision-making — without exact account numbers.", 4, [
    q("mod-04-money", "fin-spender", "I tend to be more…", "single_choice", {
      options: [
        { id: "saver", label: "Saver / cautious" },
        { id: "balanced", label: "Balanced" },
        { id: "spender", label: "Spender / generous" },
      ],
    }),
    q("mod-04-money", "fin-priorities", "Rank what matters most in your household budget (top = most important).", "priorities", {
      options: [
        { id: "giving", label: "Giving & generosity" },
        { id: "debt", label: "Paying down debt" },
        { id: "savings", label: "Emergency savings" },
        { id: "housing", label: "Housing stability" },
        { id: "experiences", label: "Shared experiences" },
      ],
    }),
    q("mod-04-money", "fin-accounts", "How do you prefer to handle day-to-day money management as a couple?", "single_choice", {
      options: [
        { id: "joint", label: "Mostly joint accounts and shared decisions" },
        { id: "hybrid", label: "Some separate accounts with a shared budget plan" },
        { id: "one_leads", label: "One of us leads day-to-day with regular check-ins" },
        { id: "define_together", label: "We still need to define this together" },
      ],
    }),
    q("mod-04-money", "fin-debt", "How open should we be about existing debt with each other?", "single_choice", {
      options: [
        { id: "full", label: "Full transparency before marriage" },
        { id: "ranges", label: "General ranges first, details in counseling" },
        { id: "counselor", label: "Discuss details with counselor present" },
      ],
      discussionPrompt: "We will not ask for bank passwords or full account numbers here.",
    }),
    q("mod-04-money", "fin-family", "We expect to help extended family financially when there is genuine need.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
      discussionPrompt: "Where do our families of origin influence this?",
    }),
    q("mod-04-money", "fin-exercise", "In a sample budget exercise, which line would you adjust first if income dropped 20%?", "single_choice", {
      options: [
        { id: "discretionary", label: "Discretionary spending" },
        { id: "giving", label: "Giving amount" },
        { id: "housing", label: "Housing costs" },
        { id: "savings", label: "Savings rate" },
      ],
      explanation: "Uses fictional values — for conversation only.",
    }),
  ]),
  moduleDef("mod-05-intimacy", "Sex & Intimacy", "Emotional and physical intimacy, consent, and respectful communication.", 5, [
    q("mod-05-intimacy", "int-emotional", "Emotional intimacy for me means…", "short_answer", {
      discussionPrompt: "Marriage never removes the need for mutual consent and respect.",
    }),
    q("mod-05-intimacy", "int-affection", "Non-sexual affection is important to me in our relationship.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
    q("mod-05-intimacy", "int-talk", "I feel comfortable talking with my partner about physical intimacy.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
    q("mod-05-intimacy", "int-expectations", "What expectations do you have about frequency and initiation?", "long_reflection", {
      visibility: "shared_after_both_submit",
      allowSkip: true,
      discussionPrompt: "Listen without correcting — ask clarifying questions only.",
    }),
    q("mod-05-intimacy", "int-boundaries", "Boundaries that must be honored include…", "long_reflection", {
      discussionPrompt: "Name boundaries clearly; no pressure to disclose history.",
    }),
    q("mod-05-intimacy", "int-private", "Anything about intimacy you prefer to discuss only in private counseling?", "long_reflection", {
      visibility: "counselor_with_consent",
      required: false,
      sensitivity: "high",
      allowSkip: true,
    }),
  ]),
  moduleDef("mod-06-faith", "Faith & Spiritual Life", "Prayer, worship, service, and growing together in Christ.", 6, [
    q("mod-06-faith", "faith-prayer", "Praying together regularly as a couple is important to us.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
    q("mod-06-faith", "faith-church", "Church participation looks like…", "short_answer", {
      discussionPrompt: "Difference is not automatic spiritual failure — talk about shared priorities.",
    }),
    q("mod-06-faith", "faith-growth", "One spiritual habit I want us to build is…", "single_choice", {
      options: [
        { id: "devotion", label: "Shared devotions" },
        { id: "serve", label: "Serving together" },
        { id: "mentor", label: "Accountability / mentoring" },
        { id: "worship", label: "Worship beyond Sunday" },
      ],
    }),
    q("mod-06-faith", "faith-giving", "Generous giving and stewardship are priorities in our home.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
    q("mod-06-faith", "faith-lead", "Spiritual leadership in our home means…", "long_reflection", {
      discussionPrompt: "Describe partnership, not control.",
    }),
  ]),
  moduleDef("mod-07-roles", "Roles & Responsibilities", "Household work, careers, and fair partnership.", 7, [
    q("mod-07-roles", "roles-cooking", "Who do you expect to lead meal planning most weeks?", "single_choice", {
      options: [
        { id: "me", label: "Mostly me" },
        { id: "partner", label: "Mostly my partner" },
        { id: "shared", label: "Shared equally" },
        { id: "flex", label: "Flexible by season" },
      ],
    }),
    q("mod-07-roles", "roles-clean", "We will share household cleaning in a way that feels fair to both of us.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
    q("mod-07-roles", "roles-labor", "Emotional labor (planning, remembering, coordinating) should be…", "short_answer", {
      discussionPrompt: "Use the responsibility-sharing exercise after you compare answers.",
    }),
    q("mod-07-roles", "roles-career", "If one career opportunity required relocation, we would…", "scenario", {
      options: [
        { id: "discuss", label: "Decide together with prayer" },
        { id: "primary", label: "Follow primary earner" },
        { id: "ministry", label: "Prioritize ministry calling" },
        { id: "unsure", label: "Need more conversation" },
      ],
    }),
    q("mod-07-roles", "roles-exercise", "Distribute household tasks (cooking, cleaning, finances, scheduling) — rank your willingness to lead each.", "priorities", {
      options: [
        { id: "cooking", label: "Cooking" },
        { id: "cleaning", label: "Cleaning" },
        { id: "finances", label: "Bill paying / finances" },
        { id: "scheduling", label: "Scheduling / calendar" },
      ],
    }),
  ]),
  moduleDef("mod-08-children", "Children & Parenting", "Desires, timing, values, and extended family.", 8, [
    q("mod-08-children", "ch-desire", "Having children is…", "single_choice", {
      options: [
        { id: "yes", label: "Something I hope for" },
        { id: "open", label: "Open / undecided" },
        { id: "no", label: "Not something I hope for" },
        { id: "private", label: "Prefer not to answer here" },
      ],
      allowSkip: true,
    }),
    q("mod-08-children", "ch-timing", "Ideal timing to start a family (if desired) is…", "short_answer", { allowSkip: true }),
    q("mod-08-children", "ch-discipline", "Discipline should emphasize…", "multiple_choice", {
      options: [
        { id: "grace", label: "Grace & teaching" },
        { id: "structure", label: "Clear structure" },
        { id: "community", label: "Church community input" },
        { id: "consistency", label: "Consistency between us" },
      ],
    }),
    q("mod-08-children", "ch-faith", "Faith upbringing for children should include…", "long_reflection", {
      discussionPrompt: "Avoid assumptions about fertility or private medical details.",
    }),
    q("mod-08-children", "ch-balance", "When we are parenting, fairly sharing work and family time will matter to us.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
  ]),
  moduleDef("mod-09-trust", "Trust & Boundaries", "Honesty, privacy, friendships, and digital life.", 9, [
    q("mod-09-trust", "tr-honesty", "We discuss significant financial decisions together before acting.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
    q("mod-09-trust", "tr-privacy", "Healthy privacy in marriage means…", "short_answer", {
      discussionPrompt: "Transparency is not the same as surveillance or control.",
    }),
    q("mod-09-trust", "tr-social", "Friendships with the opposite sex should be…", "single_choice", {
      options: [
        { id: "open", label: "Open with mutual awareness" },
        { id: "boundaries", label: "Allowed with clear boundaries" },
        { id: "limited", label: "Limited / case-by-case" },
        { id: "avoid", label: "Mostly avoided" },
      ],
    }),
    q("mod-09-trust", "tr-devices", "Access to each other's phones/devices should be…", "single_choice", {
      options: [
        { id: "trust", label: "Based on trust, not constant access" },
        { id: "shared", label: "Shared when asked" },
        { id: "open", label: "Open by default" },
        { id: "discuss", label: "Something we need to define together" },
      ],
      explanation: "Unrestricted access is not a universal requirement for healthy marriage.",
    }),
    q("mod-09-trust", "tr-former", "Contact with former romantic relationships should be…", "scenario", {
      options: [
        { id: "none", label: "None" },
        { id: "transparent", label: "Rare and transparent" },
        { id: "context", label: "Depends on context" },
        { id: "discuss", label: "Needs conversation" },
      ],
    }),
  ]),
  moduleDef("mod-10-emotional-health", "Emotional Health & Stress", "Support, coping, and asking for help.", 10, [
    q("mod-10-emotional-health", "eh-stress", "When stressed, I typically…", "multiple_choice", {
      options: [
        { id: "withdraw", label: "Withdraw" },
        { id: "talk", label: "Talk it out" },
        { id: "busy", label: "Stay busy" },
        { id: "pray", label: "Pray / worship" },
        { id: "help", label: "Ask for practical help" },
      ],
    }),
    q("mod-10-emotional-health", "eh-support", "I feel supported when you…", "short_answer"),
    q("mod-10-emotional-health", "eh-help", "Seeking professional counseling or medical help when needed is a wise step.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
    q("mod-10-emotional-health", "eh-grief", "When I grieve or disappoint, I need…", "long_reflection", { allowSkip: true }),
    q("mod-10-emotional-health", "eh-private", "Mental health history I prefer to discuss privately first", "long_reflection", {
      visibility: "counselor_with_consent",
      required: false,
      sensitivity: "high",
      allowSkip: true,
      explanation: "This platform does not diagnose conditions.",
    }),
  ]),
  moduleDef("mod-11-vision", "Vision & Life Direction", "Career, ministry, housing, and long-term dreams.", 11, [
    q("mod-11-vision", "vis-five", "In five years, I hope our life together includes…", "long_reflection", {
      discussionPrompt: "Combine individual visions into shared themes — not one winner.",
    }),
    q("mod-11-vision", "vis-ministry", "Serving in ministry together looks like…", "short_answer", { allowSkip: true }),
    q("mod-11-vision", "vis-location", "We could see ourselves living…", "single_choice", {
      options: [
        { id: "local", label: "Near family / current area" },
        { id: "open", label: "Open to relocation" },
        { id: "mission", label: "Mission / travel focused" },
        { id: "unsure", label: "Still discerning" },
      ],
    }),
    q("mod-11-vision", "vis-dream", "A personal dream I want you to know about is…", "long_reflection"),
    q("mod-11-vision", "vis-priorities", "Rank life priorities for the next season.", "priorities", {
      options: [
        { id: "marriage", label: "Marriage health" },
        { id: "career", label: "Career / education" },
        { id: "ministry", label: "Ministry impact" },
        { id: "family", label: "Family / children" },
        { id: "finances", label: "Financial stability" },
      ],
    }),
  ]),
  moduleDef("mod-12-readiness", "Marriage Readiness", "Commitment, covenant, and preparation — without a pass/fail verdict.", 12, [
    q("mod-12-readiness", "rd-commit", "Marriage is a covenant before God meaning…", "long_reflection", {
      discussionPrompt: "Share what readiness means — we will not label you ready or not ready.",
    }),
    q("mod-12-readiness", "rd-unresolved", "Topics we still need to discuss with support are…", "long_reflection", { allowSkip: true }),
    q("mod-12-readiness", "rd-support", "We are willing to seek pastoral or professional help when we need it.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
    q("mod-12-readiness", "rd-respect", "Mutual respect during disagreement is essential in our marriage.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
    q("mod-12-readiness", "rd-final", "One commitment I make to you today is…", "short_answer", {
      discussionPrompt: "Use this in your next counseling session.",
    }),
    q("mod-12-readiness", "rd-counselor", "Questions we want to ask our counselor", "long_reflection", {
      visibility: "shared_after_both_submit",
      required: false,
    }),
  ]),
  moduleDef("mod-13-forgiveness", "Forgiveness & Repair", "Grace, apology, and rebuilding trust.", 13, [
    q("mod-13-forgiveness", "fg-need", "Forgiveness in marriage means…", "short_answer"),
    q("mod-13-forgiveness", "fg-repair", "After hurt, repair begins with…", "long_reflection", { allowSkip: true }),
    q("mod-13-forgiveness", "fg-apology", "A meaningful apology includes…", "multiple_choice", {
      options: [
        { id: "ownership", label: "Owning the hurt without excuses" },
        { id: "change", label: "A plan to change behavior" },
        { id: "time", label: "Patience while trust rebuilds" },
        { id: "prayer", label: "Prayer together when appropriate" },
      ],
    }),
    q("mod-13-forgiveness", "fg-boundary", "Forgiveness does not always mean immediate trust is restored.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
  ], ["premarital", "enrichment", "guided"]),
  moduleDef("mod-14-in-laws", "In-Laws & Extended Family", "Boundaries with family of origin.", 14, [
    q("mod-14-in-laws", "il-holidays", "Holiday time with extended family should be…", "single_choice", {
      options: [
        { id: "equal", label: "Split fairly" },
        { id: "alternate", label: "Alternate years" },
        { id: "own", label: "Our household first" },
        { id: "discuss", label: "Case-by-case" },
      ],
    }),
    q("mod-14-in-laws", "il-advice", "Unsolicited advice from family should be handled by…", "preferred_response", {
      options: [
        { id: "together", label: "A united response from us as a couple" },
        { id: "speaker", label: "The partner whose family it is" },
        { id: "defer", label: "Thank them and decide privately later" },
      ],
    }),
    q("mod-14-in-laws", "il-boundary", "We will protect our marriage decisions from pressure by extended family.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
  ], ["premarital", "enrichment", "guided"]),
  moduleDef("mod-15-work", "Work & Rest", "Sabbath, burnout, and ambition.", 15, [
    q("mod-15-work", "wr-rest", "Healthy rest together looks like…", "short_answer"),
    q("mod-15-work", "wr-hours", "Protecting family time from work means…", "long_reflection"),
    q("mod-15-work", "wr-sabbath", "We will protect at least one regular rest rhythm each week.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
    q("mod-15-work", "wr-burnout", "Signs I am approaching burnout include…", "long_reflection", {
      visibility: "private_reflection",
      allowSkip: true,
    }),
  ], ["enrichment", "guided"]),
  moduleDef("mod-16-addiction", "Habits & Freedom", "Honesty about habits that affect the relationship.", 16, [
    q("mod-16-addiction", "hb-open", "We should be able to talk openly about habits that concern our relationship.", "agreement", {
      options: AGREEMENT_SCALE_OPTIONS,
    }),
    q("mod-16-addiction", "hb-private", "Concerns I prefer to discuss with counselor first", "long_reflection", {
      visibility: "counselor_with_consent",
      allowSkip: true,
      sensitivity: "high",
    }),
  ], ["guided"]),
  moduleDef("mod-17-grief", "Loss & Transitions", "Grief, moves, and major life changes.", 17, [
    q("mod-17-grief", "gr-support", "When I grieve, I need you to…", "short_answer"),
  ], ["enrichment", "guided"]),
  moduleDef("mod-18-culture", "Culture & Identity", "Background, language, and traditions.", 18, [
    q("mod-18-culture", "cu-blend", "Blending our backgrounds will require…", "long_reflection"),
  ], ["premarital", "enrichment"]),
  moduleDef("mod-19-covenant", "Covenant & Community", "Accountability and church community.", 19, [
    q("mod-19-covenant", "cv-mentors", "Mentors or couples we admire are…", "short_answer", { required: false }),
  ], ["premarital", "enrichment"]),
  moduleDef("mod-20-celebration", "Celebration & Joy", "Fun, romance, and gratitude.", 20, [
    q("mod-20-celebration", "joy-plan", "One way we will protect joy in our marriage is…", "short_answer"),
  ], ["enrichment", "guided"]),
];

export const MARRIAGE_COUNSELING_MODULES: MarriageModuleDefinition[] =
  enrichModulesWithWrittenGuidance(MARRIAGE_COUNSELING_MODULES_RAW);

/** Built-in seed curriculum (20 modules). Published admin versions override at runtime. */
export const MARRIAGE_SEED_MODULE_COUNT = MARRIAGE_COUNSELING_MODULES.length;

export function getMarriageModule(moduleId: string) {
  return MARRIAGE_COUNSELING_MODULES.find((m) => m.id === moduleId) ?? null;
}

export function modulesForProgram(program: MarriageProgramType) {
  return MARRIAGE_COUNSELING_MODULES.filter((m) => m.programTypes.includes(program)).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}
