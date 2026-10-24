import type { MarriageHomeworkActivityDef } from "@/lib/marriage-homework-types";
import { enrichHomeworkActivities } from "@/lib/marriage-homework-written-guidance";

export const PREMARITAL_AFTER_S2_ACTIVITIES: MarriageHomeworkActivityDef[] = enrichHomeworkActivities([
  {
    id: "s2-a",
    kind: "individual_writing",
    title: "Activity A — Your communication story",
    instructions:
      "Reflect privately (about 25 minutes). Your partner cannot see these answers. Be honest about patterns, not excuses.",
    questions: [
      {
        id: "1",
        prompt:
          "How did your family or community handle disagreement when you were growing up (silence, yelling, humor, leaving the room, involving elders)? How might that show up in marriage?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt:
          "When you feel misunderstood, what do you need first — space, reassurance, eye contact, a pause, or something else?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "3",
        prompt:
          "What is one communication habit you want to strengthen before the wedding, and one you want to surrender?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s2-b",
    kind: "joint_discussion",
    title: "Activity B — Listening practice",
    instructions:
      "Set aside 25 minutes together. One person speaks for three minutes without interruption; the other repeats back the meaning before responding. Switch roles. Then answer the questions below — each in private.",
    discussionPrompt:
      "Share one hope and one fear about how you will handle conflict as a married couple.",
    questions: [
      {
        id: "1",
        prompt: "What did you hear from your partner that you had not understood before?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt:
          "What time-out rule will you use when a conversation exceeds your skill level (who calls it, how long, when you return)?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s2-c",
    kind: "scripture_reflection",
    title: "Activity C — Scripture reflection",
    instructions: "Read the passages slowly, then answer in your own words (about 15 minutes).",
    scriptureRefs: ["James 1:19", "Ephesians 4:29", "Proverbs 15:1"],
    questions: [
      {
        id: "1",
        prompt: "Which phrase from these Scriptures challenges you most right now, and why?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt:
          "Name one practical way you will “be quick to hear, slow to speak” this week — be specific.",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s2-d",
    kind: "curriculum_link",
    title: "Activity D — Curriculum",
    instructions:
      "Complete the Communication module in Marriage Prep if you have not already. Answers stay in the assessment — nothing to copy here.",
    moduleIds: ["mod-03-communication"],
    optionalModuleIds: ["mod-13-forgiveness"],
    questions: [],
  },
]);

export const PREMARITAL_AFTER_S3_ACTIVITIES: MarriageHomeworkActivityDef[] = enrichHomeworkActivities([
  {
    id: "s3-a",
    kind: "individual_writing",
    title: "Activity A — Money story",
    instructions: "Private reflection (about 25 minutes). Your partner will not see these answers.",
    questions: [
      {
        id: "1",
        prompt:
          "What did you learn about money growing up — openly taught or only observed (scarcity, generosity, secrecy, shame, control)?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt:
          "List current debts, savings habits, and giving patterns at a high level. Note anything your fiancé must know before marriage.",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "3",
        prompt:
          "What spending or saving difference between you worries you most, and how do you hope to talk about it with honor?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s3-b",
    kind: "joint_discussion",
    title: "Activity B — Stewardship conversation",
    instructions:
      "About 30 minutes together. Discuss without solving every detail — aim for transparency and shared values.",
    discussionPrompt:
      "What does it mean for us to honor the Lord with our wealth, whether we have much or little?",
    questions: [
      {
        id: "1",
        prompt:
          "What purchase amount should always require a joint conversation before either of you commits?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt: "What is one shared financial goal for your first year of marriage?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s3-c",
    kind: "scripture_reflection",
    title: "Activity C — Scripture reflection",
    instructions: "Read and reflect (about 15 minutes).",
    scriptureRefs: ["Proverbs 3:9–10", "Luke 16:10–11", "1 Timothy 6:6–10"],
    questions: [
      {
        id: "1",
        prompt: "How does “godliness with contentment” speak to your attitude toward money today?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt: "What is one step toward financial faithfulness you will take this month?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s3-d",
    kind: "curriculum_link",
    title: "Activity D — Curriculum",
    instructions: "Complete the Money module in Marriage Prep.",
    moduleIds: ["mod-04-money"],
    questions: [],
  },
]);

export const PREMARITAL_AFTER_S4_ACTIVITIES: MarriageHomeworkActivityDef[] = enrichHomeworkActivities([
  {
    id: "s4-a",
    kind: "individual_writing",
    title: "Activity A — Family loyalties",
    instructions: "Private reflection (about 25 minutes).",
    questions: [
      {
        id: "1",
        prompt:
          "Where do you feel most torn between honoring family and prioritizing your fiancé? Describe the situation without blaming.",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt:
          "What boundary do you need with extended family (visits, advice, finances, language, holidays) that you have not stated clearly yet?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "3",
        prompt:
          "If you hope to have children, what one value from your background do you want to pass on, and one you want to change?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s4-b",
    kind: "joint_discussion",
    title: "Activity B — Cleave and honor",
    instructions: "About 30 minutes. Practice agreeing on a united response before the next family conversation.",
    discussionPrompt:
      "How will we honor our parents and still make “we” decisions as our primary household?",
    questions: [
      {
        id: "1",
        prompt: "What holiday or visit rhythm feels fair to both of you for the first two years?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt: "What phrase will you use together when a relative pressures one of you privately?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s4-c",
    kind: "scripture_reflection",
    title: "Activity C — Scripture reflection",
    instructions: "Read and reflect (about 15 minutes).",
    scriptureRefs: ["Genesis 2:24", "Ephesians 6:1–4", "Ruth 1:16–17"],
    questions: [
      {
        id: "1",
        prompt: "What does healthy “leave and cleave” look like in your cultural context?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt: "How will you show honor to parents without letting them run your marriage?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s4-d",
    kind: "curriculum_link",
    title: "Activity D — Curriculum",
    instructions: "Complete Roles and Children modules as assigned by your counselor.",
    moduleIds: ["mod-07-roles", "mod-08-children"],
    optionalModuleIds: ["mod-14-in-laws"],
    questions: [],
  },
]);

export const PREMARITAL_AFTER_S5_ACTIVITIES: MarriageHomeworkActivityDef[] = enrichHomeworkActivities([
  {
    id: "s5-a",
    kind: "individual_writing",
    title: "Activity A — Safety and trust",
    instructions:
      "Private reflection (about 25 minutes). If something feels unsafe, talk with your counselor — do not force disclosure to your partner here.",
    questions: [
      {
        id: "1",
        prompt:
          "What helps you feel emotionally safe with your fiancé? What quickly erodes safety (tone, secrets, comparisons, withdrawal)?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt:
          "Are there trust repairs needed from your dating season? If yes, describe what healing would look like — without re-litigating every detail.",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "3",
        prompt:
          "What boundaries around phones, social media, and private friendships will protect your marriage?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s5-b",
    kind: "joint_discussion",
    title: "Activity B — Intimacy expectations",
    instructions:
      "About 25 minutes in a private setting. Speak with respect; avoid pressure. It is okay to say “we need more pastoral guidance on this.”",
    discussionPrompt:
      "How will we nurture emotional closeness weekly, and how will we honor God with physical intimacy in marriage?",
    questions: [
      {
        id: "1",
        prompt: "What is one non-sexual way you feel loved that you want your partner to remember?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt: "What purity or media boundary will you keep until the wedding and carry into marriage?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s5-c",
    kind: "scripture_reflection",
    title: "Activity C — Scripture reflection",
    instructions: "Read and reflect (about 15 minutes).",
    scriptureRefs: ["1 Corinthians 7:3–5", "Song of Solomon 8:6–7", "Hebrews 13:4"],
    questions: [
      {
        id: "1",
        prompt: "What does mutual responsibility in marriage mean to you in practical terms?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt: "How will you guard the marriage bed with honor in a culture that often mocks purity?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s5-d",
    kind: "curriculum_link",
    title: "Activity D — Curriculum",
    instructions: "Complete Intimacy and Trust modules in Marriage Prep.",
    moduleIds: ["mod-05-intimacy", "mod-09-trust"],
    questions: [],
  },
]);

export const PREMARITAL_AFTER_S6_ACTIVITIES: MarriageHomeworkActivityDef[] = enrichHomeworkActivities([
  {
    id: "s6-a",
    kind: "individual_writing",
    title: "Activity A — Spiritual rhythm",
    instructions: "Private reflection (about 20 minutes).",
    questions: [
      {
        id: "1",
        prompt:
          "How do you grow spiritually when you are alone (Scripture, prayer, church, music, service)? What drift happens when life gets busy?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt:
          "What work, study, or family obligation most threatens rest and Sabbath in your future household?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "3",
        prompt:
          "What cultural or church tradition from your background do you hope your marriage will carry forward?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s6-b",
    kind: "joint_discussion",
    title: "Activity B — Home vision",
    instructions: "About 30 minutes. Dream together without criticizing.",
    discussionPrompt:
      "What kind of spiritual atmosphere do we want in our home in the first year — even in a small apartment or shared space?",
    questions: [
      {
        id: "1",
        prompt: "What is one spiritual practice you will try together in the first 30 days of marriage?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt: "How will you protect rest when work or family pressure increases?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s6-c",
    kind: "scripture_reflection",
    title: "Activity C — Scripture reflection",
    instructions: "Read and reflect (about 15 minutes).",
    scriptureRefs: ["Joshua 24:15", "Colossians 3:23–24", "Deuteronomy 6:6–7"],
    questions: [
      {
        id: "1",
        prompt: "What does “as for me and my house, we will serve the Lord” require of you practically?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt: "Write a one-sentence vision for your home that honors both of your backgrounds.",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s6-d",
    kind: "curriculum_link",
    title: "Activity D — Curriculum",
    instructions: "Complete the Vision module; optional Culture/Work modules if your counselor assigned them.",
    moduleIds: ["mod-11-vision"],
    optionalModuleIds: ["mod-18-culture", "mod-15-work"],
    questions: [],
  },
]);

export const PREMARITAL_AFTER_S7_ACTIVITIES: MarriageHomeworkActivityDef[] = enrichHomeworkActivities([
  {
    id: "s7-a",
    kind: "individual_writing",
    title: "Activity A — Honest readiness",
    instructions:
      "Private reflection (about 25 minutes). This is for you and your counselor — not a pass/fail test.",
    questions: [
      {
        id: "1",
        prompt:
          "What concern about marriage still feels tender or unresolved? What would “ready enough to proceed with wisdom” look like?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt:
          "What strength in your partner do you most thank God for after this preparation season?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "3",
        prompt:
          "Who will you call first if the first month is harder than expected (mentor, pastor, counselor)?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s7-b",
    kind: "joint_discussion",
    title: "Activity B — Final alignment check",
    instructions: "About 25 minutes. Name gaps without panic.",
    discussionPrompt:
      "Is there anything we should bring back to our counselor before the wedding — with humility, not fear?",
    questions: [
      {
        id: "1",
        prompt: "What topic still needs a follow-up conversation or pastoral guidance?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt: "What commitment will you make to each other on wedding week when stress rises?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s7-c",
    kind: "scripture_reflection",
    title: "Activity C — Scripture reflection",
    instructions: "Read and reflect (about 10 minutes).",
    scriptureRefs: ["Ecclesiastes 4:12", "Philippians 1:6", "Proverbs 16:3"],
    questions: [
      {
        id: "1",
        prompt: "How does a threefold cord (you, partner, God) change how you face uncertainty?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s7-d",
    kind: "curriculum_link",
    title: "Activity D — Curriculum",
    instructions: "Complete the Readiness module before Session 8 if not finished.",
    moduleIds: ["mod-12-readiness"],
    optionalModuleIds: ["mod-16-addiction", "mod-17-grief"],
    questions: [],
  },
]);

export const PREMARITAL_AFTER_S8_ACTIVITIES: MarriageHomeworkActivityDef[] = enrichHomeworkActivities([
  {
    id: "s8-a",
    kind: "individual_writing",
    title: "Activity A — Letter of gratitude",
    instructions:
      "Private (about 20 minutes). Optional: seal and open on your first anniversary. Your partner does not see this unless you choose to share.",
    questions: [
      {
        id: "1",
        prompt:
          "Write a letter to your future spouse thanking them for who they are and what you have learned in preparation.",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "2",
        prompt: "What prayer do you want to keep praying for your marriage in year one?",
        responseKind: "long_text",
        visibility: "private",
      },
      {
        id: "3",
        prompt:
          "What is one habit from premarital preparation you do not want to lose after the wedding (prayer, dates, honesty, rest)?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s8-b",
    kind: "joint_discussion",
    title: "Activity B — First month plan",
    instructions: "About 20 minutes together after the wedding or during wedding week.",
    discussionPrompt:
      "What will we do in the first 30 days to protect friendship, rest, and spiritual rhythm — not only events and tasks?",
    questions: [
      {
        id: "1",
        prompt: "What is one date or rest practice you will protect in the first month?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s8-c",
    kind: "scripture_reflection",
    title: "Activity C — Scripture reflection",
    instructions: "Read and reflect together or individually.",
    scriptureRefs: ["Romans 12:10", "1 Peter 4:8"],
    questions: [
      {
        id: "1",
        prompt: "Choose one verse to memorize together in your first month. Which one and why?",
        responseKind: "long_text",
        visibility: "private",
      },
    ],
  },
  {
    id: "s8-d",
    kind: "curriculum_link",
    title: "Activity D — Curriculum (optional)",
    instructions: "Optional celebration module — a joyful capstone, not required for marriage.",
    moduleIds: ["mod-20-celebration"],
    optionalModuleIds: [],
    questions: [],
  },
]);
