"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppShell } from "@/components/app/AppShellContext";
import { GroupChatPanel } from "@/components/groups/GroupChatPanel";
import { GroupMemberAddForm } from "@/components/groups/GroupMemberAddForm";
import { GroupPollsPanel } from "@/components/groups/GroupPollsPanel";
import { GroupCalendarPanel } from "@/components/calendar/GroupCalendarPanel";
import { LeaderReportForm } from "@/components/ministry-reports/LeaderReportForm";
import { Button, Card, ExternalLink } from "@/components/ui";
import {
  groupHasEmbeddedCalendar,
  unavailabilityCalendarGroupForId,
} from "@/lib/church-groups";
import { getCampus } from "@/lib/site";
import { remainingAdminCount } from "@/lib/group-admin-utils";
import { isReportableMinistryGroup } from "@/lib/ministry-report-types";
import type { GroupDetail, GroupMemberPreview } from "@/lib/group-types";
import { groupCategoryLabels } from "@/lib/group-types";
import { getGroupArtwork } from "@/lib/group-artwork";

type DetailSection = "overview" | "chat" | "polls" | "report" | "calendar";

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function memberRoleLabel(member: GroupMemberPreview) {
  if (member.isCreator && member.isAdmin) return "Creator · Leader";
  if (member.isCreator) return "Creator";
  if (member.isAdmin) return "Leader";
  if (member.isAssistantLeader) return "Assistant leader";
  return "Member";
}

function GroupArtworkHero({ group }: { group: GroupDetail }) {
  const artworkUrl = getGroupArtwork(group, "wide");

  return (
    <div className="-mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl sm:-mx-6 sm:-mt-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={artworkUrl} alt="" className="aspect-[16/9] w-full object-cover" />
    </div>
  );
}

