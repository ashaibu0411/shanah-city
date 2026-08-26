import { GroupListItem } from "@/components/groups/GroupListItem";
import type { GroupSummary } from "@/lib/group-types";

export function GroupsFeed({ groups }: { groups: GroupSummary[] }) {
  return (
    <div className="grid gap-3">
      {groups.map((group) => (
        <GroupListItem key={group.id} group={group} />
      ))}
    </div>
  );
}
