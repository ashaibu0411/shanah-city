import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { lesson, likertBank, q, scenarioBank } from "@/lib/marriage-stage2-content/builders";

const MODULE_ID = "s2-mod-03-communication";

export function buildMod03CommunicationModule(): MarriageModuleDefinition {
  const lessons = [
    lesson("m03-l01", "Emotional connection basics", "Safety, respect, and curiosity.", "learn", 1, {
      learnContent:
        "Healthy communication is not winning an argument — it is helping your spouse feel known. You will answer privately first, then compare only what is marked shared.",
    }),
    lesson("m03-l02", "What I heard vs what you meant", "Practice reflecting before responding.", "practice", 2),
    lesson("m03-l03", "Help me feel heard", "Validation and requests.", "answer", 3),
    lesson("m03-l04", "Under stress", "How you respond when pressure rises.", "answer", 4),
    lesson("m03-l05", "Emotional needs", "Naming needs without demands.", "reflect", 5),
    lesson("m03-l06", "Listening without defending", "Receiving feedback.", "practice", 6),
    lesson("m03-l07", "Apologies & reconciliation", "Repair that rebuilds trust.", "agree", 7),
  ];

  const heardMeant = [
    q(MODULE_ID, "m03-heard-topic", "Pick a recent low-stakes topic you discussed (e.g., plans, chores). Briefly what you said:", "short_answer", "private_reflection", {
      lessonId: "m03-l02",
      journeyStage: "reflect",
    }),
    q(MODULE_ID, "m03-heard-partner", "What you believe your partner heard you say:", "long_reflection", "shared_after_both_submit", {
      lessonId: "m03-l02",
      journeyStage: "discuss",
      required: true,
    }),
    q(MODULE_ID, "m03-meant-self", "What you actually meant (your words):", "long_reflection", "shared_after_both_submit", {
      lessonId: "m03-l02",
      journeyStage: "answer",
      required: true,
    }),
  ];

  const feelHeard = likertBank(MODULE_ID, "m03-l03", "m03-hfh", [
    "When I share feelings, I need my spouse to pause their agenda and listen.",
    "Saying ‘I understand’ matters less than asking a curious question.",
    "Touch on the shoulder helps me stay in a hard conversation.",
    "I need time limits on heavy talks so I do not shut down.",
    "Being told I am ‘too sensitive’ makes me withdraw.",
    "I feel heard when my spouse repeats back what they heard.",
    "I prefer written notes before a face-to-face talk about conflict.",
    "Praise in public and correction in private fits me best.",
  ], { requiredIndexes: [0, 5] });

  const stress = likertBank(MODULE_ID, "m03-l04", "m03-str", [
    "When stressed, I speak more sharply than I intend.",
    "When stressed, I go quiet and seem distant.",
    "I need space before discussing a problem after work.",
    "I want immediate connection when I walk in the door.",
    "Sarcasm is my stress language.",
    "I multitask while listening when overwhelmed.",
    "I forget to ask how my spouse’s day was.",
    "Physical symptoms (headache, fatigue) show my stress first.",
    "I want solutions; my spouse wants empathy first.",
    "I can name ‘I am flooded’ and pause respectfully.",
  ], { requiredIndexes: [8, 9] });

  const needs = likertBank(MODULE_ID, "m03-l05", "m03-need", [
    "I need regular affirmation, not only on special days.",
    "I need predictability in plans to feel secure.",
    "I need adventure and novelty to feel alive.",
    "I need help with tasks more than verbal praise.",
    "I need prayer together when anxious.",
    "I need respect for my time and calendar.",
    "I need forgiveness quickly after repair attempts.",
    "I need patience when processing slowly.",
  ]);

  const listen = scenarioBank(MODULE_ID, "m03-l06", "m03-lsn", [
    {
      prompt: "Your spouse says: ‘You never listen.’ Your best first response?",
      options: [
        { id: "a", label: "Defend with examples of when you did listen" },
        { id: "b", label: "Ask: ‘Help me understand the last time you felt unheard.’" },
        { id: "c", label: "Stay silent until they calm down" },
        { id: "d", label: "Change the subject to something positive" },
      ],
    },
    {
      prompt: "You receive criticism about your tone. You feel unfairly judged.",
      options: [
        { id: "a", label: "Point out their tone too" },
        { id: "b", label: "Say: ‘I want to hear you — give me a minute to settle.’" },
        { id: "c", label: "Leave the room without explanation" },
        { id: "d", label: "Apologize for everything to end the talk" },
      ],
    },
    {
      prompt: "A text message was misread and hurt feelings followed.",
      options: [
        { id: "a", label: "Continue debating over text" },
        { id: "b", label: "Call or meet to clarify tone and intent" },
        { id: "c", label: "Wait days until it blows over" },
        { id: "d", label: "Ask a friend to interpret" },
      ],
    },
  ]);

  const apology = [
    q(MODULE_ID, "m03-sorry-good", "Describe an apology that felt sincere to you (from anyone).", "long_reflection", "shared_after_both_submit", {
      lessonId: "m03-l07",
      journeyStage: "discuss",
    }),
    q(MODULE_ID, "m03-repair-step", "One repair step we will use after misunderstandings:", "short_answer", "shared_after_both_submit", {
      lessonId: "m03-l07",
      journeyStage: "agree",
      required: true,
    }),
  ];

  const drills = Array.from({ length: 20 }, (_, i) =>
    q(
      MODULE_ID,
      `m03-drill-${i + 1}`,
      [
        "I can stay curious when I disagree.",
        "I avoid interrupting when my spouse is mid-sentence.",
        "I ask clarifying questions before assuming motive.",
        "I notice body language as part of communication.",
        "I can say ‘tell me more’ instead of ‘that is wrong.’",
        "I welcome feedback about my tone.",
        "I do not bring up past resolved issues in new fights.",
        "I can pause a talk and schedule a return time.",
        "I express gratitude daily in specific words.",
        "I avoid comparing our marriage to others out loud.",
        "I can receive ‘no’ without punishing silence.",
        "I share vulnerabilities without blaming.",
        "I respect different processing speeds.",
        "I can laugh together after repair.",
        "I limit serious talks when tired or hungry.",
        "I use ‘I feel’ statements more than ‘you always.’",
        "I seek understanding before agreement.",
        "I can pray together after hard conversations.",
        "I notice when my spouse bids for connection.",
        "I respond to bids even when busy.",
      ][i]!,
      "likert",
      "shared_after_both_submit",
      { lessonId: "m03-l03", journeyStage: "answer", options: [
        { id: "1", label: "Strongly disagree" },
        { id: "2", label: "Disagree" },
        { id: "3", label: "Neutral" },
        { id: "4", label: "Agree" },
        { id: "5", label: "Strongly agree" },
      ] },
    ),
  );

  const privateReflect = [
    q(MODULE_ID, "m03-private-trigger", "Private: What tone or phrase shuts you down fastest?", "long_reflection", "private_reflection", {
      lessonId: "m03-l04",
      journeyStage: "reflect",
    }),
    q(MODULE_ID, "m03-private-need", "Private: What do you need when you feel unheard?", "long_reflection", "private_reflection", {
      lessonId: "m03-l05",
      journeyStage: "reflect",
    }),
    q(MODULE_ID, "m03-private-apology", "Private: What makes an apology feel incomplete to you?", "long_reflection", "private_reflection", {
      lessonId: "m03-l07",
      journeyStage: "reflect",
    }),
  ];

  const closing = q(
    MODULE_ID,
    "m03-closing-agree",
    "We will use ‘What I heard you say is…’ before responding in our next hard conversation.",
    "agreement",
    "shared_after_both_submit",
    {
      lessonId: "m03-l07",
      journeyStage: "agree",
      required: true,
      options: [
        { id: "1", label: "Strongly disagree" },
        { id: "2", label: "Disagree" },
        { id: "3", label: "We partly agree" },
        { id: "4", label: "Agree" },
        { id: "5", label: "Strongly agree" },
      ],
    },
  );

  const questions = [...heardMeant, ...feelHeard, ...stress, ...needs, ...listen, ...apology, ...drills, ...privateReflect, closing];

  return {
    id: MODULE_ID,
    title: "Communication & emotional connection",
    summary: "Listening, validation, stress responses, repair, and ‘what I heard vs what you meant.’",
    sortOrder: 103,
    programTypes: ["premarital", "enrichment", "guided"],
    lessons,
    meta: { stage2Section: "talk", activityKind: "conversation_card", estimatedMinutes: 80 },
    questions,
  };
}
