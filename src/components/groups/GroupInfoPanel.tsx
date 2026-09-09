"use client";

import { useMemo } from "react";
import { getGroupArtwork } from "@/lib/group-artwork";
import { getCampus } from "@/lib/site";
import {
  GroupPremiumLeaderChip,
  GroupPremiumSectionLabel,
  GroupPremiumStackCard,
} from "@/components/groups/GroupPremiumUI";
import { groupsPremium } from "@/components/groups/groups-premium";
import { CouplesDevotionBanner } from "@/components/groups/CouplesDevotionBanner";
import { Button, ExternalLink } from "@/components/ui";
import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";
import type { GroupDetail, GroupMemberPreview } from "@/lib/group-types";
import { groupCategoryLabels } from "@/lib/group-types";

function memberRoleLabel(member: GroupMemberPreview) {
  if (member.isCreator && member.isAdmin) return "Creator · Leader";
  if (member.isCreator) return "Creator";
  if (member.isAdmin) return "Leader";
  if (member.isAssistantLeader) return "Assistant leader";
  return "Member";
}

function formatCreated(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type GroupInfoPanelProps = {
  detail: GroupDetail;
  leaderNames: string[];
  userId?: string;
  showMessageActions?: boolean;
};

export function GroupInfoPanel({
  detail,
  leaderNames,
  userId,
  showMessageActions = false,
}: GroupInfoPanelProps) {
  const iconSrc = useMemo(() => getGroupArtwork(detail, "square"), [detail]);

  return (
    <>
      <GroupPremiumStackCard>
        <GroupPremiumSectionLabel>About</GroupPremiumSectionLabel>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          <div className={`${groupsPremium.iconTile} h-16 w-16 shrink-0 rounded-2xl`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={iconSrc} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={groupsPremium.statusChip}>
                {groupCategoryLabels[detail.category]}
              </span>
              <span className={groupsPremium.statusChip}>
                {detail.members.length} member{detail.members.length === 1 ? "" : "s"}
              </span>
            </div>
            {detail.campusId ? (
              <p className={`${groupsPremium.cardMeta} mt-2`}>{getCampus(detail.campusId).name}</p>
            ) : null}
          </div>
        </div>

        {leaderNames.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold tracking-tight text-night-600">Leaders</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {leaderNames.map((name) => (
                <GroupPremiumLeaderChip key={name} name={name} />
              ))}
            </div>
          </div>
        ) : null}

        {detail.description ? (
          <p className="mt-4 text-sm leading-relaxed text-night-700">{detail.description}</p>
        ) : null}

        {detail.id === SHANAH_POWER_COUPLES_GROUP_ID ? (
          <CouplesDevotionBanner className="mt-4" />
        ) : null}
      </GroupPremiumStackCard>

      {(detail.meetingSchedule || detail.meetingLink) && (
        <GroupPremiumStackCard>
          <GroupPremiumSectionLabel>Next meeting</GroupPremiumSectionLabel>
          <div className="mt-3 space-y-2">
            {detail.meetingSchedule ? (
              <div className={groupsPremium.rowInset}>
                <span className="text-sm font-semibold text-night-800">When</span>
                <span className="text-sm text-night-700">{detail.meetingSchedule}</span>
              </div>
            ) : null}
            {detail.meetingLink ? (
              <div className={groupsPremium.rowInset}>
                <span className="text-sm font-semibold text-night-800">Link</span>
                <ExternalLink
                  href={detail.meetingLink}
                  className="text-sm font-semibold text-night-900 underline"
                >
                  Open meeting link
                </ExternalLink>
              </div>
            ) : null}
          </div>
        </GroupPremiumStackCard>
      )}

      <GroupPremiumStackCard>
        <GroupPremiumSectionLabel>
          Members ({detail.members.length})
        </GroupPremiumSectionLabel>

        {detail.members.length === 0 ? (
          <p className="mt-3 text-sm text-night-500">No members to show yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {detail.members.map((member) => (
              <div key={member.id} className={`${groupsPremium.rowInset} flex-wrap`}>
                <div>
                  <p className="text-sm font-medium text-night-900">{member.name}</p>
                  <p className="text-xs text-night-500">
                    {getCampus(member.campusId).city} · {memberRoleLabel(member)}
                  </p>
                </div>
                {showMessageActions && userId && member.id !== userId ? (
                  <Button
                    variant="secondary"
                    href={`/messages?member=${encodeURIComponent(member.id)}&name=${encodeURIComponent(member.name)}`}
                  >
                    Message
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </GroupPremiumStackCard>

      <GroupPremiumStackCard>
        <p className="text-xs text-night-400">Created {formatCreated(detail.createdAt)}</p>
      </GroupPremiumStackCard>
    </>
  );
}
