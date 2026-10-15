import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { lesson, likertBank, q } from "@/lib/marriage-stage2-content/builders";

const MODULE_ID = "s2-temperament-discovery";

const LESSONS = [
  lesson(
    "m01-l01-learn",
    "Why temperament matters in marriage",
    "Strengths-focused discovery — not a diagnosis or compatibility score.",
    "learn",
    1,
    {
      estimatedMinutes: 8,
      learnContent:
        "God made you with distinct rhythms: how you recharge, how you argue, how you show love. This module helps you name those patterns so you can serve one another — not label each other. Work one lesson at a time; save and return anytime.",
    },
  ),
  lesson(
    "m01-l02-social",
    "Social energy & alone time",
    "Introversion, extroversion, and what restores you after a busy week.",
    "answer",
    2,
    { estimatedMinutes: 12 },
  ),
  lesson(
    "m01-l03-emotion",
    "Emotions & inner life",
    "How you notice feelings, express them, and need support.",
    "answer",
    3,
    { estimatedMinutes: 12 },
  ),
  lesson(
    "m01-l04-comm",
    "Communication preferences",
    "Timing, depth, humor, and how you prefer hard conversations.",
    "answer",
    4,
    { estimatedMinutes: 14 },
  ),
  lesson(
    "m01-l05-decide",
    "Decisions & planning",
    "Pace, research, risk, and who needs the last word.",
    "answer",
    5,
    { estimatedMinutes: 10 },
  ),
  lesson(
    "m01-l06-conflict",
    "Stress, conflict & repair",
    "Space, volume, sarcasm, and returning after disagreement.",
    "answer",
    6,
    { estimatedMinutes: 14 },
  ),
  lesson(
    "m01-l07-order",
    "Organization & daily rhythms",
    "Schedules, clutter, punctuality, and spontaneity.",
    "answer",
    7,
    { estimatedMinutes: 10 },
  ),
  lesson(
    "m01-l08-affection",
    "Affection & closeness",
    "Touch, words, quality time, and feeling pursued.",
    "reflect",
    8,
    { estimatedMinutes: 12 },
  ),
  lesson(
    "m01-l09-predict",
    "Partner predictions",
    "Guess how your partner experiences a few key areas — then compare gently.",
    "practice",
    9,
    { estimatedMinutes: 10 },
  ),
  lesson(
    "m01-l10-agree",
    "Practice, agree & review",
    "Homework and one joint commitment for the next two weeks.",
    "agree",
    10,
    { estimatedMinutes: 10 },
  ),
];

const socialPrompts = [
  "After a full day of people and noise, I need quiet before I can connect well at home.",
  "Hosting friends or family energizes me more than it drains me.",
  "On weekends I prefer one social outing rather than filling every slot.",
  "I am comfortable being the center of attention in a group.",
  "When my spouse wants alone time, I usually take it personally at first.",
  "Large church gatherings feel life-giving rather than overwhelming.",
  "I can be ‘on’ socially even when I am tired, but I pay for it later.",
  "I need advance notice before we commit to social plans.",
  "I enjoy meeting new people at events; small talk comes easily.",
  "After conflict, I prefer talking with a close friend before talking with my spouse.",
];

const emotionPrompts = [
  "I can usually name what I am feeling while it is happening.",
  "When I am hurt, I show it before I can explain it in words.",
  "I need my spouse to ask how I am feeling rather than assume.",
  "Strong emotions make me want to withdraw until I settle.",
  "I express appreciation easily and often.",
  "Criticism lands heavily even when it is kindly worded.",
  "I process feelings by writing, praying, or walking — not always by talking.",
  "When my partner is upset, my first instinct is to fix the problem.",
  "I am comfortable crying in front of my spouse.",
  "I sometimes need a day before I know how I feel about a conflict.",
];

const commPrompts = [
  "I prefer to discuss important topics in the evening when the day is done.",
  "I need eye contact and minimal distractions for serious talks.",
  "Humor helps me stay engaged in long conversations.",
  "If a talk goes past 45 minutes, I lose focus unless we pause.",
  "I want the main point stated early, then details.",
  "Silence in conversation feels awkward to me rather than peaceful.",
  "Text messages are fine for logistics but not for emotional topics.",
  "I need reassurance during hard talks that we are still on the same team.",
  "I prefer to finish one topic before starting another.",
  "When I am overwhelmed, I say less — not more.",
];

const decidePrompts = [
  "Once I have enough information, I prefer to decide quickly.",
  "Major purchases should involve research and a waiting period.",
  "I am comfortable changing plans when new information appears.",
  "I feel stressed when decisions are left open-ended for weeks.",
  "I prefer my spouse to take the lead on decisions in their areas of strength.",
  "Risk-taking excites me more than it worries me.",
  "I need to talk through options out loud before choosing.",
  "I would rather try something imperfectly than wait for the perfect plan.",
];

