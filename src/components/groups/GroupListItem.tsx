import Link from "next/link";
import { getCampus } from "@/lib/site";
import type { GroupSummary } from "@/lib/group-types";
import { groupCategoryLabels } from "@/lib/group-types";
import { getGroupArtwork } from "@/lib/group-artwork";

export function GroupListItem({ group }: { group: GroupSummary }) {
  const artworkUrl = getGroupArtwork(group, "square");
  const campusLabel = group.campusId ? getCampus(group.campusId).city : null;

  return (
    <Link
      href={`/groups/${group.id}`}
      className="group flex items-center gap-4 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-night-900/5 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-night-900/10"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-night-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artworkUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sand-600">
            {groupCategoryLabels[group.category]}
            {campusLabel ? ` · ${campusLabel}` : ""}
          </p>
          {group.isMember ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
              Joined
            </span>
          ) : null}
        </div>
        <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-night-900 group-hover:text-night-700">
          {group.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-night-600">{group.description}</p>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-xs font-medium text-night-500">
          {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-sm font-semibold text-night-600 group-hover:text-night-900">
          Open →
        </p>
      </div>
    </Link>
  );
}
