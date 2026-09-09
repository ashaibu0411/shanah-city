import type { ArtworkVariant } from "@/lib/content-artwork";
import type { GroupCategory } from "@/lib/group-types";
import { getGroupIconApiUrl, isGroupIconRef } from "@/lib/group-icon-utils";

export function getGroupArtwork(
  group: {
    id: string;
    name: string;
    category: GroupCategory;
    description?: string;
    iconUrl?: string;
    updatedAt?: string;
  },
  variant: ArtworkVariant = "square",
) {
  if (isGroupIconRef(group.iconUrl)) {
    return getGroupIconApiUrl(group.id, group.updatedAt ?? group.iconUrl);
  }

  const params = new URLSearchParams({
    id: group.id,
    variant,
  });
  return `/api/groups/thumbnail?${params.toString()}`;
}
