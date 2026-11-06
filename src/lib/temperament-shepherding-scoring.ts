import { questionsForKind } from "@/lib/temperament-shepherding-content";
import type {
  ClassicalTemperament,
  TemperamentAnswersMap,
  TemperamentDimension,
  TemperamentDimensionScores,
  TemperamentProfilePayload,
  TemperamentClassicalScores,
  TemperamentLeadershipReflection,
} from "@/lib/temperament-shepherding-types";

const DIMENSIONS: TemperamentDimension[] = [
  "communication",
  "leadership_initiative",
  "collaboration",
  "emotional_expression",
  "conflict_response",
  "feedback_correction",
  "structure",
  "pace_decisions",
  "service_motivation",
];

const LIKERT_MIN = 1;
const LIKERT_MAX = 5;

function clampLikert(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const n = Math.round(value);
  if (n < LIKERT_MIN || n > LIKERT_MAX) return null;
  return n;
}

function normalizeScores(
  scores: Record<string, number>,
  keys: string[],
  capPerKey: number,
): Record<string, number> {
  const total = keys.reduce((sum, k) => sum + Math.max(0, scores[k] ?? 0), 0);
  const norm: Record<string, number> = {};
  if (total <= 0) {
    for (const k of keys) norm[k] = 0;
    return norm;
  }
  for (const k of keys) {
    norm[k] = ((scores[k] ?? 0) / total) * capPerKey;
  }
  return norm;
}

export function computeClassicalScores(
  answers: TemperamentAnswersMap,
  kind: "member" | "leader",
): TemperamentClassicalScores {
  const questions = questionsForKind(kind);
  const raw: Record<ClassicalTemperament, number> = {
    sanguine: 0,
    choleric: 0,
    melancholic: 0,
    phlegmatic: 0,
  };

  for (const q of questions) {
    const a = clampLikert(answers[q.id] ?? NaN);
    if (a === null) continue;
    const centered = a - 3;
    for (const t of Object.keys(q.classicalHint) as ClassicalTemperament[]) {
      const wv = q.classicalHint[t] ?? 0;
      raw[t] += centered * wv;
    }
  }

  const keys: ClassicalTemperament[] = ["sanguine", "choleric", "melancholic", "phlegmatic"];
  const nonNegative = {} as Record<string, number>;
  for (const k of keys) {
    nonNegative[k] = Math.max(0, raw[k]);
  }
  const scaled = normalizeScores(nonNegative, keys as string[], 100);
  return scaled as TemperamentClassicalScores;
}

export function computeDimensionScores(
  answers: TemperamentAnswersMap,
  kind: "member" | "leader",
): TemperamentDimensionScores {
  const questions = questionsForKind(kind);
  const sums: Partial<Record<TemperamentDimension, number>> = {};
  const counts: Partial<Record<TemperamentDimension, number>> = {};

  for (const q of questions) {
    const a = clampLikert(answers[q.id] ?? NaN);
    if (a === null) continue;
    sums[q.dimension] = (sums[q.dimension] ?? 0) + a;
    counts[q.dimension] = (counts[q.dimension] ?? 0) + 1;
  }

  const out: TemperamentDimensionScores = {} as TemperamentDimensionScores;
  for (const d of DIMENSIONS) {
    const c = counts[d] ?? 0;
    if (c === 0) {
      out[d] = 0;
    } else {
      const avg = (sums[d] ?? 0) / c;
      out[d] = Math.round(((avg - LIKERT_MIN) / (LIKERT_MAX - LIKERT_MIN)) * 100);
    }
  }
  return out;
}

export function dominantClassical(classical: TemperamentClassicalScores): {
  primary: ClassicalTemperament;
  secondary: ClassicalTemperament | null;
} {
  const entries = (Object.keys(classical) as ClassicalTemperament[])
    .map((k) => [k, classical[k]] as const)
    .sort((a, b) => b[1] - a[1]);
  const primary = entries[0][0];
  const top = entries[0][1];
  const second = entries[1][1];
  const secondary = top > 0 && second > 0 && top - second < 12 ? entries[1][0] : null;
  return { primary, secondary };
}

