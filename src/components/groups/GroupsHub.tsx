"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { campuses, getCampus } from "@/lib/site";
import type { GroupCategory, GroupDetail, GroupSummary } from "@/lib/group-types";
import { groupCategoryLabels } from "@/lib/group-types";
import { buildTrackedJoinUrl, isTrackableJoinUrl } from "@/lib/meeting-join-utils";
import { Button, Card, ExternalLink } from "@/components/ui";

type Tab = "discover" | "mine" | "create";

const categories: GroupCategory[] = [
  "ministry",
  "choir",
  "small-group",
  "youth",
  "other",
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function GroupsHub() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const groupFromUrl = searchParams.get("group");
  const [tab, setTab] = useState<Tab>("discover");
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [myGroups, setMyGroups] = useState<GroupSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GroupCategory>("ministry");
  const [campusId, setCampusId] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [meetingSchedule, setMeetingSchedule] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const filteredGroups = useMemo(() => {
    if (tab === "mine") return myGroups;
    return groups;
  }, [tab, groups, myGroups]);

  async function loadLists() {
    const [discoverRes, mineRes] = await Promise.all([
      fetch("/api/groups"),
      user ? fetch("/api/groups?mine=1") : Promise.resolve(null),
    ]);

    const discoverData = await discoverRes.json();
    if (discoverRes.ok) {
      setGroups(discoverData.groups ?? []);
    }

    if (mineRes) {
      const mineData = await mineRes.json();
      if (mineRes.ok) {
        setMyGroups(mineData.groups ?? []);
      }
    }
  }

  async function loadDetail(groupId: string) {
    setSelectedId(groupId);
    const response = await fetch(`/api/groups?id=${encodeURIComponent(groupId)}`);
    const data = await response.json();
    if (response.ok) {
      setDetail(data.group ?? null);
    } else {
      setDetail(null);
      setStatus(data.error ?? "Could not load group.");
    }
  }

  useEffect(() => {
    loadLists().then(() => {
      if (groupFromUrl) {
        loadDetail(groupFromUrl);
      }
    });
  }, [user, groupFromUrl]);

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
      return false;
    }

    await loadLists();
    if (selectedId && body.groupId) {
      await loadDetail(String(body.groupId));
    }
    return true;
  }

  async function createGroup() {
    const ok = await runAction({
      action: "create",
      name,
      description,
      category,
      campusId: campusId || undefined,
      visibility,
      meetingSchedule,
      meetingLink,
    });

    if (!ok) return;

    setName("");
    setDescription("");
    setCategory("ministry");
    setCampusId("");
    setVisibility("public");
    setMeetingSchedule("");
    setMeetingLink("");
    setStatus("Group created. You're the group leader.");
    setTab("mine");
  }

  if (loading) {
    return <Card>Loading account...</Card>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["discover", "Discover"],
              ["mine", "My groups"],
              ["create", "Create"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                if (key !== "discover" && key !== "mine") {
                  setSelectedId(null);
                  setDetail(null);
                }
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                tab === key
                  ? "bg-night-900 text-sand-50"
                  : "bg-sand-100 text-night-700 hover:bg-sand-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "create" ? (
          <div>
            {!user ? (
              <div className="rounded-2xl bg-sand-50 px-4 py-5 text-sm text-night-700">
                <p className="font-semibold text-night-900">Sign in to create a group</p>
                <p className="mt-2">
                  Start a choir team, men&apos;s ministry, small group, or any other gathering.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button href="/sign-in?next=/groups">Sign in</Button>
                  <Button href="/sign-up?next=/groups" variant="secondary">
                    Join
                  </Button>
                </div>
              </div>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  createGroup();
                }}
              >
                <label className="block text-sm">
                  <span className="font-semibold text-night-800">Group name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Men's Ministry, Choir, etc."
                    className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                    required
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-night-800">Category</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as GroupCategory)}
                    className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                  >
                    {categories.map((value) => (
                      <option key={value} value={value}>
                        {groupCategoryLabels[value]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-night-800">Description</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    placeholder="Who is this group for and what do you do together?"
                    className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                    required
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-night-800">Campus (optional)</span>
                  <select
                    value={campusId}
                    onChange={(event) => setCampusId(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                  >
                    <option value="">All campuses</option>
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name} · {campus.city}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-night-800">Visibility</span>
                  <select
                    value={visibility}
                    onChange={(event) =>
                      setVisibility(event.target.value as "public" | "private")
                    }
                    className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                  >
                    <option value="public">Public — anyone can find and join</option>
                    <option value="private">Private — members only</option>
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-night-800">Meeting time (optional)</span>
                  <input
                    value={meetingSchedule}
                    onChange={(event) => setMeetingSchedule(event.target.value)}
                    placeholder="Saturdays 9:00 AM"
                    className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-night-800">Meeting link (optional)</span>
                  <input
                    value={meetingLink}
                    onChange={(event) => setMeetingLink(event.target.value)}
                    placeholder="Zoom, Teams, or group chat link"
                    className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                  />
                </label>

                <Button type="submit" disabled={busy || name.trim().length < 2}>
                  {busy ? "Creating..." : "Create group"}
                </Button>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => loadDetail(group.id)}
                className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                  selectedId === group.id
                    ? "bg-night-900 text-sand-50"
                    : "bg-sand-50 hover:bg-sand-100"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{group.name}</p>
                  {group.isMember && (
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase">
                      Joined
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs opacity-80">
                  {groupCategoryLabels[group.category]}
                  {group.campusId ? ` · ${getCampus(group.campusId).city}` : ""}
                </p>
                <p className="mt-1 line-clamp-2 text-sm opacity-80">{group.description}</p>
                <p className="mt-2 text-[11px] opacity-60">
                  {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
                </p>
              </button>
            ))}

            {filteredGroups.length === 0 && (
              <p className="rounded-2xl bg-sand-50 px-3 py-4 text-sm text-night-600">
                {tab === "mine"
                  ? user
                    ? "You haven't joined any groups yet. Browse Discover or create one."
                    : "Sign in to see your groups."
                  : "No groups yet. Be the first to create one."}
              </p>
            )}

            {tab === "mine" && !user && (
              <div className="mt-2 flex gap-2">
                <Button href="/sign-in?next=/groups">Sign in</Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="min-h-[420px]">
        {detail ? (
          <div>
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setDetail(null);
              }}
              className="mb-4 text-sm font-semibold text-night-600 lg:hidden"
            >
              ← Back to list
            </button>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-semibold text-night-700">
                  {groupCategoryLabels[detail.category]}
                </span>
                <h2 className="mt-2 font-display text-2xl font-semibold text-night-900">
                  {detail.name}
                </h2>
                <p className="mt-1 text-sm text-night-500">
                  Led by {detail.creatorName}
                  {detail.campusId ? ` · ${getCampus(detail.campusId).name}` : ""}
                  {" · "}
                  {detail.visibility === "public" ? "Public" : "Private"}
                </p>
              </div>

              {user && (
                <div className="flex flex-wrap gap-2">
                  {detail.isMember ? (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={async () => {
                        const ok = await runAction({
                          action: "leave",
                          groupId: detail.id,
                        });
                        if (ok) {
                          setDetail(null);
                          setSelectedId(null);
                          setStatus("You left the group.");
                        }
                      }}
                    >
                      Leave
                    </Button>
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
              )}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-night-700">{detail.description}</p>

            {(detail.meetingSchedule || detail.meetingLink) && (
              <div className="mt-4 rounded-2xl bg-sand-50 px-4 py-3 text-sm text-night-700">
                {detail.meetingSchedule && (
                  <p>
                    <span className="font-semibold">When:</span> {detail.meetingSchedule}
                  </p>
                )}
                {detail.meetingLink && (
                  <p className={detail.meetingSchedule ? "mt-2" : ""}>
                    <span className="font-semibold">Link:</span>{" "}
                    {isTrackableJoinUrl(detail.meetingLink) ? (
                      <a
                        href={buildTrackedJoinUrl({
                          groupId: detail.id,
                          source: "group_page",
                        })}
                        className="font-semibold text-night-900 underline"
                      >
                        Open meeting link
                      </a>
                    ) : (
                      <ExternalLink
                        href={detail.meetingLink}
                        className="font-semibold text-night-900 underline"
                      >
                        Open meeting link
                      </ExternalLink>
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-night-500">
                Members ({detail.members.length})
              </h3>
              <div className="mt-3 space-y-2">
                {detail.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl bg-sand-50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-night-900">{member.name}</p>
                      <p className="text-xs text-night-500">
                        {getCampus(member.campusId).city}
                        {member.id === detail.createdBy ? " · Leader" : ""}
                      </p>
                    </div>
                    {detail.isAdmin &&
                      user &&
                      member.id !== user.id &&
                      member.id !== detail.createdBy && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            if (
                              !window.confirm(`Remove ${member.name} from this group?`)
                            ) {
                              return;
                            }
                            await runAction({
                              action: "remove-member",
                              groupId: detail.id,
                              memberId: member.id,
                            });
                          }}
                          className="text-xs font-semibold text-red-700 underline"
                        >
                          Remove
                        </button>
                      )}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-xs text-night-400">Created {formatTime(detail.createdAt)}</p>

            {detail.isAdmin && user && (
              <div className="mt-6 border-t border-night-900/5 pt-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        `Delete "${detail.name}"? This cannot be undone.`,
                      )
                    ) {
                      return;
                    }
                    const ok = await runAction({ action: "delete", groupId: detail.id });
                    if (ok) {
                      setDetail(null);
                      setSelectedId(null);
                      setStatus("Group deleted.");
                    }
                  }}
                  className="text-sm font-semibold text-red-700 underline"
                >
                  Delete group
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
            <p className="font-display text-xl font-semibold text-night-900">
              Church groups & ministries
            </p>
            <p className="mt-2 max-w-md text-sm text-night-600">
              Create or join groups like choir, men&apos;s ministry, youth, prayer teams, and
              small groups. Signed-in members can start new groups anytime.
            </p>
            {!user && (
              <div className="mt-4 flex gap-2">
                <Button href="/sign-in?next=/groups">Sign in</Button>
                <Button href="/sign-up?next=/groups" variant="secondary">
                  Create account
                </Button>
              </div>
            )}
          </div>
        )}

        {status && (
          <p
            className={`mt-4 rounded-xl px-3 py-2 text-sm ${
              status.includes("wrong") ||
              status.includes("Could not") ||
              status.includes("must")
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-800"
            }`}
          >
            {status}
          </p>
        )}
      </Card>
    </div>
  );
}
