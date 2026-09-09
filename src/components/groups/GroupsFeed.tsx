import { GroupListItem } from "@/components/groups/GroupListItem";
import { GroupPremiumSummaryBar } from "@/components/groups/GroupPremiumUI";
import type { GroupSummary } from "@/lib/group-types";

export function GroupsFeed({ groups }: { groups: GroupSummary[] }) {
  const joinedCount = groups.filter((group) => group.isMember).length;

  return (
    <div>
      <GroupPremiumSummaryBar
        totalLabel={`${groups.length} group${groups.length === 1 ? "" : "s"}`}
        secondaryLabel={
          joinedCount > 0
            ? `${joinedCount} joined`
            : groups.length > 0
              ? "Browse to join"
              : undefined
        }
      />
      <div className="grid gap-2.5">
        {groups.map((group) => (
          <GroupListItem key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