function labelForDimensionScore(score0to100: number): "lower" | "moderate" | "higher" {
  if (score0to100 < 38) return "lower";
  if (score0to100 > 62) return "higher";
  return "moderate";
}

function copyGuidance(primary: ClassicalTemperament): {
  strengthsTeamwork: string[];
  growthAreas: string[];
  communicationTips: string[];
  feedbackTips: string[];
  underPressure: string[];
  disagreementTips: string[];
  serveEffectively: string[];
  reflectionPrompts: string[];
} {
  const g: Record<
    ClassicalTemperament,
    {
      strengthsTeamwork: string[];
      growthAreas: string[];
      communicationTips: string[];
      feedbackTips: string[];
      underPressure: string[];
      disagreementTips: string[];
      serveEffectively: string[];
      reflectionPrompts: string[];
    }
  > = {
    sanguine: {
      strengthsTeamwork: [
        "Often helps teams feel welcomed and energized.",
        "Brings warmth and encouragement in collaborative moments.",
      ],
      growthAreas: [
        "Follow-through on details when excitement fades.",
        "Clarify commitments so enthusiasm doesn’t create confusion.",
      ],
      communicationTips: [
        "Prefer face-to-face or quick voice notes for important updates.",
        "Ask for a short recap in writing after lively discussions.",
      ],
      feedbackTips: [
        "Receive coaching best when trust is clear and tone is respectful.",
        "Benefit from one improvement at a time with encouragement alongside it.",
      ],
      underPressure: [
        "May talk through stress or seek connection to regain steadiness.",
        "Can overlook details—pair with structure or check-ins.",
      ],
      disagreementTips: [
        "Affirm intent first, then name the specific behavior or impact.",
        "Offer a private check-in if the conversation gets heated.",
      ],
      serveEffectively: [
        "Use greeting/hosting strengths with a simple preparation rhythm.",
        "Pair with a detail partner for set-up and communication handoffs.",
      ],
      reflectionPrompts: [
        "Where is God inviting me to grow in faithful follow-through?",
        "Who on my team benefits from my encouragement this month?",
      ],
    },
    choleric: {
      strengthsTeamwork: [
        "Moves initiatives forward with clarity and urgency.",
        "Helps teams solve problems and make decisions.",
      ],
      growthAreas: [
        "Slow down enough for quieter voices to be heard.",
        "Soften tone when urgency feels like pressure to others.",
      ],
      communicationTips: [
        "Start with purpose, then invite questions before driving to action.",
        "Use direct language, but add appreciation for prior effort.",
      ],
      feedbackTips: [
        "Prefer concise feedback with clear next steps.",
        "May need reminders that relationship trust matters as much as results.",
      ],
      underPressure: [
        "Becomes more task-focused; watch for unintentional sharpness.",
        "Benefits from naming stress briefly before deciding next steps.",
      ],
      disagreementTips: [
        "Separate the issue from the person; ask what “good” looks like.",
        "Schedule a debrief if the pace caused relational friction.",
      ],
      serveEffectively: [
        "Channel initiative into repeatable systems the team can sustain.",
        "Delegate with explicit authority, deadlines, and check-in points.",
      ],
      reflectionPrompts: [
        "Where can I invite collaboration earlier next time?",
        "How can I show care while still moving with urgency?",
      ],
    },
    melancholic: {
      strengthsTeamwork: [
        "Brings thoughtfulness, preparation, and quality awareness.",
        "Notices risks and details others may miss.",
      ],
      growthAreas: [
        "Avoid perfectionism delays; choose ‘faithful enough’ for the moment.",
        "Share concerns earlier so issues don’t compound quietly.",
      ],
      communicationTips: [
        "Prefer written agendas and time to prepare responses.",
        "Ask clarifying questions before assuming motives.",
      ],
      feedbackTips: [
        "Best received with specifics, context, and a collaborative tone.",
        "Helpful to know expectations and definitions of “done.”",
      ],
      underPressure: [
        "May withdraw to process; invite gentle check-ins without rushing.",
        "Can over-internalize; name emotions with a trusted leader.",
      ],
      disagreementTips: [
        "Use calm, factual language; avoid long tension in public settings.",
        "Confirm understanding before moving to solutions.",
      ],
      serveEffectively: [
        "Use planning strengths for rehearsals, communications, and follow-up.",
        "Partner with an initiator for momentum and timely decisions.",
      ],
      reflectionPrompts: [
        "What fear might be driving my hesitation today?",
        "What small step would honor excellence without locking me in anxiety?",
      ],
    },
    phlegmatic: {
      strengthsTeamwork: [
        "Stabilizes teams with patience and steady presence.",
        "Often reduces unnecessary conflict and listens well.",
      ],
      growthAreas: [
        "Initiate sooner when silence could be mistaken for agreement.",
        "Name limits clearly to protect sustainable serving.",
      ],
      communicationTips: [
        "Prefer calm, predictable communication rhythms.",
        "Appreciate private conversation before public correction.",
      ],
      feedbackTips: [
        "Receives coaching best with gentleness and time to respond.",
        "Benefit from written summaries after verbal feedback.",
      ],
      underPressure: [
        "May go quiet to keep peace; needs safety to speak honestly.",
        "Can delay hard conversations; plan a specific follow-up time.",
      ],
      disagreementTips: [
        "Invite perspective with curiosity; avoid rushed conclusions.",
        "Affirm care for relationship while addressing the issue clearly.",
      ],
      serveEffectively: [
        "Serve sustainably by pairing steady roles with clear boundaries.",
        "Offer relational insight in debriefs and team health conversations.",
      ],
      reflectionPrompts: [
        "Where do I need to speak up sooner for the team’s good?",
        "What boundary would help me serve with joy this season?",
      ],
    },
  };
  return g[primary];
}

