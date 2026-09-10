"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppShell } from "@/components/app/AppShellContext";
import { MobileTabPills } from "@/components/app/MobileTabPills";
import { useAuth } from "@/components/auth/AuthProvider";
import { GroupsFeed } from "@/components/groups/GroupsFeed";
import { GroupsThisSundayCard } from "@/components/groups/GroupsThisSundayCard";
import { campuses } from "@/lib/site";
import type { GroupCategory, GroupSummary } from "@/lib/group-types";
import { groupCategoryLabels } from "@/lib/group-types";
import { Button, Card } from "@/components/ui";

type Tab = "discover" | "mine" | "create";

const categories: GroupCategory[] = ["ministry", "choir", "small-group", "youth", "other"];

export function GroupsHub() {
  const router = useRouter();
  const { isMobileApp } = useAppShell();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("discover");
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [myGroups, setMyGroups] = useState<GroupSummary[]>([]);
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

  useEffect(() => {
    loadLists();
  }, [user]);

  async function createGroup() {
    setBusy(true);
    setStatus("");
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        name,
        description,
        category,
        campusId: campusId || undefined,
        visibility,
        meetingSchedule,
        meetingLink,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Something went wrong.");
      return;
    }

    setName("");
    setDescription("");
    setCategory("ministry");
    setCampusId("");
    setVisibility("public");
    setMeetingSchedule("");
    setMeetingLink("");
    setStatus("Group created. Opening your new group…");
    await loadLists();

    if (data.group?.id) {
      router.push(`/groups/${data.group.id}`);
    }
  }

  if (loading) {
    return <Card>Loading account...</Card>;
  }

  return (
    <div>
      <MobileTabPills
        className="mb-4"
        tabs={[
          { id: "discover", label: "Discover" },
          { id: "mine", label: "My groups" },
          { id: "create", label: "Create" },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as Tab)}
      />

      {tab === "create" ? (
        <Card>
          {!user ? (
            <div className={`rounded-2xl px-4 py-5 text-sm text-night-700 ${
              isMobileApp
                ? "mobile-premium-section"
                : "bg-sand-50"
            }`}>
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
                  className={`mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 ${
                    isMobileApp
                      ? "mobile-field border-0"
                      : "border border-night-900/10 bg-white"
                  }`}
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="font-semibold text-night-800">Category</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as GroupCategory)}
                  className={`mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 ${
                    isMobileApp
                      ? "mobile-field border-0"
                      : "border border-night-900/10 bg-white"
                  }`}
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
                  className={`mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 ${
                    isMobileApp
                      ? "mobile-field border-0"
                      : "border border-night-900/10 bg-sand-50"
                  }`}
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="font-semibold text-night-800">Campus (optional)</span>
                <select
                  value={campusId}
                  onChange={(event) => setCampusId(event.target.value)}
                  className={`mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 ${
                    isMobileApp
                      ? "mobile-field border-0"
                      : "border border-night-900/10 bg-white"
                  }`}
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
                  onChange={(event) => setVisibility(event.target.value as "public" | "private")}
                  className={`mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 ${
                    isMobileApp
                      ? "mobile-field border-0"
                      : "border border-night-900/10 bg-white"
                  }`}
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
                  className={`mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 ${
                    isMobileApp
                      ? "mobile-field border-0"
                      : "border border-night-900/10 bg-white"
                  }`}
                />
              </label>

              <label className="block text-sm">
                <span className="font-semibold text-night-800">Meeting link (optional)</span>
                <input
                  value={meetingLink}
                  onChange={(event) => setMeetingLink(event.target.value)}
                  placeholder="Zoom, Teams, or external chat link"
                  className={`mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 ${
                    isMobileApp
                      ? "mobile-field border-0"
                      : "border border-night-900/10 bg-white"
                  }`}
                />
              </label>

              <Button type="submit" disabled={busy || name.trim().length < 2}>
                {busy ? "Creating..." : "Create group"}
              </Button>
            </form>
          )}
        </Card>
      ) : filteredGroups.length === 0 ? (
        <p className={`text-sm text-night-600 ${
          isMobileApp
            ? "mobile-card mobile-premium-surface p-5"
            : "rounded-2xl bg-white p-5 ring-1 ring-night-900/5"
        }`}>
          {tab === "mine"
            ? user
              ? "You haven't joined any groups yet. Browse Discover or create one."
              : "Sign in to see your groups."
            : "No groups yet. Be the first to create one."}
          {tab === "mine" && !user ? (
            <span className="mt-4 block">
              <Button href="/sign-in?next=/groups">Sign in</Button>
            </span>
          ) : null}
        </p>
      ) : (
        <>
          {user ? <GroupsThisSundayCard /> : null}
          <GroupsFeed groups={filteredGroups} />
        </>
      )}

      {status ? (
        <p
          className={`mt-4 rounded-xl px-3 py-2 text-sm ${
            status.includes("wrong") || status.includes("Could not")
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {status}
        </p>
      ) : null}
    </div>
  );
}
