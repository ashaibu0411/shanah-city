import { randomUUID } from "crypto";
import type { TemperamentAssessmentKind } from "@/lib/temperament-shepherding-types";
import { TEMPERAMENT_SHEPHERDING_CONTENT_VERSION, TEMPERAMENT_DISCLAIMER } from "@/lib/temperament-shepherding-content";
import {
  buildLeadershipReflection,
  buildMemberProfilePayload,
  buildShepherdingGuidance,
  computeClassicalScores,
  computeDimensionScores,
  totalQuestionsForKind,
} from "@/lib/temperament-shepherding-scoring";
import { questionsForKind } from "@/lib/temperament-shepherding-content";
import { prisma } from "@/lib/db";
import type {
  TemperamentAnswersMap,
  TemperamentLeaderSharedHighlights,
} from "@/lib/temperament-shepherding-types";
import { getUserById } from "@/lib/auth-server";
import { getGroups } from "@/lib/group-server";
import { getDepartmentDef } from "@/lib/temperament-shepherding-departments";
import type { TemperamentScoresPayload } from "@/lib/temperament-shepherding-types";

export const MIN_ANSWERS_RATIO = 0.85;

function parseAnswersJson(raw: string): TemperamentAnswersMap {
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    const out: TemperamentAnswersMap = {};
    if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v)) {
        const n = typeof val === "number" ? val : Number(val);
        if (Number.isFinite(n)) out[k] = n;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function validateAnswersForKind(answers: TemperamentAnswersMap, kind: TemperamentAssessmentKind): {
  ok: boolean;
  error?: string;
  answeredCount: number;
  totalQuestions: number;
} {
  const qs = questionsForKind(kind);
  const allowed = new Set(qs.map((q) => q.id));
  for (const key of Object.keys(answers)) {
    if (!allowed.has(key)) {
      return { ok: false, error: "Unknown question id in answers.", answeredCount: 0, totalQuestions: qs.length };
    }
    const v = answers[key];
    if (!Number.isFinite(v) || v < 1 || v > 5) {
      return { ok: false, error: "Answers must be numbers from 1 to 5.", answeredCount: 0, totalQuestions: qs.length };
    }
  }
  let answered = 0;
  for (const q of qs) {
    const a = answers[q.id];
    if (a !== undefined && Number.isFinite(a)) answered += 1;
  }
  const need = Math.ceil(qs.length * MIN_ANSWERS_RATIO);
  if (answered < need) {
    return {
      ok: false,
      error: `Please answer at least ${need} of ${qs.length} questions before submitting.`,
      answeredCount: answered,
      totalQuestions: qs.length,
    };
  }
  return { ok: true, answeredCount: answered, totalQuestions: qs.length };
}

export function computeSnapshotPayload(args: {
  assessmentKind: TemperamentAssessmentKind;
  answers: TemperamentAnswersMap;
}) {
  const classical = computeClassicalScores(args.answers, args.assessmentKind);
  const dimensions = computeDimensionScores(args.answers, args.assessmentKind);
  const profile = buildMemberProfilePayload({ classical, dimensions });
  const leadership =
    args.assessmentKind === "leader"
      ? buildLeadershipReflection({ answers: args.answers })
      : null;
  const guidance = buildShepherdingGuidance();
  const scores = {
    contentVersion: TEMPERAMENT_SHEPHERDING_CONTENT_VERSION,
    assessmentKind: args.assessmentKind,
    classical,
    dimensions,
  };
  const highlights = {
    profile,
    leadershipReflection: leadership,
  };
  return { scores, highlights, guidance };
}

export async function appendTemperamentAudit(input: {
  departmentKey: string;
  actorUserId: string;
  action: string;
  targetUserId?: string | null;
  summary: string;
  meta?: Record<string, unknown>;
}) {
  await prisma.temperamentShepherdingAudit.create({
    data: {
      id: randomUUID(),
      departmentKey: input.departmentKey,
      actorUserId: input.actorUserId,
      action: input.action,
      targetUserId: input.targetUserId ?? null,
      summary: input.summary,
      metaJson: input.meta ? JSON.stringify(input.meta) : null,
    },
  });
}

export async function findLatestResponse(input: {
  userId: string;
  departmentKey: string;
  assessmentKind: TemperamentAssessmentKind;
}) {
  return prisma.temperamentAssessmentResponse.findFirst({
    where: {
      userId: input.userId,
      departmentKey: input.departmentKey,
      assessmentKind: input.assessmentKind,
    },
    orderBy: { updatedAt: "desc" },
    include: { snapshot: true },
  });
}

export async function getOrCreateDraftResponse(input: {
  userId: string;
  departmentKey: string;
  assessmentKind: TemperamentAssessmentKind;
}) {
  const existing = await findLatestResponse(input);
  if (existing && existing.contentVersion === TEMPERAMENT_SHEPHERDING_CONTENT_VERSION) {
    return existing;
  }
  if (existing && existing.status === "draft" && existing.contentVersion !== TEMPERAMENT_SHEPHERDING_CONTENT_VERSION) {
    return prisma.temperamentAssessmentResponse.update({
      where: { id: existing.id },
      data: {
        contentVersion: TEMPERAMENT_SHEPHERDING_CONTENT_VERSION,
        answersJson: "{}",
        status: "draft",
        dataUseConsentAt: null,
        leaderShareConsentAt: null,
        shareSnapshotWithLeader: false,
        submittedAt: null,
      },
    });
  }

  if (existing && existing.status === "submitted" && existing.contentVersion !== TEMPERAMENT_SHEPHERDING_CONTENT_VERSION) {
    return prisma.temperamentAssessmentResponse.create({
      data: {
        id: randomUUID(),
        userId: input.userId,
        departmentKey: input.departmentKey,
        contentVersion: TEMPERAMENT_SHEPHERDING_CONTENT_VERSION,
        assessmentKind: input.assessmentKind,
        status: "draft",
        answersJson: "{}",
      },
    });
  }

  return prisma.temperamentAssessmentResponse.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      departmentKey: input.departmentKey,
      contentVersion: TEMPERAMENT_SHEPHERDING_CONTENT_VERSION,
      assessmentKind: input.assessmentKind,
      status: "draft",
      answersJson: "{}",
    },
  });
}