export function GroupDetailView({
  initialGroup,
  initialSection = "overview",
}: {
  initialGroup: GroupDetail;
  initialSection?: DetailSection;
}) {
  const router = useRouter();
  const { user, refresh, permissions } = useAuth();
  const { setMessagesImmersive } = useAppShell();
  const [detail, setDetail] = useState(initialGroup);
  const [detailSection, setDetailSection] = useState<DetailSection>(initialSection);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);

  useEffect(() => {
    setDetail(initialGroup);
  }, [initialGroup]);

  useEffect(() => {
    setDetailSection(initialSection);
  }, [initialSection, initialGroup.id]);

  useEffect(() => {
    const immersive = detailSection === "chat" && detail.isMember && Boolean(user);
    setMessagesImmersive(immersive);
    if (immersive) {
      document.body.dataset.messagesImmersive = "true";
    } else {
      delete document.body.dataset.messagesImmersive;
    }
    return () => {
      setMessagesImmersive(false);
      delete document.body.dataset.messagesImmersive;
    };
  }, [detailSection, detail.isMember, user, setMessagesImmersive]);

  async function loadDetail(groupId: string) {
    const response = await fetch(`/api/groups?id=${encodeURIComponent(groupId)}`);
    const data = await response.json();
    if (response.ok) {
      setDetail(data.group ?? initialGroup);
    } else {
      setStatus(data.error ?? "Could not load group.");
    }
  }

  async function runAction(body: Record<string, unknown>) {
    setBusy(true);
    setStatus("");
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Something went wrong.");
      setStatusIsError(true);
      return false;
    }

    setStatusIsError(false);

    if (
      body.action === "join" ||
      body.action === "remove-member" ||
      body.action === "add-member"
    ) {
      await refresh();
    }

    const groupId = body.groupId ? String(body.groupId) : detail.id;
    await loadDetail(groupId);
    router.refresh();
    return true;
  }

  const showEmbeddedCalendar =
    detail.isMember && groupHasEmbeddedCalendar(detail);
  const showLeaderReport =
    detail.isAdmin &&
    isReportableMinistryGroup({ id: detail.id, name: detail.name, category: detail.category });
  const canManageMembers =
    Boolean(user) &&
    (detail.isAdmin || detail.isAssistantLeader || permissions.canManageAdmin);
  const canManageLeadership =
    Boolean(user) && (detail.isAdmin || permissions.canManageAdmin);
  const isSiteAdminManaging = permissions.canManageAdmin && !detail.isAdmin;

  if (detailSection === "chat" && detail.isMember && user) {
    return (
      <GroupChatPanel
        groupId={detail.id}
        groupName={detail.name}
        groupCategory={detail.category}
        userId={user.id}
        memberCount={detail.members.length}
        onBack={() => setDetailSection("overview")}
      />
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <GroupArtworkHero group={detail} />

      <div className="mb-4">
        <Link
          href="/groups"
          className="inline-flex items-center gap-1 text-sm font-semibold text-night-600 hover:text-night-900"
        >
          ← All groups
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-semibold text-night-700">
            {groupCategoryLabels[detail.category]}
          </span>
          <h1 className="mt-2 font-display text-2xl font-semibold text-night-900 sm:text-3xl">
            {detail.name}
          </h1>
          <p className="mt-1 text-sm text-night-500">
            Led by {detail.creatorName}
            {detail.campusId ? ` · ${getCampus(detail.campusId).name}` : ""}
            {" · "}
            {detail.visibility === "public" ? "Public" : "Private"}
            {" · "}
            {detail.members.length} member{detail.members.length === 1 ? "" : "s"}
          </p>
        </div>

        {user ? (
          <div className="flex flex-wrap gap-2">
            {detail.isMember ? (
              <p className="rounded-xl bg-sand-100 px-3 py-2 text-sm text-night-600">
                {canManageLeadership
                  ? showLeaderReport
                    ? "Manage members and leadership below. Submit the Monthly report tab each month."
                    : canManageMembers && detail.isAssistantLeader
                      ? "Assistant leaders can add and remove members. Only group leaders assign leadership roles."
                      : "Group leaders can add members, assign assistant leaders, and remove people below."
                  : "Only your group leader can remove you from this group."}
              </p>
            ) : isSiteAdminManaging ? (
              <p className="rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-900">
                Admin access — search app members or add by email, then assign a group leader to run
                this team.
              </p>
            ) : (
              <Button
                disabled={busy}
                onClick={() =>
                  runAction({ action: "join", groupId: detail.id }).then((ok) => {
                    if (ok) setStatus(`You joined ${detail.name}.`);
                  })
                }
              >
                Join group
              </Button>
            )}
          </div>
        ) : (
          <Button href={`/sign-in?next=/groups/${detail.id}`}>Sign in to join</Button>
        )}
      </div>

      {detail.isMember && user ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              { id: "overview", label: "Overview" },
              ...(showLeaderReport
                ? [{ id: "report" as const, label: "Monthly report" }]
                : []),
              ...(showEmbeddedCalendar
                ? [{ id: "calendar" as const, label: "Calendar" }]
                : []),
              { id: "polls", label: "Polls" },
              { id: "chat", label: "Group chat" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDetailSection(item.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                detailSection === item.id
                  ? "bg-night-900 text-sand-50"
                  : "bg-sand-100 text-night-700 hover:bg-sand-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}


      {detailSection === "polls" && detail.isMember && user ? (
        <GroupPollsPanel groupId={detail.id} groupName={detail.name} isAdmin={detail.isAdmin} />
      ) : detailSection === "report" && showLeaderReport && user ? (
        <LeaderReportForm embedded groupId={detail.id} groupName={detail.name} />
      ) : detailSection === "calendar" && showEmbeddedCalendar && user ? (
        <GroupCalendarPanel
          groupId={detail.id}
          groupLabel={detail.name}
          signInNextUrl={`/groups/${detail.id}?calendar=1`}
          showWorshipPlanner={permissions.canAccessWorshipPlanner}
          unavailabilityGroup={unavailabilityCalendarGroupForId(detail.id)}
        />
      ) : detailSection === "overview" ? (
        <>
          <p className="mt-4 text-sm leading-relaxed text-night-700">{detail.description}</p>

          {(detail.meetingSchedule || detail.meetingLink) && (
            <div className="mt-4 rounded-2xl bg-sand-50 px-4 py-3 text-sm text-night-700">
              {detail.meetingSchedule ? (
                <p>
                  <span className="font-semibold">When:</span> {detail.meetingSchedule}
                </p>
              ) : null}
              {detail.meetingLink ? (
                <p className={detail.meetingSchedule ? "mt-2" : ""}>
                  <span className="font-semibold">Link:</span>{" "}
                  <ExternalLink
                    href={detail.meetingLink}
                    className="font-semibold text-night-900 underline"
                  >
                    Open meeting link
                  </ExternalLink>
                </p>
              ) : null}
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-night-500">
              Members ({detail.members.length})
            </h3>

            {canManageMembers ? (
              <GroupMemberAddForm
                groupId={detail.id}
                disabled={busy}
                onAdded={async () => {
                  await refresh();
                  await loadDetail(detail.id);
                  router.refresh();
                }}
                onStatus={(message, isError) => {
                  setStatus(message);
                  setStatusIsError(Boolean(isError));
                }}
              />
            ) : null}

            {detail.members.length === 0 ? (
              <p className="mt-3 text-sm text-night-500">
                {detail.visibility === "private" && !detail.isMember
                  ? "Member list is visible after you join this private group."
                  : "No members to show yet."}
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {detail.members.map((member) => {
                  const canManageMember =
                    canManageMembers && user && member.id !== user.id;
                  const leadersAfterChange = remainingAdminCount(detail, member.id);
                  const canPromoteLeader =
                    canManageLeadership &&
                    canManageMember &&
                    !member.isAdmin &&
                    !member.isAssistantLeader;
                  const canPromoteAssistant =
                    canManageLeadership &&
                    canManageMember &&
                    !member.isAdmin &&
                    !member.isAssistantLeader;
                  const canDemoteLeader =
                    canManageLeadership &&
                    canManageMember &&
                    member.isAdmin &&
                    leadersAfterChange >= 1;
                  const canDemoteAssistant =
                    canManageLeadership && canManageMember && member.isAssistantLeader;
                  const canRemoveRegular =
                    canManageMember &&
                    !member.isAdmin &&
                    !member.isAssistantLeader;
                  const canRemoveLeader =
                    canManageLeadership &&
                    canManageMember &&
                    member.isAdmin &&
                    leadersAfterChange >= 1;

                  return (
                    <div
                      key={member.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sand-50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-night-900">{member.name}</p>
                        <p className="text-xs text-night-500">
                          {getCampus(member.campusId).city} · {memberRoleLabel(member)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {detail.isMember && user && member.id !== user.id ? (
                          <Button
                            variant="secondary"
                            href={`/messages?member=${encodeURIComponent(member.id)}&name=${encodeURIComponent(member.name)}`}
                          >
                            Message
                          </Button>
                        ) : null}
                        {canManageMember &&
                        (canPromoteLeader ||
                          canPromoteAssistant ||
                          canDemoteLeader ||
                          canDemoteAssistant ||
                          canRemoveRegular ||
                          canRemoveLeader) ? (
                          <div className="flex flex-wrap gap-2">
                            {canPromoteLeader ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={async () => {
                                  const ok = await runAction({
                                    action: "promote-admin",
                                    groupId: detail.id,
                                    memberId: member.id,
                                  });
                                  if (ok) setStatus(`Made ${member.name} a group leader.`);
                                }}
                                className="text-xs font-semibold text-night-800 underline"
                              >
                                Make leader
                              </button>
                            ) : null}
                            {canPromoteAssistant ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={async () => {
                                  const ok = await runAction({
                                    action: "promote-assistant",
                                    groupId: detail.id,
                                    memberId: member.id,
                                  });
                                  if (ok) {
                                    setStatus(`Made ${member.name} an assistant leader.`);
                                  }
                                }}
                                className="text-xs font-semibold text-night-800 underline"
                              >
                                Make assistant
                              </button>
                            ) : null}
                            {canDemoteLeader ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={async () => {
                                  if (
                                    !window.confirm(
                                      `Remove ${member.name}'s leader role in this group?`,
                                    )
                                  ) {
                                    return;
                                  }
                                  const ok = await runAction({
                                    action: "demote-admin",
                                    groupId: detail.id,
                                    memberId: member.id,
                                  });
                                  if (ok) setStatus(`Removed ${member.name} as group leader.`);
                                }}
                                className="text-xs font-semibold text-night-700 underline"
                              >
                                Remove leader role
                              </button>
                            ) : null}
                            {canDemoteAssistant ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={async () => {
                                  const ok = await runAction({
                                    action: "demote-assistant",
                                    groupId: detail.id,
                                    memberId: member.id,
                                  });
                                  if (ok) {
                                    setStatus(`Removed ${member.name} as assistant leader.`);
                                  }
                                }}
                                className="text-xs font-semibold text-night-700 underline"
                              >
                                Remove assistant role
                              </button>
                            ) : null}
                            {canRemoveRegular || canRemoveLeader ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={async () => {
                                  if (!window.confirm(`Remove ${member.name} from this group?`)) {
                                    return;
                                  }
                                  const ok = await runAction({
                                    action: "remove-member",
                                    groupId: detail.id,
                                    memberId: member.id,
                                  });
                                  if (ok) setStatus(`Removed ${member.name} from ${detail.name}.`);
                                }}
                                className="text-xs font-semibold text-red-700 underline"
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-night-400">Created {formatTime(detail.createdAt)}</p>

          {detail.isAdmin && user ? (
            <div className="mt-6 border-t border-night-900/5 pt-4">
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (!window.confirm(`Delete "${detail.name}"? This cannot be undone.`)) {
                    return;
                  }
                  const ok = await runAction({ action: "delete", groupId: detail.id });
                  if (ok) {
                    router.push("/groups");
                  }
                }}
                className="text-sm font-semibold text-red-700 underline"
              >
                Delete group
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {status ? (
        <p
          className={`mt-4 rounded-xl px-3 py-2 text-sm ${
            statusIsError ||
            status.includes("wrong") ||
            status.includes("Could not") ||
            status.includes("must")
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {status}
        </p>
      ) : null}
    </Card>
  );
}
