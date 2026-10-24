import type { MarriageHomeworkActivityDef } from "@/lib/marriage-homework-types";
import type { WrittenQuestionGuidance } from "@/lib/marriage-written-question-guidance";
import { PREMARITAL_HOMEWORK_WRITTEN_GUIDANCE } from "@/lib/marriage-homework-written-guidance-premarital";

const WEEK1_HOMEWORK_WRITTEN_GUIDANCE: Record<string, WrittenQuestionGuidance> = {
  "activity-a:a1": {
    explanation: "Name three strengths with a brief sentence each—not a résumé. Your partner will not see this answer.",
    writingExamples: [
      "Patience when plans change",
      "Encouraging words when my partner feels down",
      "Organizing finances and schedules carefully",
      "Showing up reliably for church and family",
    ],
  },
  "activity-a:a2": {
    explanation: "Be honest about two growth areas—habits, attitudes, or patterns—not your whole personality.",
    writingExamples: [
      "Interrupting when I feel defensive",
      "Avoiding hard conversations until I explode",
      "Spending to cope with stress",
      "Being critical when I am tired",
    ],
  },
  "activity-a:a3": {
    explanation: "Reflect on your home growing up—what you want to keep and what you want to do differently.",
    writingExamples: [
      "Regular prayer—we want to keep that",
      "Yelling during conflict—we want a calmer pattern",
      "Hospitality on Sundays",
      "Silent treatment—we want open repair instead",
    ],
  },
  "activity-a:a4": {
    explanation: "Describe your typical response when hurt—only share an example if you feel comfortable.",
    writingExamples: [
      "I withdraw and need space before talking",
      "I want to fix the problem immediately",
      "I raise my voice then apologize later",
      "I send a long text instead of speaking in person",
    ],
  },
  "activity-a:a5": {
    explanation: "Describe character and habits you want to grow over five years—not perfection.",
    writingExamples: [
      "A spouse who listens before advising",
      "Consistent prayer and Scripture rhythm",
      "Healthy boundaries with work and phone use",
      "Generosity and patience with extended family",
    ],
  },
  "activity-b:b1": {
    explanation: "After your discussion, name three values—not a full mission statement.",
    writingExamples: ["Peace", "Hospitality", "Integrity", "Faith", "Joy", "Service"],
  },
  "activity-b:b2": {
    explanation: "Note what surprised you or clarified during your conversation—your partner’s view, not yours alone.",
    writingExamples: [
      "My partner cares deeply about financial stability",
      "They want our home to feel welcoming to guests",
      "They need quiet time to recharge after work",
      "They hope we prioritize church community",
    ],
  },
  "activity-b:b3": {
    explanation: "One small, realistic step you can take this month toward your shared vision.",
    writingExamples: [
      "Host one meal for friends from church",
      "Set a weekly budget check-in",
      "Create a phone-free hour after work",
      "Pray together twice this week",
    ],
  },
  "activity-c:c1": {
    explanation: "Describe oneness as daily partnership—not only the wedding day.",
    writingExamples: [
      "Shared decisions and transparency",
      "Choosing each other in ordinary moments",
      "Spiritual unity through prayer",
      "Serving each other’s growth, not competition",
    ],
  },
  "activity-c:c2": {
    explanation: "Pick one principle from the passages that you want to live out practically.",
    writingExamples: [
      "Building with wisdom, not hurry (Proverbs 24)",
      "Partnership and mutual help (Genesis 2)",
      "Protecting rest and rhythm in our home",
      "Honoring God in how we speak to each other",
    ],
  },
  "activity-c:c3": {
    explanation: "Name an area where you want more wisdom—communication, family, faith, finances, etc.",
    writingExamples: [
      "Handling conflict without shutting down",
      "Balancing time with in-laws",
      "Aligning on spending and giving",
      "Growing in prayer together",
    ],
  },
};

const HOMEWORK_WRITTEN_GUIDANCE: Record<string, WrittenQuestionGuidance> = {
  ...WEEK1_HOMEWORK_WRITTEN_GUIDANCE,
  ...PREMARITAL_HOMEWORK_WRITTEN_GUIDANCE,
};

export function allHomeworkWrittenGuidanceKeys(): string[] {
  return Object.keys(HOMEWORK_WRITTEN_GUIDANCE);
}

export function enrichHomeworkActivities(
  activities: MarriageHomeworkActivityDef[],
): MarriageHomeworkActivityDef[] {
  return activities.map((activity) => ({
    ...activity,
    questions: activity.questions.map((q) => {
      const guide = HOMEWORK_WRITTEN_GUIDANCE[`${activity.id}:${q.id}`];
      if (!guide) return q;
      return {
        ...q,
        explanation: guide.explanation,
        writingExamples: guide.writingExamples,
      };
    }),
  }));
}