export function buildMemberProfilePayload(args: {
  classical: TemperamentClassicalScores;
  dimensions: TemperamentDimensionScores;
}): TemperamentProfilePayload {
  const { primary, secondary } = dominantClassical(args.classical);
  const guidance = copyGuidance(primary);
  const dimNarrative: Record<TemperamentDimension, { label: string; score: number; note: string }> = {
    communication: {
      label: "Communication",
      score: args.dimensions.communication,
      note:
        labelForDimensionScore(args.dimensions.communication) === "higher"
          ? "You tend toward expressive, relational, or direct communication—clarify format preferences with teammates."
          : labelForDimensionScore(args.dimensions.communication) === "lower"
            ? "You may prefer thoughtful, written, or quieter communication—ask leaders for predictable rhythms."
            : "You show a balanced mix—flexibility is a strength when clarified.",
    },
    leadership_initiative: {
      label: "Leadership & initiative",
      score: args.dimensions.leadership_initiative,
      note:
        labelForDimensionScore(args.dimensions.leadership_initiative) === "higher"
          ? "You often step forward—invite others in and delegate clearly."
          : labelForDimensionScore(args.dimensions.leadership_initiative) === "lower"
            ? "You may prefer supporting roles—speak up early when you see a gap."
            : "You balance leading and supporting—clarify ownership on shared tasks.",
    },
    collaboration: {
      label: "Collaboration & teamwork",
      score: args.dimensions.collaboration,
      note:
        labelForDimensionScore(args.dimensions.collaboration) === "higher"
          ? "You thrive with people—pair with structure to protect follow-through."
          : labelForDimensionScore(args.dimensions.collaboration) === "lower"
            ? "You may prefer small trusted circles—name what helps you engage."
            : "You collaborate flexibly—define expectations to reduce assumptions.",
    },
    emotional_expression: {
      label: "Emotional expression",
      score: args.dimensions.emotional_expression,
      note:
        labelForDimensionScore(args.dimensions.emotional_expression) === "higher"
          ? "You process outwardly—name boundaries when you need quiet focus."
          : labelForDimensionScore(args.dimensions.emotional_expression) === "lower"
            ? "You may process internally—let leaders know how to check in helpfully."
            : "You express emotion situationally—communicate needs before pressure peaks.",
    },
    conflict_response: {
      label: "Conflict response",
      score: args.dimensions.conflict_response,
      note:
        labelForDimensionScore(args.dimensions.conflict_response) === "higher"
          ? "You engage directly—slow down for empathy and clarity."
          : labelForDimensionScore(args.dimensions.conflict_response) === "lower"
            ? "You may de-escalate or delay—schedule timely, private follow-up."
            : "You respond variably—choose one repeatable repair step after tension.",
    },
    feedback_correction: {
      label: "Feedback & correction",
      score: args.dimensions.feedback_correction,
      note:
        labelForDimensionScore(args.dimensions.feedback_correction) === "higher"
          ? "You value candor—pair clarity with warmth and specifics."
          : labelForDimensionScore(args.dimensions.feedback_correction) === "lower"
            ? "You may prefer gentle framing—ask for examples and encouragement."
            : "You receive feedback in multiple ways—name your preference per season.",
    },
    structure: {
      label: "Structure & organization",
      score: args.dimensions.structure,
      note:
        labelForDimensionScore(args.dimensions.structure) === "higher"
          ? "You value clarity—share checklists so spontaneity doesn’t feel chaotic."
          : labelForDimensionScore(args.dimensions.structure) === "lower"
            ? "You adapt quickly—capture key commitments to reduce drift."
            : "You mix structure and flexibility—decide what must be fixed vs flexible.",
    },
    pace_decisions: {
      label: "Pace & decision-making",
      score: args.dimensions.pace_decisions,
      note:
        labelForDimensionScore(args.dimensions.pace_decisions) === "higher"
          ? "You move fast—invite pause for overlooked details or people."
          : labelForDimensionScore(args.dimensions.pace_decisions) === "lower"
            ? "You prefer careful pacing—ask for decision deadlines when teams rush."
            : "Your pace varies—signal early when you need more time.",
    },
    service_motivation: {
      label: "Service & support needs",
      score: args.dimensions.service_motivation,
      note:
        labelForDimensionScore(args.dimensions.service_motivation) === "higher"
          ? "Motivation is strong—protect rhythms so burnout doesn’t follow."
          : labelForDimensionScore(args.dimensions.service_motivation) === "lower"
            ? "Motivation may need meaning-connection—ask how your serving fits mission."
            : "Motivation shifts by season—communicate capacity changes early.",
    },
  };

  return {
    dominantTemperaments: {
      primary,
      secondary,
      classicalScores: args.classical,
      note:
        "These labels are optional shorthand for reflection. Many people are mixed—use tendencies as conversation starters, not rigid boxes.",
    },
    dimensionNarrative: dimNarrative,
    strengthsTeamwork: guidance.strengthsTeamwork,
    growthAreas: guidance.growthAreas,
    communicationTips: guidance.communicationTips,
    feedbackTips: guidance.feedbackTips,
    underPressure: guidance.underPressure,
    disagreementTips: guidance.disagreementTips,
    serveEffectively: guidance.serveEffectively,
    reflectionPrompts: guidance.reflectionPrompts,
  };
}

