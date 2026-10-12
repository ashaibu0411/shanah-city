import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { CHOIR_HERO_IMAGE_PATH, SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import type {
  ChoirMinistryResource,
  ChoirResourceCardView,
  ChoirResourceHomePayload,
  ChoirResourceKind,
  ChoirResourceTabId,
} from "@/lib/choir-resource-types";
import { choirResourcesManageHref } from "@/lib/choir-resource-links";
import { assertChoirAnnouncementsAccess, canManageChoirAnnouncements } from "@/lib/choir-announcements-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import {
  createChoirResourceRequestJson,
  deleteChoirMinistryResourceJson,
  listChoirMinistryResourcesJson,
  listChoirResourceRequestsJson,
  updateChoirResourceRequestJson,
  upsertChoirMinistryResourceJson,
} from "@/lib/stores/choir-ministry-resources-json";

const KIND_LABEL: Record<ChoirResourceKind, string> = {
  pdf: "PDF",
  docx: "DOCX",
  xlsx: "XLSX",
  image: "Image",
  video_link: "Video",
  article_link: "Article",
  internal_route: "App page",
  external_url: "Link",
};

function resourceHref(resource: ChoirMinistryResource) {
  if (resource.kind === "internal_route" && resource.url?.startsWith("/")) {
    return resource.url;
  }
  return resource.url?.trim() || null;
}

function toCardView(resource: ChoirMinistryResource): ChoirResourceCardView {
  const href = resourceHref(resource);
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    kind: resource.kind,
    kindLabel: KIND_LABEL[resource.kind] ?? resource.kind,
    url: href,
    coverImagePath: resource.coverImagePath?.trim() || CHOIR_HERO_IMAGE_PATH,
    fileSizeLabel: resource.fileSizeLabel,
    featuredBadge: resource.featuredBadge,
    category: resource.category,
    tab: resource.tab,
    href: href ?? `#resource-${resource.id}`,
  };
}

export async function assertChoirResourceAccess(user: PublicMember, groupId: string) {
  return assertChoirAnnouncementsAccess(user, groupId);
}

export async function canManageChoirResources(user: PublicMember, groupId: string) {
  if (await canManageChoirAnnouncements(user, groupId)) return true;
  if (await canManageAsAdmin(user)) return true;
  return canManageGroupEvents(user, groupId);
}

function published(resources: ChoirMinistryResource[], includeDrafts: boolean) {
  return resources.filter((row) => includeDrafts || row.status === "published");
}

export async function buildChoirResourceHomePayload(
  user: PublicMember,
  groupId: string,
): Promise<ChoirResourceHomePayload | null> {
  const group = await assertChoirResourceAccess(user, groupId);
  if (!group) return null;

  const canManage = await canManageChoirResources(user, groupId);
  const all = await listChoirMinistryResourcesJson(groupId);
  const publishedRows = published(all, canManage);
  const visible = publishedRows.map(toCardView);
  const isFeatured = (id: string) => publishedRows.find((row) => row.id === id)?.featured;

  return {
    groupId,
    groupChatHref: `/groups/${encodeURIComponent(groupId)}?chat=1`,
    featured: visible.filter((row) => isFeatured(row.id)).slice(0, 6),
    library: visible
      .filter((row) => row.tab === "resources" || row.tab === "guides" || row.tab === "forms")
      .slice(0, 8),
    helpfulLinks: visible
      .filter((row) => row.tab === "links" || row.kind === "external_url" || row.kind === "video_link")
      .slice(0, 8),
    canManage,
    manageHref: choirResourcesManageHref(groupId),
  };
}

export async function listChoirResourceCards(
  user: PublicMember,
  groupId: string,
  options?: { tab?: ChoirResourceTabId; query?: string },
) {
  const group = await assertChoirResourceAccess(user, groupId);
  if (!group) return null;
  const canManage = await canManageChoirResources(user, groupId);
  let rows = published(await listChoirMinistryResourcesJson(groupId), canManage);
  if (options?.tab) {
    rows = rows.filter((row) => row.tab === options.tab);
  }
  const query = options?.query?.trim().toLowerCase();
  if (query) {
    rows = rows.filter(
      (row) =>
        row.title.toLowerCase().includes(query) ||
        row.description.toLowerCase().includes(query) ||
        row.category.toLowerCase().includes(query),
    );
  }
  return rows.map(toCardView);
}

export async function handleChoirResourceAction(user: PublicMember, body: Record<string, unknown>) {
  const groupId = String(body.groupId ?? SHANAH_WORSHIP_GROUP_ID).trim();
  const action = String(body.action ?? "").trim();
  const group = await assertChoirResourceAccess(user, groupId);
  if (!group) throw new Error("Access denied.");

  if (action === "request_resource") {
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const category = String(body.category ?? "General").trim();
    if (!title || !description) throw new Error("Title and description are required.");
    const record = await createChoirResourceRequestJson({
      groupId,
      userId: user.id,
      userName: user.name,
      category,
      title,
      description,
      relatedActivity: String(body.relatedActivity ?? "").trim() || undefined,
      referenceUrl: String(body.referenceUrl ?? "").trim() || undefined,
    });
    return { request: record };
  }

  const canManage = await canManageChoirResources(user, groupId);
  if (!canManage) throw new Error("Not authorized to manage resources.");

  if (action === "upsert_resource") {
    const now = new Date().toISOString();
    const id = String(body.id ?? "").trim() || `choir-resource-${Date.now()}`;
    const existing = (await listChoirMinistryResourcesJson(groupId)).find((row) => row.id === id);
    const tab = String(body.tab ?? "resources") as ChoirResourceTabId;
    const kind = String(body.kind ?? "external_url") as ChoirResourceKind;
    const resource: ChoirMinistryResource = {
      id,
      groupId,
      tab,
      category: String(body.category ?? "General").trim(),
      title: String(body.title ?? "").trim() || "Untitled resource",
      description: String(body.description ?? "").trim(),
      kind,
      url: String(body.url ?? "").trim() || undefined,
      coverImagePath: String(body.coverImagePath ?? "").trim() || undefined,
      fileSizeLabel: String(body.fileSizeLabel ?? "").trim() || undefined,
      featured: Boolean(body.featured),
      featuredBadge: String(body.featuredBadge ?? "").trim() || undefined,
      status: body.status === "draft" ? "draft" : "published",
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : existing?.sortOrder ?? 0,
      createdBy: existing?.createdBy ?? user.id,
      createdByName: existing?.createdByName ?? user.name,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await upsertChoirMinistryResourceJson(resource);
    return { resource: toCardView(resource) };
  }

  if (action === "delete_resource") {
    const id = String(body.id ?? "").trim();
    await deleteChoirMinistryResourceJson(groupId, id);
    return { ok: true };
  }

  if (action === "update_request_status") {
    const id = String(body.requestId ?? "").trim();
    const status = String(body.status ?? "") as "submitted" | "under_review" | "fulfilled" | "closed";
    const updated = await updateChoirResourceRequestJson(groupId, id, { status });
    if (!updated) throw new Error("Request not found.");
    return { request: updated };
  }

  throw new Error("Unknown action.");
}

export async function listChoirResourceRequestsForLeader(user: PublicMember, groupId: string) {
  if (!(await canManageChoirResources(user, groupId))) {
    throw new Error("Not authorized.");
  }
  return listChoirResourceRequestsJson(groupId);
}

export async function listChoirResourceRequestsForMember(user: PublicMember, groupId: string) {
  await assertChoirResourceAccess(user, groupId);
  return listChoirResourceRequestsJson(groupId, user.id);
}
