"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { ChoirTeamTabs, type ChoirTeamTabId } from "@/components/groups/choir/team/ChoirTeamTabs";
import { TeamAssignmentCard } from "@/components/groups/choir/team/TeamAssignmentCard";
import { CHOIR_HERO_IMAGE_PATH, SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { choirAvailabilityTimeAwayHref } from "@/lib/choir-availability-links";
import type { ChoirTeamAssignmentView, ChoirTeamPagePayload } from "@/lib/choir-team-types";
import { worshipPlannerPath } from "@/lib/worship-plan-links";
import "../choir-premium.css";

type ChoirTeamPageProps = {
  groupId: string;
};

type UnavailabilityRow = {
  id: string;
  personName: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
};

function parseTab(value: string | null): ChoirTeamTabId {
  if (value === "members" || value === "roles" || value === "availability") return value;
  return "assignments";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ChoirTeamPage({ groupId }: ChoirTeamPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<ChoirTeamTabId>(() => parseTab(searchParams.get("tab")));
  const [payload, setPayload] = useState<ChoirTeamPagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<ChoirTeamAssignmentView | null>(null);
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState<"all" | "leadership" | "vocal" | "musician">("all");
  const [unavailability, setUnavailability] = useState<UnavailabilityRow[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-team?groupId=${encodeURIComponent(groupId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.payload) {
          setError(data.error ?? "Could not load team page.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load team page.");
        setLoading(false);
      });
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    if (tab !== "availability") return;
    fetch("/api/unavailability?group=choir")
      .then((response) => response.json())
      .then((data) => {
        if (data.requests) {
          setUnavailability(data.requests);
        }
      })
      .catch(() => undefined);
  }, [tab]);

  const filteredMembers = useMemo(() => {
    const members = payload?.teamMembers ?? [];
    const query = search.trim().toLowerCase();
    return members.filter((member) => {
      if (memberFilter === "leadership" && !member.isLeadership) return false;
      if (memberFilter === "vocal" && !member.roleLabel.toLowerCase().includes("vocal")) return false;
      if (memberFilter === "musician") {
        const role = member.roleLabel.toLowerCase();
        if (role.includes("vocal") || member.isLeadership) return false;
        if (!role.includes("keys") && !role.includes("drums") && !role.includes("guitar") && !role.includes("musician")) {
          return false;
        }
      }
      if (!query) return true;
      return (
        member.name.toLowerCase().includes(query) ||
        member.roleLabel.toLowerCase().includes(query) ||
        (member.sectionLabel?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [payload?.teamMembers, search, memberFilter]);

  function changeTab(next: ChoirTeamTabId) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  async function confirmAssignment(assignment: ChoirTeamAssignmentView, ready: boolean) {
    const response = await fetch("/api/worship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark_ready",
        serviceDate: assignment.serviceDate,
        serviceTime: assignment.serviceTime,
        ready,
      }),
    });
    const data = await response.json();
    if (response.ok && data.plan) {
      load();
      setSelectedAssignment((current) =>
        current && current.id === assignment.id
          ? { ...current, status: ready ? "confirmed" : "assigned" }
          : current,
      );
    }
  }

  if (loading) {
    return (
      <div className="choir-group-home choir-team-page choir-calendar-page px-4 py-3">
        <p className="text-sm text-[var(--choir-muted)]">Loading worship team…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="choir-group-home choir-team-page choir-calendar-page px-4 py-3">
        <p className="text-sm text-red-700">{error ?? "Unavailable."}</p>
        <button type="button" className="choir-setlist-manage-link mt-3" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const upcomingPreview = payload.upcoming.slice(0, 3);
  const recentPreview = payload.recent.slice(0, 3);

  return (
    <div className="choir-group-home choir-team-page choir-calendar-page choir-page-shell space-y-[18px] pb-10">
      <ChoirSetlistHeader groupId={groupId} chatHref={payload.groupChatHref} />

      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Worship team</h1>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">Assignments, roles, and availability.</p>
      </div>

      <ChoirTeamTabs active={tab} onChange={changeTab} />

      {tab === "assignments" ? (
        <div className="space-y-5">
          <div className="choir-calendar-hero choir-page-bleed">
            <Image src={CHOIR_HERO_IMAGE_PATH} alt="" fill className="object-cover object-center" sizes="100vw" priority />
            <div className="choir-calendar-hero-overlay" />
            <div className="choir-calendar-hero-copy">
              <p className="choir-calendar-hero-kicker">Worship team</p>
              <h2 className="choir-calendar-hero-title font-display">
                Different Gifts.
                <br />
                One Sound.
              </h2>
              <p className="choir-calendar-hero-sub">Serving together to create an atmosphere for God&apos;s presence.</p>
            </div>
          </div>

          <section aria-labelledby="choir-upcoming-assignments">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 id="choir-upcoming-assignments" className="choir-section-heading text-base">
                My upcoming assignments
              </h2>
              {payload.upcoming.length > 3 ? (
                <button type="button" className="text-xs font-bold text-[var(--choir-gold-dark)]" onClick={() => changeTab("assignments")}>
                  See all
                </button>
              ) : null}
            </div>
            {upcomingPreview.length === 0 ? (
              <div className="choir-card p-5 text-center">
                <p className="font-bold text-[var(--choir-heading)]">No upcoming assignments</p>
                <p className="mt-2 text-sm text-[var(--choir-muted)]">
                  Your next worship assignment will appear here when it is published.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {upcomingPreview.map((assignment) => (
                  <li key={assignment.id}>
                    <TeamAssignmentCard assignment={assignment} onSelect={() => setSelectedAssignment(assignment)} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="choir-recent-assignments">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 id="choir-recent-assignments" className="choir-section-heading text-base">Recent assignments</h2>
            </div>
            {recentPreview.length === 0 ? (
              <p className="text-sm text-[var(--choir-muted)]">No recent assignments yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentPreview.map((assignment) => (
                  <li key={assignment.id}>
                    <TeamAssignmentCard
                      assignment={assignment}
                      showStatusBadge
                      onSelect={() => setSelectedAssignment(assignment)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="choir-team-preview">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 id="choir-team-preview" className="choir-section-heading text-base">Worship team</h2>
              <button type="button" className="text-xs font-bold text-[var(--choir-gold-dark)]" onClick={() => changeTab("members")}>
                See all
              </button>
            </div>
            <div className="choir-team-preview-row">
              {payload.teamPreview.map((member) => (
                <Link key={member.userId} href={member.profileHref} className="choir-team-preview-card">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="choir-team-avatar" />
                  ) : (
                    <span className="choir-team-avatar choir-team-avatar-initials">{initials(member.name)}</span>
                  )}
                  <p className="choir-team-preview-name">{member.name}</p>
                  <p className="choir-team-preview-role">{member.roleLabel}</p>
                </Link>
              ))}
            </div>
          </section>

          <button type="button" className="choir-calendar-add-btn" onClick={() => changeTab("members")}>
            <span aria-hidden>👥</span> View full team &amp; assignments
            <span aria-hidden>→</span>
          </button>
        </div>
      ) : null}

      {tab === "members" ? (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">Our worship team</h2>
            <p className="mt-1 text-sm text-[var(--choir-muted)]">Different gifts. One purpose.</p>
          </div>
          <input
            type="search"
            className="choir-setlist-search"
            placeholder="Search by name or role…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="choir-calendar-filter-row">
            {(
              [
                ["all", "All members"],
                ["leadership", "Leadership"],
                ["vocal", "Vocalists"],
                ["musician", "Musicians"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`choir-calendar-filter ${memberFilter === id ? "is-active" : ""}`}
                onClick={() => setMemberFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="space-y-2">
            {filteredMembers.map((member) => (
              <li key={member.userId}>
                <Link href={member.profileHref} className="choir-team-directory-row">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="choir-team-avatar" />
                  ) : (
                    <span className="choir-team-avatar choir-team-avatar-initials">{initials(member.name)}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[var(--choir-heading)]">{member.name}</p>
                    <p className="text-sm text-[var(--choir-muted)]">{member.roleLabel}</p>
                  </div>
                  <span aria-hidden>›</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "roles" ? (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">Roles &amp; sections</h2>
            <p className="mt-1 text-sm text-[var(--choir-muted)]">Discover how every part contributes to one sound.</p>
          </div>
          {payload.leadership.length > 0 ? (
            <section className="choir-card p-4">
              <h3 className="font-bold text-[var(--choir-heading)]">Leadership</h3>
              <ul className="mt-2 space-y-2">
                {payload.leadership.map((member) => (
                  <li key={member.userId} className="text-sm text-[var(--choir-body)]">
                    {member.name} — {member.roleLabel}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {payload.vocalSections.map((section) => (
            <SectionCard key={section.id} title={section.title} members={section.members} />
          ))}
          {payload.instrumentSections.map((section) => (
            <SectionCard key={section.id} title={section.title} members={section.members} />
          ))}
          {payload.vocalSections.length === 0 && payload.instrumentSections.length === 0 ? (
            <p className="text-sm text-[var(--choir-muted)]">
              Section assignments appear when members are rostered on published worship plans.
            </p>
          ) : null}
        </div>
      ) : null}

      {tab === "availability" ? (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">My availability</h2>
            <p className="mt-1 text-sm text-[var(--choir-muted)]">
              Help the team plan by keeping your availability updated.
            </p>
          </div>
          <Link href={payload.availabilityHref} className="choir-btn-primary inline-flex w-full justify-center">
            Request time away
          </Link>
          <div className="choir-card p-4">
            <h3 className="text-sm font-bold text-[var(--choir-heading)]">Approved team calendar</h3>
            <ul className="mt-2 space-y-2 text-sm text-[var(--choir-body)]">
              {unavailability.length === 0 ? (
                <li className="text-[var(--choir-muted)]">No approved absences on the choir calendar yet.</li>
              ) : (
                unavailability.slice(0, 8).map((row) => (
                  <li key={row.id}>
                    {row.personName}: {row.startDate} – {row.endDate}
                  </li>
                ))
              )}
            </ul>
          </div>
          <Link href={`/groups/${SHANAH_WORSHIP_GROUP_ID}/my-schedule`} className="choir-setlist-manage-link block text-center">
            View my worship schedule →
          </Link>
        </div>
      ) : null}

      {payload.canManageRoster ? (
        <Link href={payload.manageRosterHref} className="choir-setlist-manage-link block text-center">
          Manage roster →
        </Link>
      ) : null}
      {payload.canManageWorship ? (
        <Link href={payload.managePlannerHref} className="choir-setlist-manage-link block text-center">
          Worship planner →
        </Link>
      ) : null}

      {selectedAssignment ? (
        <AssignmentDetailSheet
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onConfirm={(ready) => confirmAssignment(selectedAssignment, ready)}
        />
      ) : null}
    </div>
  );
}

function SectionCard({
  title,
  members,
}: {
  title: string;
  members: ChoirTeamPagePayload["teamMembers"];
}) {
  return (
    <section className="choir-card p-4">
      <h3 className="font-bold text-[var(--choir-heading)]">{title}</h3>
      <p className="text-xs text-[var(--choir-muted)]">{members.length} member{members.length === 1 ? "" : "s"}</p>
      <ul className="mt-2 space-y-1 text-sm text-[var(--choir-body)]">
        {members.map((member) => (
          <li key={member.userId}>{member.name}</li>
        ))}
      </ul>
    </section>
  );
}

function AssignmentDetailSheet({
  assignment,
  onClose,
  onConfirm,
}: {
  assignment: ChoirTeamAssignmentView;
  onClose: () => void;
  onConfirm: (ready: boolean) => void;
}) {
  const setlistHref = `/groups/${SHANAH_WORSHIP_GROUP_ID}/setlists?date=${encodeURIComponent(assignment.serviceDate)}&time=${encodeURIComponent(assignment.serviceTime)}`;
  const rehearsalHref = `/groups/${SHANAH_WORSHIP_GROUP_ID}/rehearsal?date=${encodeURIComponent(assignment.serviceDate)}&time=${encodeURIComponent(assignment.serviceTime)}`;

  return (
    <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="choir-setlist-sheet" role="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">{assignment.title}</h2>
            <p className="mt-1 text-sm text-[var(--choir-muted)]">{assignment.dateTimeLabel}</p>
            <p className="text-sm text-[var(--choir-body)]">{assignment.location}</p>
          </div>
          <button type="button" className="choir-header-icon-btn !h-10 !w-10" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="mt-3 text-sm">
          <span className="font-semibold">Role:</span> {assignment.roleLabel}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Songs:</span> {assignment.songCount}
        </p>
        {assignment.status !== "past" ? (
          <p className="mt-2 text-sm">
            <span className="font-semibold">Assignment:</span>{" "}
            {assignment.status === "confirmed" ? "Confirmed" : "Assigned — confirm when you are ready to serve"}
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--choir-muted)]">Past assignment (attendance not recorded here).</p>
        )}
        <div className="mt-4 flex flex-col gap-2">
          <Link href={setlistHref} className="choir-btn-primary text-center">Open setlist</Link>
          <Link href={rehearsalHref} className="choir-btn-secondary text-center">Rehearsal room</Link>
          <Link
            href={worshipPlannerPath({ serviceDate: assignment.serviceDate, serviceTime: assignment.serviceTime })}
            className="choir-setlist-manage-link text-center"
          >
            Worship plan
          </Link>
          {assignment.status !== "past" ? (
            assignment.status === "confirmed" ? (
              <button type="button" className="choir-btn-secondary" onClick={() => onConfirm(false)}>
                Mark not confirmed
              </button>
            ) : (
              <button type="button" className="choir-btn-primary" onClick={() => onConfirm(true)}>
                Confirm assignment
              </button>
            )
          ) : null}
          <Link href={choirAvailabilityTimeAwayHref(SHANAH_WORSHIP_GROUP_ID)} className="choir-setlist-manage-link text-center">
            Request time away
          </Link>
        </div>
      </div>
    </div>
  );
}
