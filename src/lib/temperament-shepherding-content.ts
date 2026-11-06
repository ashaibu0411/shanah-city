import type { ClassicalTemperament, TemperamentDimension, TemperamentQuestionDef } from "@/lib/temperament-shepherding-types";

/** Bump when questions or scoring weights change; preserves historical rows by version. */
export const TEMPERAMENT_SHEPHERDING_CONTENT_VERSION = "tsw-2026.1";

const w = (
  sanguine: number,
  choleric: number,
  melancholic: number,
  phlegmatic: number,
): Record<ClassicalTemperament, number> => ({
  sanguine,
  choleric,
  melancholic,
  phlegmatic,
});

function q(
  id: string,
  text: string,
  dimension: TemperamentDimension,
  classicalHint: Record<ClassicalTemperament, number>,
  leaderOnly?: boolean,
): TemperamentQuestionDef {
  return { id, text, dimension, classicalHint, leaderOnly };
}

/** Core member questionnaire (~40 items, five-point agreement). */
export const TEMPERAMENT_MEMBER_QUESTIONS: TemperamentQuestionDef[] = [
  q("m01", "I get energized when I can connect with people between tasks.", "communication", w(1.2, 0.2, -0.2, 0.4)),
  q("m02", "I prefer clear written expectations before a big conversation.", "communication", w(-0.2, 0.4, 1.0, 0.3)),
  q("m03", "I speak up quickly when I disagree, even if the room is tense.", "conflict_response", w(0.2, 1.2, -0.3, -0.4)),
  q("m04", "I need time to process before I respond to conflict.", "conflict_response", w(-0.4, -0.6, 0.8, 1.0)),
  q("m05", "I enjoy brainstorming out loud with others.", "collaboration", w(1.1, 0.3, -0.2, 0.3)),
  q("m06", "I like having a structured agenda for team meetings.", "structure", w(-0.3, 0.5, 1.0, 0.2)),
  q("m07", "I am comfortable shifting plans quickly when something better comes up.", "pace_decisions", w(0.9, 0.6, -0.6, -0.2)),
  q("m08", "I prefer to research options thoroughly before deciding.", "pace_decisions", w(-0.5, -0.2, 1.1, 0.5)),
  q("m09", "I naturally take initiative when something is stuck.", "leadership_initiative", w(0.4, 1.3, 0.1, -0.3)),
  q("m10", "I am happy to support someone else’s plan if it helps the team.", "collaboration", w(0.3, -0.3, 0.2, 1.2)),
  q("m11", "I express encouragement openly, even for small wins.", "emotional_expression", w(1.2, 0.2, -0.3, 0.4)),
  q("m12", "I tend to keep stress to myself until I have time to think.", "emotional_expression", w(-0.5, -0.2, 0.6, 0.9)),
  q("m13", "I appreciate direct feedback, even if it is blunt.", "feedback_correction", w(0.2, 1.1, 0.2, -0.3)),
  q("m14", "I receive feedback best when it includes encouragement and context.", "feedback_correction", w(0.6, -0.2, 0.5, 0.8)),
  q("m15", "I correct others quickly when something is wrong—it's not personal.", "conflict_response", w(0.1, 1.2, 0.2, -0.5)),
  q("m16", "I avoid confrontation but will address issues after I’ve had time to prepare.", "conflict_response", w(-0.3, -0.4, 0.7, 1.0)),
  q("m17", "I work best when roles and deadlines are explicit.", "structure", w(-0.2, 0.6, 0.9, 0.4)),
  q("m18", "Too many rules can slow down meaningful ministry.", "structure", w(0.5, 0.3, -0.8, -0.2)),
  q("m19", "I enjoy hosting people and making them feel welcome.", "service_motivation", w(1.2, 0.1, -0.2, 0.5)),
  q("m20", "I am motivated by finishing tasks well and on time.", "service_motivation", w(0.2, 1.0, 0.5, -0.1)),
  q("m21", "I am motivated by careful excellence, even if it takes longer.", "service_motivation", w(-0.2, 0.2, 1.3, 0.2)),
  q("m22", "I am motivated by keeping peace and reducing stress for others.", "service_motivation", w(0.3, -0.4, 0.2, 1.2)),
  q("m23", "In group discussions, I summarize and clarify what we’re deciding.", "leadership_initiative", w(0.1, 0.5, 0.8, 0.5)),
  q("m24", "In group discussions, I push for a decision so we can move forward.", "leadership_initiative", w(0.3, 1.2, -0.1, -0.3)),
  q("m25", "I prefer private messages for sensitive feedback.", "communication", w(-0.1, -0.2, 0.6, 0.8)),
  q("m26", "I am comfortable addressing a whole team publicly when needed.", "communication", w(0.4, 0.8, -0.2, -0.3)),
  q("m27", "When I’m under pressure, I talk things through with people I trust.", "emotional_expression", w(1.0, 0.2, -0.3, 0.3)),
  q("m28", "When I’m under pressure, I focus on tasks and push emotions aside for later.", "emotional_expression", w(0.1, 1.0, 0.2, -0.2)),
  q("m29", "When I’m under pressure, I become quieter and more analytical.", "emotional_expression", w(-0.3, 0.2, 1.1, 0.3)),
  q("m30", "When I’m under pressure, I try to keep the mood steady for others.", "emotional_expression", w(0.2, -0.3, -0.2, 1.1)),
  q("m31", "I assume the best about motives when someone disappoints me.", "conflict_response", w(0.4, -0.5, -0.2, 1.0)),
  q("m32", "I want misunderstandings resolved quickly, even if it feels uncomfortable.", "conflict_response", w(0.3, 1.0, -0.2, -0.3)),
  q("m33", "I like collaborating with a small trusted team more than a large crowd.", "collaboration", w(-0.1, 0.2, 0.7, 0.7)),
  q("m34", "I enjoy volunteering where I can see immediate impact.", "service_motivation", w(1.0, 0.6, -0.2, -0.1)),
  q("m35", "I prefer knowing how my serving fits into the bigger mission.", "service_motivation", w(0.2, 0.4, 0.9, 0.3)),
  q("m36", "I am comfortable asking for help when I’m overloaded.", "collaboration", w(0.4, -0.1, -0.1, 0.6)),
  q("m37", "I like calendars and checklists to keep ministry commitments organized.", "structure", w(0.0, 0.5, 0.9, 0.5)),
  q("m38", "I can adapt when the schedule changes at the last minute.", "pace_decisions", w(0.7, 0.5, -0.5, -0.1)),
  q("m39", "I value honest input, even if it slows the moment down.", "feedback_correction", w(0.1, 0.3, 0.9, 0.4)),
  q("m40", "I tend to look for what is strong before naming what needs improvement.", "feedback_correction", w(0.7, -0.2, 0.4, 0.6)),
];