export async function saveDraft(input: {
  userId: string;
  departmentKey: string;
  assessmentKind: TemperamentAssessmentKind;
  answers: TemperamentAnswersMap;
}) {
  const row = await getOrCreateDraftResponse({
    userId: input.userId,
    departmentKey: input.departmentKey,
    assessmentKind: input.assessmentKind,
  });
  if (row.status === "submitted") {
    throw new Error("This assessment is already submitted.");
  }
  return prisma.temperamentAssessmentResponse.update({
    where: { id: row.id },
    data: {
      answersJson: JSON.stringify(input.answers),
      status: "draft",
    },
  });
}

export async function submitAssessment(input: {
  userId: string;
  departmentKey: string;
  assessmentKind: TemperamentAssessmentKind;
  answers: TemperamentAnswersMap;
  dataUseConsentAt: Date;
}) {
  const validation = validateAnswersForKind(input.answers, input.assessmentKind);
  if (!validation.ok) {
    throw new Error(validation.error || "Invalid answers.");
  }
  const row = await getOrCreateDraftResponse({
    userId: input.userId,
    departmentKey: input.departmentKey,
    assessmentKind: input.assessmentKind,
  });
  if (row.status === "submitted") {
    throw new Error("Already submitted.");
  }

  const { scores, highlights, guidance } = computeSnapshotPayload({
    assessmentKind: input.assessmentKind,
    answers: input.answers,
  });

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const updated = await tx.temperamentAssessmentResponse.update({
      where: { id: row.id },
      data: {
        answersJson: JSON.stringify(input.answers),
        status: "submitted",
        dataUseConsentAt: input.dataUseConsentAt,
        submittedAt: now,
      },
    });
    await tx.temperamentAssessmentSnapshot.upsert({
      where: { responseId: updated.id },
      create: {
        id: randomUUID(),
        responseId: updated.id,
        scoresJson: JSON.stringify(scores),
        highlightsJson: JSON.stringify(highlights),
        guidanceJson: JSON.stringify(guidance),
        disclaimer: TEMPERAMENT_DISCLAIMER,
      },
      update: {
        scoresJson: JSON.stringify(scores),
        highlightsJson: JSON.stringify(highlights),
        guidanceJson: JSON.stringify(guidance),
        disclaimer: TEMPERAMENT_DISCLAIMER,
      },
    });
    return updated;
  });
}

export async function setLeaderShareConsent(input: {
  responseId: string;
  userId: string;
  departmentKey: string;
  share: boolean;
}) {
  const row = await prisma.temperamentAssessmentResponse.findFirst({
    where: {
      id: input.responseId,
      userId: input.userId,
      departmentKey: input.departmentKey,
      assessmentKind: "member",
      status: "submitted",
    },
    include: { snapshot: true },
  });
  if (!row?.snapshot) {
    throw new Error("Submitted profile not found.");
  }
  const now = new Date();
  return prisma.temperamentAssessmentResponse.update({
    where: { id: row.id },
    data: {
      shareSnapshotWithLeader: input.share,
      leaderShareConsentAt: input.share ? now : null,
    },
  });
}

