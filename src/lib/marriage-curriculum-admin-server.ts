import type { PublicMember } from "@/lib/auth-types";
import { isMarriageCurriculumAdmin } from "@/lib/marriage-counseling-access";
import { logMarriageAudit } from "@/lib/marriage-counseling-audit";
import { MARRIAGE_COUNSELING_CONTENT_VERSION } from "@/lib/marriage-counseling-curriculum";
import { freezeStage2ModulesIntoSnapshot } from "@/lib/marriage-curriculum-stage2-merge";
import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { marriageCurriculumStore } from "@/lib/stores/marriage-curriculum-store";

const curriculumJson = () => marriageCurriculumStore();

export async function assertCurriculumAdmin(user: PublicMember) {
  if (!(await isMarriageCurriculumAdmin(user))) {
    throw new Error("Curriculum administrator access required.");
  }
}

export async function getCurriculumAdminSnapshot(user: PublicMember) {
  await assertCurriculumAdmin(user);
  const versions = await curriculumJson().listCurriculumVersions();
  const published = await curriculumJson().getPublishedCurriculumVersion();
  const seed = curriculumJson().seedModulesSnapshot();
  return {
    published,
    versions,
    seedVersion: MARRIAGE_COUNSELING_CONTENT_VERSION,
    seedModuleCount: seed.length,
    seedModules: seed,
    drafts: versions.filter((v) => v.status === "draft"),
  };
}

export async function saveCurriculumDraft(
  user: PublicMember,
  input: {
    id?: string;
    version: string;
    modules: MarriageModuleDefinition[];
    basedOnVersion?: string;
  },
) {
  await assertCurriculumAdmin(user);
  const record = await curriculumJson().saveCurriculumDraft({
    id: input.id,
    version: input.version,
    modules: input.modules,
    basedOnVersion: input.basedOnVersion ?? MARRIAGE_COUNSELING_CONTENT_VERSION,
    createdBy: user.id,
    createdByName: user.name,
  });
  await logMarriageAudit({
    actorUserId: user.id,
    action: "curriculum_draft_saved",
    meta: { version: record.version, draftId: record.id },
  });
  return record;
}

export async function publishCurriculumDraft(user: PublicMember, draftId: string) {
  await assertCurriculumAdmin(user);
  const versions = await curriculumJson().listCurriculumVersions();
  const draft = versions.find((v) => v.id === draftId && v.status === "draft");
  if (!draft) throw new Error("Draft not found.");
  const frozenModules = freezeStage2ModulesIntoSnapshot(draft.modules);
  await curriculumJson().saveCurriculumDraft({
    id: draft.id,
    version: draft.version,
    modules: frozenModules,
    basedOnVersion: draft.basedOnVersion,
    createdBy: draft.createdBy,
    createdByName: draft.createdByName,
  });
  const published = await curriculumJson().publishCurriculumVersion(draftId, user.id, user.name);
  await logMarriageAudit({
    actorUserId: user.id,
    action: "curriculum_published",
    meta: { version: published.version },
  });
  return published;
}

export async function archiveCurriculumVersion(user: PublicMember, versionId: string) {
  await assertCurriculumAdmin(user);
  const archived = await curriculumJson().archiveCurriculumVersion(versionId);
  await logMarriageAudit({
    actorUserId: user.id,
    action: "curriculum_archived",
    meta: { version: archived.version },
  });
  return archived;
}

export async function previewComparisonForAdmin(
  user: PublicMember,
  moduleId: string,
  answerA: Record<string, unknown>,
  answerB: Record<string, unknown>,
) {
  await assertCurriculumAdmin(user);
  const modules = await curriculumJson().getPublishedCurriculumVersion();
  const mod =
    modules?.modules.find((m) => m.id === moduleId) ??
    curriculumJson().seedModulesSnapshot().find((m) => m.id === moduleId);
  if (!mod) throw new Error("Module not found.");
  const items = mod.questions
    .filter((q) => q.visibility === "shared_after_both_submit")
    .map((q) => ({
      questionId: q.id,
      prompt: q.prompt,
      answerA: answerA[q.id],
      answerB: answerB[q.id],
    }));
  return { moduleTitle: mod.title, items };
}
