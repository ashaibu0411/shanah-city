import type {
  MarriageHubAssignmentView,
  MarriageHubSessionHomeworkView,
} from "@/lib/marriage-counseling-types";

const LEGACY_PREFIX = "legacy-assignment:";

/** Stable id for legacy module assignments surfaced in the couple homework list. */
export function legacyAssignmentHomeworkId(assignmentId: string): string {
  return `${LEGACY_PREFIX}${assignmentId}`;
}

export function isLegacyAssignmentHomeworkId(homeworkId: string): boolean {
  return homeworkId.startsWith(LEGACY_PREFIX);
}

export function legacyAssignmentIdFromHomeworkId(homeworkId: string): string | null {
  if (!isLegacyAssignmentHomeworkId(homeworkId)) return null;
  return homeworkId.slice(LEGACY_PREFIX.length);
}

/**
 * One couple-facing homework list: counselor-released session homework plus open legacy module assignments.
 * Legacy rows link to module assessments; they are not duplicate session-homework submissions.
 */
export function mergeCoupleHomeworkHubViews(
  sessionHomework: MarriageHubSessionHomeworkView[],
  legacyAssignments: MarriageHubAssignmentView[],
): MarriageHubSessionHomeworkView[] {
  const sessionTemplateKeys = new Set(
    sessionHomework.map((h) => h.templateKey).filter(Boolean) as string[],
  );
  const merged = [...sessionHomework];

  for (const assignment of legacyAssignments) {
    if (assignment.completed) continue;
    const syntheticId = legacyAssignmentHomeworkId(assignment.id);
    if (merged.some((h) => h.id === syntheticId)) continue;
    if (assignment.moduleId && sessionTemplateKeys.has(assignment.moduleId)) continue;

    merged.push({
      id: syntheticId,
      title: assignment.title,
      dueAt: assignment.dueAt,
      dueAtTimeZone: assignment.dueAtTimeZone,
      status: "not_started",
      submitted: false,
      hasCounselorFeedback: false,
      activityCount: 0,
      templateKey: assignment.moduleId ? `legacy-module:${assignment.moduleId}` : "legacy-assignment",
      timingLabel: "Module assignment",
      assignedAfterLabel: undefined,
      preparingForLabel: undefined,
      postProgramNote: undefined,
      estimatedMinutes: undefined,
    });
  }

  return merged;
}