export async function getMemberView(input: { userId: string; departmentKey: string; assessmentKind: TemperamentAssessmentKind }) {
  const row = await findLatestResponse({
    userId: input.userId,
    departmentKey: input.departmentKey,
    assessmentKind: input.assessmentKind,
  });
  if (!row) {
    return { response: null, snapshot: null };
  }
  const answers = parseAnswersJson(row.answersJson);
  return {
    response: row,
    snapshot: row.snapshot,
    answers,
    progress: {
      answered: Object.keys(answers).filter((id) => {
        const n = answers[id];
        return Number.isFinite(n) && n >= 1 && n <= 5;
      }).length,
      total: totalQuestionsForKind(input.assessmentKind),
    },
  };
}

/**
 * Strict allowlist for member-facing API responses. Never spread Prisma response
 * rows into JSON: they contain answersJson and an eagerly-loaded full snapshot.
 */
export function serializeTemperamentSelfView(
  view: Awaited<ReturnType<typeof getMemberView>>,
  kind: TemperamentAssessmentKind,
) {
  const row = view.response;
  return {
    response: row
      ? {
          id: row.id,
          status: row.status,
          assessmentKind: row.assessmentKind,
          contentVersion: row.contentVersion,
          shareSnapshotWithLeader: row.shareSnapshotWithLeader,
          leaderShareConsentAt: row.leaderShareConsentAt,
          dataUseConsentAt: row.dataUseConsentAt,
          submittedAt: row.submittedAt,
        }
      : null,
    snapshot: view.snapshot
      ? { disclaimer: view.snapshot.disclaimer, highlightsJson: view.snapshot.highlightsJson }
      : null,
    answers:
      row?.status === "draft" && "answers" in view && view.answers
        ? view.answers
        : {},
    progress:
      "progress" in view && view.progress
        ? view.progress
        : { answered: 0, total: totalQuestionsForKind(kind) },
  };
}

export async function buildLeaderHighlightsForUser(input: {
  subjectUserId: string;
  departmentKey: string;
}): Promise<TemperamentLeaderSharedHighlights | null> {
  const user = await getUserById(input.subjectUserId);
  if (!user) return null;

  const memberRow = await findLatestResponse({
    userId: input.subjectUserId,
    departmentKey: input.departmentKey,
    assessmentKind: "member",
  });
  if (!memberRow?.snapshot || memberRow.status !== "submitted") return null;
  if (!memberRow.shareSnapshotWithLeader || !memberRow.leaderShareConsentAt) return null;

  const highlights = JSON.parse(memberRow.snapshot.highlightsJson) as {
    profile: { dominantTemperaments: TemperamentLeaderSharedHighlights["dominantTemperaments"]; strengthsTeamwork: string[]; communicationTips: string[]; feedbackTips: string[] };
  };

  return {
    version: TEMPERAMENT_SHEPHERDING_CONTENT_VERSION,
    userId: input.subjectUserId,
    displayName: user.displayName?.trim() || user.name,
    assessmentKind: "member",
    submittedAt: memberRow.submittedAt?.toISOString() ?? memberRow.updatedAt.toISOString(),
    dominantTemperaments: highlights.profile.dominantTemperaments,
    strengthsTeamwork: highlights.profile.strengthsTeamwork,
    communicationTips: highlights.profile.communicationTips,
    feedbackTips: highlights.profile.feedbackTips,
  };
}

