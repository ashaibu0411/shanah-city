"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { LeaderStudioTabs } from "@/components/groups/choir/studio/LeaderStudioTabs";
import {
  ChoirIconBook,
  ChoirIconCalendar,
  ChoirIconMusic,
  ChoirIconStar,
  ChoirIconUsers,
} from "@/components/groups/choir/choir-icons";
import { choirAvailabilityTeamHref, choirAvailabilityHref } from "@/lib/choir-availability-links";
import { choirLeaderStudioHref } from "@/lib/choir-leader-studio-links";
import { parseLeaderStudioTab } from "@/lib/choir-leader-studio-links";
import type { LeaderStudioOverviewPayload } from "@/lib/choir-leader-studio-types";
import { choirResourcesManageHref, choirResourcesHref } from "@/lib/choir-resource-links";
import { choirSongSuggestionReviewHref } from "@/lib/choir-song-suggestion-links";
import { choirWorshipEventsHref } from "@/lib/choir-events-links";
import { CHOIR_HERO_IMAGE_PATH } from "@/lib/choir-group-constants";
import "../choir-premium.css";

function statusClass(tone: string) {
  if (tone === "confirmed") return "choir-wls-status-confirmed";
  if (tone === "needs_plan") return "choir-wls-status-needs";
  return "choir-wls-status-pending";
}