const conflictPrompts = [
  "During an argument I need physical space before continuing.",
  "Raised voices shut me down quickly.",
  "I remember tone of voice longer than the words spoken.",
  "Sarcasm during conflict feels especially hurtful to me.",
  "I can return to a topic calmly within the same day after a break.",
  "I prefer to resolve conflict before going to sleep.",
  "When stressed about work, I bring it home unless I intentionally pause.",
  "I need an apology to include acknowledgment of how I felt, not only facts.",
  "I sometimes avoid conflict until it builds up.",
  "After repair, I need affection or reassurance to feel secure again.",
];

const orderPrompts = [
  "A tidy shared space helps me feel peaceful at home.",
  "I am comfortable with last-minute changes to our schedule.",
  "Being on time matters to me as a sign of respect.",
  "Lists and calendars reduce my anxiety about the week ahead.",
  "I can live with clutter in some rooms if other priorities are met.",
  "Spontaneous adventures feel more meaningful than planned ones.",
  "I prefer dividing chores by skill, not by tradition.",
  "When plans change without notice, I feel disrespected.",
];

const affectionPrompts = [
  "Non-sexual touch during the day helps me feel connected.",
  "Hearing ‘I love you’ matters as much as practical acts of service.",
  "I feel closest when we have uninterrupted time without screens.",
  "Small surprises (notes, treats) mean a lot to me.",
  "I need initiation from my spouse, not only response.",
  "Public affection (holding hands) feels natural to me.",
  "When we are distant emotionally, physical closeness feels harder.",
  "Affirming my strengths encourages me more than generic praise.",
];

