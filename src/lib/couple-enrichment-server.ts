import type { PublicMember } from "@/lib/auth-types";
import { getActiveCoupleLinkForUserId } from "@/lib/couple-link-server";
import { assertGroupResourceAccess } from "@/lib/couple-prayer-access-server";
import { useDatabase } from "@/lib/use-database";
import * as coupleEnrichmentDb from "@/lib/stores/couple-enrichment-db";
import * as coupleEnrichmentJson from "@/lib/stores/couple-enrichment-json";

const store = () => (useDatabase() ? coupleEnrichmentDb : coupleEnrichmentJson);

export async function getEnrichmentPanelData(groupId: string, viewer: PublicMember | null) {
  await assertGroupResourceAccess(viewer, groupId, "read");
  const modules = await store().getEnrichmentModules(groupId);
  const activeLink = viewer ? await getActiveCoupleLinkForUserId(viewer.id) : null;
  const moduleViews = await store().buildModuleViews(modules, activeLink?.id ?? null);

  let canManage = false;
  try {
    await assertGroupResourceAccess(viewer, groupId, "write");
    canManage = true;
  } catch {
    canManage = false;
  }

  const completedCount = moduleViews.filter((module) => module.completed).length;

  return {
    canManage,
    canTrack: Boolean(activeLink),
    modules: moduleViews,
    completedCount,
    totalCount: moduleViews.length,
  };
}

export async function createEnrichmentModuleForLeader(
  viewer: PublicMember,
  input: { groupId: string; title: string; description?: string },
) {
  await assertGroupResourceAccess(viewer, input.groupId, "write");
  if (!input.title.trim()) {
    throw new Error("Title is required.");
  }
  await store().createEnrichmentModule({
    groupId: input.groupId,
    title: input.title,
    description: input.description,
    createdBy: viewer.id,
    createdByName: viewer.name,
  });
  return getEnrichmentPanelData(input.groupId, viewer);
}

export async function deleteEnrichmentModuleForLeader(
  viewer: PublicMember,
  groupId: string,
  moduleId: string,
) {
  await assertGroupResourceAccess(viewer, groupId, "write");
  await store().deleteEnrichmentModule(moduleId);
  return getEnrichmentPanelData(groupId, viewer);
}

export async function toggleEnrichmentProgress(
  viewer: PublicMember,
  groupId: string,
  moduleId: string,
  completed: boolean,
) {
  await assertGroupResourceAccess(viewer, groupId, "read");
  const activeLink = await getActiveCoupleLinkForUserId(viewer.id);
  if (!activeLink) {
    throw new Error("Link your spouse account to track enrichment progress.");
  }

  await store().setEnrichmentProgress({
    moduleId,
    coupleLinkId: activeLink.id,
    completed,
    userId: viewer.id,
    userName: viewer.name,
  });

  return getEnrichmentPanelData(groupId, viewer);
}
