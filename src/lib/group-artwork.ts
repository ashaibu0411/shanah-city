import type { ArtworkVariant } from "@/lib/content-artwork";
import type { GroupCategory } from "@/lib/group-types";

export function getGroupArtwork(
  group: {
    id: string;
    name: string;
    category: GroupCategory;
    description?: string;
  },
  variant: ArtworkVariant = "square",
) {
  const params = new URLSearchParams({
    id: group.id,
    variant,
  });
  return `/api/groups/thumbnail?${params.toString()}`;
}