function AvailabilityBar({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="choir-wls-avail-row">
      <div className="choir-wls-avail-row-head">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="choir-wls-avail-track">
        <div className={`choir-wls-avail-fill choir-wls-avail-${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ChoirWorshipLeaderStudioPage({ groupId }: { groupId: string }) {
  const searchParams = useSearchParams();
  const tab = parseLeaderStudioTab(searchParams.get("tab"));

  const [payload, setPayload] = useState<LeaderStudioOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-leader-studio?groupId=${encodeURIComponent(groupId)}&view=overview`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.payload) {
          setError(data.error ?? "Could not load leader studio.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load leader studio.");
        setLoading(false);
      });
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !payload) {
    return (
      <div className="choir-leader-studio-page px-4 py-3">
        <p className="text-sm text-[var(--choir-muted)]">Loading worship leader studio…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="choir-leader-studio-page px-4 py-3">
        <p className="text-sm text-red-700">{error ?? "Unavailable."}</p>
        <button type="button" className="choir-setlist-manage-link mt-3" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const quickActions = [
    {
      key: "plan",
      title: "Plan Services",
      sub: "Worship planner",
      href: payload.plannerHref,
      icon: <ChoirIconCalendar />,
    },
    {
      key: "team",
      title: "Manage Team",
      sub: "Roster & roles",
      href: `/groups/${encodeURIComponent(groupId)}/team`,
      icon: <ChoirIconUsers />,
    },
    {
      key: "availability",
      title: "Team Availability",
      sub: "Responses & deadlines",
      href: choirAvailabilityTeamHref(groupId),
      icon: <ChoirIconCalendar />,
    },
    {
      key: "events",
      title: "Event Management",
      sub: "Worship events",
      href: choirWorshipEventsHref(groupId),
      icon: <ChoirIconStar />,
    },
    {
      key: "songs",
      title: "Song Approvals",
      sub: "Review suggestions",
      href: choirSongSuggestionReviewHref(groupId),
      icon: <ChoirIconMusic />,
    },
    {
      key: "reports",
      title: "Ministry Reports",
      sub: "Submit & review",
      href: payload.reportsHref,
      icon: <ChoirIconBook />,
    },
  ];

  return (
    <div className="choir-group-home choir-leader-studio-page choir-page-shell">
      <ChoirSetlistHeader groupId={groupId} chatHref={payload.groupChatHref} />
      <LeaderStudioTabs groupId={groupId} active={tab} />

      {tab === "overview" ? (
        <div className="choir-wls-stack">
          <section className="choir-wls-hero">
            <Image
              src={CHOIR_HERO_IMAGE_PATH}
              alt=""
              fill
              className="object-cover opacity-50"
              sizes="(max-width: 430px) 100vw, 480px"
              priority
            />
            <div className="choir-wls-hero-overlay">
              <p className="choir-wls-hero-kicker">WORSHIP LEADER STUDIO</p>
              <h1 className="choir-wls-hero-title">Plan. Prepare. Empower.</h1>
              <p className="choir-wls-hero-sub">Lead and coordinate your worship ministry.</p>
            </div>
          </section>

          <section className="choir-wls-section">
            <div className="choir-wls-quick-grid">
              {quickActions.map((action) => (
                <Link key={action.key} href={action.href} className="choir-wls-quick-card">
                  <span className="choir-wls-quick-icon">{action.icon}</span>
                  <p className="choir-wls-quick-title">{action.title}</p>
                  <p className="choir-wls-quick-sub">{action.sub}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="choir-wls-section">
            <div className="choir-wls-section-head">
              <h2 className="choir-wls-section-title">Upcoming Services &amp; Rehearsals</h2>
              <Link href={payload.calendarViewAllHref} className="choir-wls-see-all">
                View All
              </Link>
            </div>
            {payload.upcoming.length === 0 ? (
              <p className="text-sm text-[var(--choir-muted)]">No upcoming services or rehearsals published yet.</p>
            ) : (
              <ul className="choir-wls-upcoming-list">
                {payload.upcoming.map((row) => (
                  <li key={row.id}>
                    <Link href={row.detailHref} className="choir-wls-upcoming-row">
                      <div className="choir-wls-date-block">
                        <span className="choir-wls-date-month">{row.monthLabel}</span>
                        <span className="choir-wls-date-day">{row.dayLabel}</span>
                        <span className="choir-wls-date-weekday">{row.weekdayLabel}</span>
                      </div>
                      <div className="choir-wls-upcoming-copy">
                        <p className="choir-wls-upcoming-title">{row.title}</p>
                        <p className="choir-wls-upcoming-meta">
                          {row.timeLabel} · {row.location}
                        </p>
                        <p className="choir-wls-upcoming-meta">{row.teamLabel}</p>
                        <span className={`choir-wls-status ${statusClass(row.statusTone)}`}>{row.statusLabel}</span>
                      </div>
                      <span className="choir-wls-chevron" aria-hidden>
                        ›
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="choir-wls-section">
            <h2 className="choir-wls-section-title">Pending Items</h2>
            <div className="choir-wls-card">
              {payload.pendingItems.length === 0 ? (
                <p className="text-sm text-[var(--choir-muted)]">No pending leadership actions right now.</p>
              ) : (
                <ul className="choir-wls-pending-list">
                  {payload.pendingItems.map((item) => (
                    <li key={item.id}>
                      <Link href={item.href} className="choir-wls-pending-row">
                        <span>{item.label}</span>
                        <span className="choir-wls-pending-count">{item.count}</span>
                        <span className="choir-wls-chevron" aria-hidden>
                          ›
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="choir-wls-section">
            <h2 className="choir-wls-section-title">Team Availability</h2>
            <div className="choir-wls-card">
              {!payload.availability ? (
                <p className="text-sm text-[var(--choir-muted)]">No upcoming service selected for availability tracking.</p>
              ) : (
                <>
                  <p className="font-semibold text-[var(--choir-heading)]">{payload.availability.eventTitle}</p>
                  <p className="mt-1 text-sm text-[var(--choir-muted)]">{payload.availability.eventDateLabel}</p>
                  <p className="mt-3 text-sm text-[var(--choir-body)]">
                    {payload.availability.eligible} eligible members
                  </p>
                  <div className="mt-4 space-y-3">
                    <AvailabilityBar
                      label="Available"
                      count={payload.availability.available}
                      total={payload.availability.eligible}
                      tone="available"
                    />
                    <AvailabilityBar
                      label="Maybe"
                      count={payload.availability.maybe}
                      total={payload.availability.eligible}
                      tone="maybe"
                    />
                    <AvailabilityBar
                      label="Unavailable"
                      count={payload.availability.unavailable}
                      total={payload.availability.eligible}
                      tone="unavailable"
                    />
                    <AvailabilityBar
                      label="Not responded"
                      count={payload.availability.notResponded}
                      total={payload.availability.eligible}
                      tone="pending"
                    />
                  </div>
                  <Link
                    href={payload.availability.viewHref}
                    className="choir-btn-secondary mt-4 inline-flex min-h-[44px] w-full items-center justify-center"
                  >
                    View Team Availability
                  </Link>
                </>
              )}
            </div>
          </section>

          <section className="choir-wls-section">
            <h2 className="choir-wls-section-title">Recent Activity</h2>
            {payload.recentActivity.length === 0 ? (
              <p className="text-sm text-[var(--choir-muted)]">Recent team activity will appear here.</p>
            ) : (
              <ul className="choir-wls-card choir-wls-activity-list">
                {payload.recentActivity.map((row) => (
                  <li key={row.id}>
                    {row.href ? (
                      <Link href={row.href} className="choir-wls-activity-row">
                        <span className="choir-wls-activity-icon" aria-hidden>
                          {row.icon}
                        </span>
                        <span className="choir-wls-activity-copy">
                          <span className="choir-wls-activity-text">{row.text}</span>
                          <span className="choir-wls-activity-when">{row.whenLabel}</span>
                        </span>
                        <span className="choir-wls-chevron" aria-hidden>
                          ›
                        </span>
                      </Link>
                    ) : (
                      <div className="choir-wls-activity-row">
                        <span className="choir-wls-activity-icon" aria-hidden>
                          {row.icon}
                        </span>
                        <span className="choir-wls-activity-copy">
                          <span className="choir-wls-activity-text">{row.text}</span>
                          <span className="choir-wls-activity-when">{row.whenLabel}</span>
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="choir-wls-section">
            <Link href={payload.songSuggestions.manageHref} className="choir-wls-mgmt-card">
              <span className="choir-wls-mgmt-icon">
                <ChoirIconMusic />
              </span>
              <span className="choir-wls-mgmt-copy">
                <span className="choir-wls-mgmt-title">Song Suggestions</span>
                <span className="choir-wls-mgmt-sub">
                  {payload.songSuggestions.pendingCount} pending review
                </span>
              </span>
              <span className="choir-wls-chevron" aria-hidden>
                ›
              </span>
            </Link>
          </section>

          <section className="choir-wls-section">
            <Link href={payload.eventTeams.href} className="choir-wls-mgmt-card">
              <span className="choir-wls-mgmt-icon">
                <ChoirIconUsers />
              </span>
              <span className="choir-wls-mgmt-copy">
                <span className="choir-wls-mgmt-title">Event Teams</span>
                <span className="choir-wls-mgmt-sub">{payload.eventTeams.openCount} open opportunities</span>
              </span>
              <span className="choir-wls-chevron" aria-hidden>
                ›
              </span>
            </Link>
          </section>

          <section className="choir-wls-section">
            <Link href={payload.ministryResources.manageHref} className="choir-wls-mgmt-card">
              <span className="choir-wls-mgmt-icon">
                <ChoirIconBook />
              </span>
              <span className="choir-wls-mgmt-copy">
                <span className="choir-wls-mgmt-title">Ministry Resources</span>
                <span className="choir-wls-mgmt-sub">
                  {payload.ministryResources.resourceCount} resources · {payload.ministryResources.pendingRequests}{" "}
                  requests
                </span>
              </span>
              <span className="choir-wls-chevron" aria-hidden>
                ›
              </span>
            </Link>
          </section>

          <Link href={payload.reportsHref} className="choir-btn-primary choir-wls-reports-cta min-h-[44px]">
            View Full Reports
          </Link>
        </div>
      ) : null}

      {tab === "planning" ? (
        <TabPanel
          title="Planning"
          body="Build service plans, setlists, and rehearsal details in the worship planner."
          href={payload.plannerHref}
          label="Open worship planner"
        />
      ) : null}

      {tab === "team" ? (
        <TabPanel
          title="Team & Availability"
          body="Review team roster, availability responses, and schedule change requests."
          href={choirAvailabilityTeamHref(groupId)}
          label="Open team availability"
          secondaryHref={choirAvailabilityHref(groupId)}
          secondaryLabel="Availability center"
        />
      ) : null}

      {tab === "events" ? (
        <TabPanel
          title="Events"
          body="Manage worship events, registrations, and event team interest."
          href={choirWorshipEventsHref(groupId)}
          label="Open worship events"
          secondaryHref={`/groups/${encodeURIComponent(groupId)}?calendar=1`}
          secondaryLabel="Group events tab"
        />
      ) : null}

      {tab === "resources" ? (
        <TabPanel
          title="Resources"
          body="Publish ministry resources and respond to member requests."
          href={choirResourcesManageHref(groupId)}
          label="Manage resources"
          secondaryHref={choirResourcesHref(groupId)}
          secondaryLabel="Resource center"
        />
      ) : null}

      {tab === "reports" ? (
        <TabPanel
          title="Reports"
          body="Submit and review ministry reports through the church reporting hub."
          href={payload.reportsHref}
          label="Open ministry reports"
        />
      ) : null}

      {tab !== "overview" ? (
        <Link href={choirLeaderStudioHref(groupId)} className="choir-setlist-manage-link block text-center">
          Back to studio overview
        </Link>
      ) : null}
    </div>
  );
}

function TabPanel({
  title,
  body,
  href,
  label,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  body: string;
  href: string;
  label: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="choir-wls-section choir-wls-card space-y-3 p-4">
      <h2 className="choir-wls-section-title">{title}</h2>
      <p className="text-sm leading-relaxed text-[var(--choir-body)]">{body}</p>
      <Link href={href} className="choir-btn-primary inline-flex min-h-[44px] w-full items-center justify-center">
        {label}
      </Link>
      {secondaryHref && secondaryLabel ? (
        <Link href={secondaryHref} className="choir-btn-secondary inline-flex min-h-[44px] w-full items-center justify-center">
          {secondaryLabel}
        </Link>
      ) : null}
    </section>
  );
}
