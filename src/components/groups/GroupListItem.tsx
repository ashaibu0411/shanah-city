import Link from "next/link";
import { GroupPremiumChevron } from "@/components/groups/GroupPremiumUI";
import { groupsPremium } from "@/components/groups/groups-premium";
import { getCampus } from "@/lib/site";
import type { GroupSummary } from "@/lib/group-types";
import { getGroupArtwork } from "@/lib/group-artwork";

export function GroupListItem({ group }: { group: GroupSummary }) {
  const artworkUrl = getGroupArtwork(group, "square");
  const campusLabel = group.campusId ? getCampus(group.campusId).city : null;
  const preview = group.description.trim() || (campusLabel ? `${campusLabel} · Ministry group` : "Tap to open group");

  return (
    <Link href={`/groups/${group.id}`} className={groupsPremium.listRow}>
      <span className={groupsPremium.iconTile}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artworkUrl} alt="" className={groupsPremium.iconTileImage} />
      </span>

      <div className="min-w-0 flex-1">
        <p className={`${groupsPremium.listTitle} truncate`}>{group.name}</p>
        <p className="mt-0.5 line-clamp-1 text-sm text-night-500">{preview}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {group.trainingPending ? (
          <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Training
          </span>
        ) : group.isMember ? (
          <span className={groupsPremium.unreadBadge}>✓</span>
        ) : (
          <span className={groupsPremium.unreadBadgeMuted}>
            {group.memberCount > 99 ? "99+" : group.memberCount}
          </span>
        )}
        <GroupPremiumChevron />
      </div>
    </Link>
  );
}