export function buildMod01TemperamentModule(): MarriageModuleDefinition {
  const questions = [
    q(
      MODULE_ID,
      "m01-reflect-hopes",
      "What do you hope this temperament journey will help your marriage do differently? (Private)",
      "long_reflection",
      "private_reflection",
      { lessonId: "m01-l01-learn", journeyStage: "reflect", allowSkip: true },
    ),
    q(
      MODULE_ID,
      "m01-learn-framework",
      "Optional: Which temperament description feels most familiar as a learning tool (not a label)?",
      "single_choice",
      "private_reflection",
      {
        lessonId: "m01-l01-learn",
        journeyStage: "learn",
        allowSkip: true,
        options: [
          { id: "skip", label: "Prefer not to use frameworks" },
          { id: "sanguine", label: "Expressive, people-oriented" },
          { id: "choleric", label: "Direct, goal-oriented" },
          { id: "melancholic", label: "Thoughtful, detail-minded" },
          { id: "phlegmatic", label: "Steady, peace-seeking" },
        ],
        explanation: "Educational only — not clinical assessment.",
      },
    ),
    ...likertBank(MODULE_ID, "m01-l02-social", "m01-soc", socialPrompts, {
      temperamentDimension: "social_energy",
      requiredIndexes: [0, 2],
    }),
    ...likertBank(MODULE_ID, "m01-l03-emotion", "m01-emo", emotionPrompts, {
      temperamentDimension: "emotional_style",
      requiredIndexes: [0, 4],
    }),
    ...likertBank(MODULE_ID, "m01-l04-comm", "m01-com", commPrompts, {
      temperamentDimension: "communication",
      requiredIndexes: [0, 9],
    }),
    ...likertBank(MODULE_ID, "m01-l05-decide", "m01-dec", decidePrompts, {
      temperamentDimension: "decisions",
      requiredIndexes: [0, 3],
    }),
    ...likertBank(MODULE_ID, "m01-l06-conflict", "m01-con", conflictPrompts, {
      temperamentDimension: "conflict_stress",
      requiredIndexes: [0, 5],
    }),
    ...likertBank(MODULE_ID, "m01-l07-order", "m01-ord", orderPrompts, {
      temperamentDimension: "organization",
      requiredIndexes: [0, 3],
    }),
    ...likertBank(MODULE_ID, "m01-l08-affection", "m01-aff", affectionPrompts, {
      temperamentDimension: "affection",
      requiredIndexes: [0, 2],
    }),
    q(
      MODULE_ID,
      "m01-private-childhood",
      "What is one pattern from childhood you want Christ to heal or redeem in your marriage? (Private)",
      "long_reflection",
      "private_reflection",
      { lessonId: "m01-l03-emotion", journeyStage: "reflect" },
    ),
    q(
      MODULE_ID,
      "m01-rank-recharge",
      "Rank what most restores you after a draining week (top = most restoring).",
      "ranking",
      "shared_after_both_submit",
      {
        lessonId: "m01-l02-social",
        journeyStage: "practice",
        options: [
          { id: "alone", label: "Quiet time alone" },
          { id: "spouse", label: "One-on-one time with my spouse" },
          { id: "friends", label: "Time with close friends" },
          { id: "worship", label: "Worship / prayer" },
          { id: "outdoors", label: "Outdoors or exercise" },
          { id: "family", label: "Extended family time" },
        ],
      },
    ),
    q(
      MODULE_ID,
      "m01-predict-soc-core",
      "Before comparing: how strongly do you think your partner agrees with this? — “After a full day of people, I need quiet before I connect well at home.”",
      "partner_prediction",
      "shared_after_both_submit",
      {
        lessonId: "m01-l09-predict",
        journeyStage: "practice",
        predictionTargetQuestionId: "m01-soc-1",
        options: [
          { id: "1", label: "Strongly disagree" },
          { id: "2", label: "Disagree" },
          { id: "3", label: "Neutral" },
          { id: "4", label: "Agree" },
          { id: "5", label: "Strongly agree" },
        ],
      },
    ),
    q(
      MODULE_ID,
      "m01-predict-emo-core",
      "How strongly do you think your partner agrees? — “I can usually name what I am feeling while it is happening.”",
      "partner_prediction",
      "shared_after_both_submit",
      {
        lessonId: "m01-l09-predict",
        journeyStage: "practice",
        predictionTargetQuestionId: "m01-emo-1",
        options: [
          { id: "1", label: "Strongly disagree" },
          { id: "2", label: "Disagree" },
          { id: "3", label: "Neutral" },
          { id: "4", label: "Agree" },
          { id: "5", label: "Strongly agree" },
        ],
      },
    ),
    q(
      MODULE_ID,
      "m01-predict-con-core",
      "How strongly do you think your partner agrees? — “During an argument I need physical space before continuing.”",
      "partner_prediction",
      "shared_after_both_submit",
      {
        lessonId: "m01-l09-predict",
        journeyStage: "practice",
        predictionTargetQuestionId: "m01-con-1",
        options: [
          { id: "1", label: "Strongly disagree" },
          { id: "2", label: "Disagree" },
          { id: "3", label: "Neutral" },
          { id: "4", label: "Agree" },
          { id: "5", label: "Strongly agree" },
        ],
      },
    ),
    q(
      MODULE_ID,
      "m01-predict-dec-core",
      "How strongly do you think your partner agrees? — “Once I have enough information, I prefer to decide quickly.”",
      "partner_prediction",
      "shared_after_both_submit",
      {
        lessonId: "m01-l09-predict",
        journeyStage: "practice",
        predictionTargetQuestionId: "m01-dec-1",
        options: [
          { id: "1", label: "Strongly disagree" },
          { id: "2", label: "Disagree" },
          { id: "3", label: "Neutral" },
          { id: "4", label: "Agree" },
          { id: "5", label: "Strongly agree" },
        ],
      },
    ),
    q(
      MODULE_ID,
      "m01-predict-aff-core",
      "How strongly do you think your partner agrees? — “Non-sexual touch during the day helps me feel connected.”",
      "partner_prediction",
      "shared_after_both_submit",
      {
        lessonId: "m01-l09-predict",
        journeyStage: "practice",
        predictionTargetQuestionId: "m01-aff-1",
        options: [
          { id: "1", label: "Strongly disagree" },
          { id: "2", label: "Disagree" },
          { id: "3", label: "Neutral" },
          { id: "4", label: "Agree" },
          { id: "5", label: "Strongly agree" },
        ],
      },
    ),
    q(
      MODULE_ID,
      "m01-predict-discuss",
      "Where were you most surprised by your partner’s actual answer vs your prediction? (Shared after both submit)",
      "long_reflection",
      "shared_after_both_submit",
      { lessonId: "m01-l09-predict", journeyStage: "discuss", required: true },
    ),
    q(
      MODULE_ID,
      "m01-homework",
      "Practical homework: one specific way you will honor your partner’s rhythm this week.",
      "short_answer",
      "shared_after_both_submit",
      { lessonId: "m01-l10-agree", journeyStage: "practice", required: true },
    ),
    q(
      MODULE_ID,
      "m01-joint-agreement",
      "Joint agreement: When we feel misunderstood, we will pause and use this phrase or action:",
      "short_answer",
      "shared_after_both_submit",
      { lessonId: "m01-l10-agree", journeyStage: "agree", required: true },
    ),
    q(
      MODULE_ID,
      "m01-review-private",
      "Private review: What strength in your partner’s temperament do you want to thank God for?",
      "long_reflection",
      "private_reflection",
      { lessonId: "m01-l10-agree", journeyStage: "review", allowSkip: true },
    ),
  ];

  return {
    id: MODULE_ID,
    title: "Personality & temperament discovery",
    summary:
      "Explore social energy, emotions, communication, decisions, conflict, organization, and affection — strengths-focused, not a diagnosis.",
    sortOrder: 101,
    programTypes: ["premarital", "enrichment", "guided"],
    lessons: LESSONS,
    meta: {
      biblicalReflection: "God knit you together with purpose (Psalm 139). Differences can serve unity in Christ.",
      pastoralGuide: "Avoid labeling; celebrate gifts and name growth areas gently.",
      stage2Section: "discover",
      activityKind: "assessment",
      estimatedMinutes: 90,
    },
    questions,
  };
}