/** Leader-only reflection (same agreement scale). */
export const TEMPERAMENT_LEADER_QUESTIONS: TemperamentQuestionDef[] = [
  q(
    "l01",
    "As a leader, I am intentional about how I delegate tasks across personalities.",
    "leadership_initiative",
    w(0.2, 0.5, 0.5, 0.6),
    true,
  ),
  q("l02", "I adjust my correction style based on how someone receives feedback.", "feedback_correction", w(0.4, 0.2, 0.5, 0.7), true),
  q("l03", "I invite pushback from teammates before finalizing a direction.", "leadership_initiative", w(0.3, -0.1, 0.5, 0.7), true),
  q("l04", "I can admit mistakes to the team without losing their trust.", "leadership_initiative", w(0.5, 0.3, 0.4, 0.5), true),
  q("l05", "I watch for quieter voices and draw them into discussion.", "collaboration", w(0.4, 0.1, 0.4, 0.8), true),
  q("l06", "I set clear expectations so disagreements are about priorities, not surprises.", "structure", w(0.1, 0.6, 0.7, 0.5), true),
  q("l07", "I notice when pressure is affecting morale—not only tasks.", "emotional_expression", w(0.5, 0.2, 0.5, 0.6), true),
  q("l08", "I build team energy by celebrating faithfulness, not only outcomes.", "service_motivation", w(0.8, 0.2, 0.2, 0.6), true),
  q("l09", "I schedule follow-up after tense conversations to repair trust.", "conflict_response", w(0.3, 0.4, 0.5, 0.8), true),
  q("l10", "I seek to understand personalities before coaching someone through a conflict.", "conflict_response", w(0.3, 0.2, 0.6, 0.8), true),
];

export function questionsForKind(kind: "member" | "leader"): TemperamentQuestionDef[] {
  if (kind === "leader") {
    return [...TEMPERAMENT_MEMBER_QUESTIONS, ...TEMPERAMENT_LEADER_QUESTIONS];
  }
  return TEMPERAMENT_MEMBER_QUESTIONS;
}

export const TEMPERAMENT_DISCLAIMER =
  "This reflection is for ministry growth and teamwork — not a clinical diagnosis. " +
  "Results describe tendencies, not worth. They should never be used to automatically accept, reject, promote, or remove volunteers.";