export async function listDepartmentInvitationRows(departmentKey: string) {
  return prisma.temperamentAssessmentInvitation.findMany({
    where: { departmentKey },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function upsertInvitation(input: {
  departmentKey: string;
  inviterUserId: string;
  inviteeUserId: string;
  status?: string;
}) {
  const existing = await prisma.temperamentAssessmentInvitation.findFirst({
    where: {
      departmentKey: input.departmentKey,
      inviteeUserId: input.inviteeUserId,
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return prisma.temperamentAssessmentInvitation.update({
      where: { id: existing.id },
      data: {
        inviterUserId: input.inviterUserId,
        status: input.status ?? "pending",
      },
    });
  }
  return prisma.temperamentAssessmentInvitation.create({
    data: {
      id: randomUUID(),
      departmentKey: input.departmentKey,
      inviterUserId: input.inviterUserId,
      inviteeUserId: input.inviteeUserId,
      status: input.status ?? "pending",
    },
  });
}

export async function buildLeaderDashboard(input: { departmentKey: string }) {
  const def = getDepartmentDef(input.departmentKey);
  if (!def) throw new Error("Unknown department");

  const groups = await getGroups();
  const group = groups.find((g) => g.id === def.groupId);
  const memberIds = group ? [...new Set(group.memberIds)] : [];

  if (memberIds.length === 0) {
    return {
      memberCount: 0,
      participation: [],
      teamDimensionAverages: null,
      teamDimensionNote:
        "No worship group members found in configuration—averages will populate once members join the group.",
      discussionTopics: [
        "What communication channel works best for mid-week updates (text, group chat, email)?",
        "Where do we want more structure vs. flexibility this season?",
      ],
      guidance: buildShepherdingGuidance(),
    };
  }

  const [memberResponses, invRows] = await Promise.all([
    prisma.temperamentAssessmentResponse.findMany({
      where: { departmentKey: input.departmentKey, assessmentKind: "member", userId: { in: memberIds } },
      orderBy: { updatedAt: "desc" },
      include: { snapshot: true },
    }),
    prisma.temperamentAssessmentInvitation.findMany({
      where: { departmentKey: input.departmentKey, inviteeUserId: { in: memberIds } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const latestMemberByUser = new Map<string, (typeof memberResponses)[0]>();
  for (const row of memberResponses) {
    if (!latestMemberByUser.has(row.userId)) latestMemberByUser.set(row.userId, row);
  }

  const latestInviteByUser = new Map<string, (typeof invRows)[0]>();
  for (const row of invRows) {
    if (!latestInviteByUser.has(row.inviteeUserId)) latestInviteByUser.set(row.inviteeUserId, row);
  }

  const participation = await Promise.all(
    memberIds.map(async (id) => {
      const u = await getUserById(id);
      const row = latestMemberByUser.get(id);
      const inv = latestInviteByUser.get(id);
      return {
        userId: id,
        name: u?.displayName?.trim() || u?.name || "Member",
        invitationStatus: inv?.status ?? "none",
        assessmentStatus: row?.status === "submitted" ? "submitted" : row ? "draft" : "not_started",
        sharesWithLeader: Boolean(row?.shareSnapshotWithLeader && row?.leaderShareConsentAt),
      };
    }),
  );

  const sharedForTeam = memberResponses.filter(
    (r) =>
      r.assessmentKind === "member" &&
      r.status === "submitted" &&
      r.shareSnapshotWithLeader &&
      r.leaderShareConsentAt &&
      r.snapshot,
  );
  const uniqueShared = new Map<string, (typeof sharedForTeam)[0]>();
  for (const r of sharedForTeam) {
    if (!uniqueShared.has(r.userId)) uniqueShared.set(r.userId, r);
  }

  const dimensionTotals: Record<string, number> = {};
  let dimCount = 0;
  for (const r of uniqueShared.values()) {
    if (!r.snapshot) continue;
    try {
      const scores = JSON.parse(r.snapshot.scoresJson) as TemperamentScoresPayload;
      dimCount += 1;
      for (const [k, v] of Object.entries(scores.dimensions)) {
        dimensionTotals[k] = (dimensionTotals[k] ?? 0) + v;
      }
    } catch {
      /* ignore */
    }
  }

  const teamDimensionAverages: Record<string, number> = {};
  if (dimCount > 0) {
    for (const k of Object.keys(dimensionTotals)) {
      teamDimensionAverages[k] = Math.round(dimensionTotals[k]! / dimCount);
    }
  }

  const discussionTopics = [
    "What communication channel works best for mid-week updates (text, group chat, email)?",
    "Where do we want more structure vs. flexibility this season?",
    "How should we give feedback after rehearsal so everyone feels respected?",
    "What does sustainable serving look like for each of us in the next month?",
  ];

  const sharedProfiles: TemperamentLeaderSharedHighlights[] = [];
  for (const uid of uniqueShared.keys()) {
    const hi = await buildLeaderHighlightsForUser({ subjectUserId: uid, departmentKey: input.departmentKey });
    if (hi) sharedProfiles.push(hi);
  }

  // Leadership reflections are private to the leader; do not place them on a
  // department-wide dashboard without a separate, explicit sharing consent.

  return {
    memberCount: memberIds.length,
    participation,
    sharedProfiles,
    teamDimensionAverages: dimCount > 0 ? teamDimensionAverages : null,
    teamDimensionNote:
      dimCount === 0
        ? "No team averages yet—averages include only members who completed the assessment and chose to share a summary with leaders."
        :       `Averages from ${dimCount} shared profile${dimCount === 1 ? "" : "s"} (dimension scores 0–100). Not a diagnosis or ranking.`,
    discussionTopics,
    leadershipReflectionInsights: [],
    guidance: buildShepherdingGuidance(),
  };
}
