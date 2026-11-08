import {
  communityPostVisualType,
  communityPostVisualTypeLabel,
  type CommunityPostVisualType,
} from "@/lib/community-post-display";
import type { CommunityPost } from "@/lib/member-types";

const BADGE_CLASS: Record<CommunityPostVisualType, string> = {
  prayer: "community-post-type-badge--prayer",
  praise: "community-post-type-badge--praise",
  testimony: "community-post-type-badge--testimony",
  update: "community-post-type-badge--update",
  event: "community-post-type-badge--event",
  urgent: "community-post-type-badge--urgent",
};

export function CommunityPostTypeBadge({
  post,
  isUrgentAlert = false,
  className = "",
}: {
  post: Pick<CommunityPost, "type" | "content">;
  isUrgentAlert?: boolean;
  className?: string;
}) {
  const visualType = communityPostVisualType(post, { isUrgentAlert });
  const label = communityPostVisualTypeLabel(visualType);

  return (
    <span
      className={`community-post-type-badge ${BADGE_CLASS[visualType]} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