export function buildLeadershipReflection(args: {
  answers: TemperamentAnswersMap;
}): TemperamentLeadershipReflection {
  const leaderQs = questionsForKind("leader").filter((q) => q.leaderOnly);
  const themes: string[] = [];
  const avg = (ids: string[]) => {
    const vals = ids.map((id) => clampLikert(args.answers[id] ?? NaN)).filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const delegation = avg(leaderQs.filter((q) => q.id === "l01" || q.id === "l06").map((q) => q.id));
  const feedback = avg(leaderQs.filter((q) => q.id === "l02" || q.id === "l04").map((q) => q.id));
  const inclusion = avg(leaderQs.filter((q) => q.id === "l03" || q.id === "l05").map((q) => q.id));
  const morale = avg(leaderQs.filter((q) => q.id === "l07" || q.id === "l08").map((q) => q.id));
  const conflict = avg(leaderQs.filter((q) => q.id === "l09" || q.id === "l10").map((q) => q.id));

  if (delegation !== null && delegation < 3.2) {
    themes.push("Delegation clarity may need strengthening—define outcomes, authority, and check-in points.");
  }
  if (feedback !== null && feedback < 3.2) {
    themes.push("Feedback versatility may be a growth edge—adjust tone and setting per person.");
  }
  if (inclusion !== null && inclusion < 3.2) {
    themes.push("Inclusive decision-making could increase—invite pushback earlier and draw in quieter voices.");
  }
  if (morale !== null && morale >= 3.6) {
    themes.push("You show attention to morale and faithfulness—keep tying encouragement to clear expectations.");
  }
  if (conflict !== null && conflict >= 3.6) {
    themes.push("You lean toward repair after tension—keep scheduling follow-ups as a repeatable habit.");
  }

  const nextSteps = [
    "Pick one teammate conversation this month focused on communication preferences (channel, timing, feedback style).",
    "After the next rehearsal or serve, run a 10-minute debrief: what worked relationally, what felt unclear?",
    "Write three delegation agreements you want on the team this season (who owns what, by when, how to escalate).",
  ];

  return {
    themes,
    nextSteps,
    note: "This reflection summarizes leader-only prompts—it is formative, not evaluative.",
  };
}

export function countAnsweredForKind(answers: TemperamentAnswersMap, kind: "member" | "leader"): number {
  const qs = questionsForKind(kind);
  let n = 0;
  for (const q of qs) {
    if (clampLikert(answers[q.id] ?? NaN) !== null) n += 1;
  }
  return n;
}

export function totalQuestionsForKind(kind: "member" | "leader"): number {
  return questionsForKind(kind).length;
}

export function buildShepherdingGuidance(): import("@/lib/temperament-shepherding-types").TemperamentShepherdingGuidance {
  return {
    givingFeedback: {
      title: "Giving feedback",
      items: [
        "Prefer private feedback for sensitive topics; ask what setting helps someone focus best.",
        "Lead with appreciation for faithfulness, then one clear behavior and one hopeful next step.",
        "Avoid public correction unless safety requires it—relationship repair comes first.",
        "For direct, task-focused leaders: slow down, add warmth, and confirm understanding before closing.",
        "For relational volunteers: be explicit about expectations and timelines—not just encouragement.",
      ],
    },
    resolvingMisunderstandings: {
      title: "Resolving misunderstandings",
      items: [
        "Separate intent from impact: “I’m not assuming motive—here’s what landed for the team.”",
        "Use curious questions before conclusions: “Help me understand what you heard me request.”",
        "Summarize agreements in writing after verbal discussions to align structure with spontaneity.",
      ],
    },
    delegating: {
      title: "Delegating responsibilities",
      items: [
        "Name outcome, authority, deadline, and who to ask if blocked—especially for detail-oriented teammates.",
        "Match task chunk size to pacing: smaller milestones for reflective members; clear handoffs for fast movers.",
        "Check in without micromanaging: “What support would make this sustainable this month?”",
      ],
    },
    encouraging: {
      title: "Encouraging volunteers",
      items: [
        "Celebrate character and consistency, not only visible outcomes.",
        "Personalize encouragement—some need public praise; others prefer quiet affirmation.",
        "Pair encouragement with one concrete way their serving helped the church body.",
      ],
    },
    missedCommitments: {
      title: "Addressing missed commitments",
      items: [
        "Assume busyness or unclear expectations before character judgments.",
        "Ask what got in the way and what a realistic rhythm looks like next.",
        "Agree on a single follow-up action and date—avoid vague guilt trips.",
      ],
    },
    personalityDifferences: {
      title: "Managing personality differences",
      items: [
        "Use differences as team design hints, not compatibility scores or predictions.",
        "Name communication preferences in rehearsal huddles (channel, timing, feedback style).",
        "When pace clashes, agree on decision deadlines and who owns communication handoffs.",
      ],
    },
    teamDiscussion: {
      title: "Facilitating healthy team discussions",
      items: [
        "Rotate who speaks first so quieter voices aren’t drowned out by confident extroverts.",
        "End with: decisions made, owners named, and how disagreements get escalated privately.",
        "Avoid labeling people—focus on behaviors, contexts, and shared ministry goals.",
      ],
    },
  };
}
