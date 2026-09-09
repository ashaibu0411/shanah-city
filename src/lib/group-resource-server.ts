import type { PublicMember } from "@/lib/auth-types";
import { assertGroupResourceAccess } from "@/lib/couple-prayer-access-server";
import type { CreateGroupResourceInput } from "@/lib/group-resource-types";
import { useDatabase } from "@/lib/use-database";
import * as groupResourceDb from "@/lib/stores/group-resource-db";
import * as groupResourceJson from "@/lib/stores/group-resource-json";

const store = () => (useDatabase() ? groupResourceDb : groupResourceJson);

export async function listGroupResources(groupId: string, viewer: PublicMember | null) {
  await assertGroupResourceAccess(viewer, groupId, "read");
  return store().getGroupResources(groupId);
}

export async function createGroupResourceForUser(
  viewer: PublicMember,
  input: Omit<CreateGroupResourceInput, "createdBy" | "createdByName">,
) {
  await assertGroupResourceAccess(viewer, input.groupId, "write");
  if (!input.title.trim()) {
    throw new Error("Title is required.");
  }
  return store().createGroupResource({
    ...input,
    createdBy: viewer.id,
    createdByName: viewer.name,
  });
}

export async function updateGroupResourceForUser(
  viewer: PublicMember,
  id: string,
  update: Parameters<typeof groupResourceDb.updateGroupResource>[1],
) {
  const existing = await store().getGroupResourceById(id);
  if (!existing) {
    throw new Error("Resource not found.");
  }
  await assertGroupResourceAccess(viewer, existing.groupId, "write");
  return store().updateGroupResource(id, update);
}

export async function deleteGroupResourceForUser(viewer: PublicMember, id: string) {
  const existing = await store().getGroupResourceById(id);
  if (!existing) {
    throw new Error("Resource not found.");
  }
  await assertGroupResourceAccess(viewer, existing.groupId, "write");
  await store().deleteGroupResource(id);
}
