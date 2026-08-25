export {
  type ArtworkVariant,
  type ArtworkFields,
  ARTWORK_VARIANTS,
  artworkField as devotionArtworkField,
  getContentArtwork,
} from "@/lib/content-artwork";

import type { ArtworkFields, ArtworkVariant } from "@/lib/content-artwork";
import { getContentArtwork } from "@/lib/content-artwork";

export function getDevotionArtwork(
  record: ArtworkFields & { id: string },
  prefer: ArtworkVariant = "wide",
) {
  return (
    getContentArtwork(record, prefer) ??
    `/api/devotions/thumbnail?id=${encodeURIComponent(record.id)}&variant=${prefer}`
  );
}
