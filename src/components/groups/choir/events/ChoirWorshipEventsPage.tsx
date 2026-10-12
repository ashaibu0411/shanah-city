"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { WorshipEventsTabs } from "@/components/groups/choir/events/WorshipEventsTabs";
import { WorshipEventCard } from "@/components/groups/choir/events/WorshipEventCard";
import {
  ChoirIconCalendar,
  ChoirIconStar,
  ChoirIconUsers,
} from "@/components/groups/choir/choir-icons";
import {
  choirWorshipEventsFeaturedHref,
  choirWorshipEventsHref,
  choirWorshipEventsUpcomingHref,
} from "@/lib/choir-events-links";
import { parseWorshipEventsTab, worshipEventCategoryLabel } from "@/lib/choir-events-utils";
import type {
  ChoirWorshipEventsHomePayload,
  WorshipEventCardView,
  WorshipEventRegistrationCardView,
  WorshipEventTeamOpportunityView,
} from "@/lib/choir-events-types";
import type { WorshipEventCategory } from "@/lib/choir-events-types";
import { CHOIR_HERO_IMAGE_PATH } from "@/lib/choir-group-constants";
import "../choir-premium.css";

type ChoirWorshipEventsPageProps = {
  groupId: string;
};

function ChoirIconTicket() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path
        fill="currentColor"
        d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 0 0 0-3V8Z"
      />
    </svg>
  );
}

function GuidelinesBody({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  return (
    <div className="choir-we-guidelines prose prose-sm max-w-none text-[var(--choir-body)]">
      {lines.map((line, index) => {
        if (line.startsWith("# ")) {
          return (
            <h2 key={index} className="font-display text-lg font-bold text-[var(--choir-heading)]">
              {line.slice(2)}
            </h2>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3 key={index} className="mt-4 font-display text-base font-bold text-[var(--choir-heading)]">
              {line.slice(3)}
            </h3>
          );
        }
        if (!line.trim()) return <div key={index} className="h-2" />;
        return (
          <p key={index} className="mt-2 text-sm leading-relaxed text-[var(--choir-body)]">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export function ChoirWorshipEventsPage({ groupId }: ChoirWorshipEventsPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = parseWorshipEventsTab(searchParams.get("tab"));
  const listView = searchParams.get("view");
  const upcomingRef = useRef<HTMLElement | null>(null);

  const [payload, setPayload] = useState<ChoirWorshipEventsHomePayload | null>(null);
  const [listEvents, setListEvents] = useState<WorshipEventCardView[]>([]);
  const [registrations, setRegistrations] = useState<WorshipEventRegistrationCardView[]>([]);
  const [opportunities, setOpportunities] = useState<WorshipEventTeamOpportunityView[]>([]);
  const [pastEvents, setPastEvents] = useState<WorshipEventCardView[]>([]);
  const [guidelinesMarkdown, setGuidelinesMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [registrationFilter, setRegistrationFilter] = useState(searchParams.get("registration") ?? "all");

  const loadHome = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-events?groupId=${encodeURIComponent(groupId)}&view=home`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.payload) {
          setError(data.error ?? "Could not load worship events.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load worship events.");
        setLoading(false);
      });
  }, [groupId]);

  const loadList = useCallback(
    (mode: "upcoming" | "featured" | "past" | "all") => {
      setListLoading(true);
      const params = new URLSearchParams({
        groupId,
        view: "list",
        mode,
      });
      if (query.trim()) params.set("q", query.trim());
      if (category !== "all") params.set("category", category);
      if (registrationFilter === "open") params.set("registration", "open");
      fetch(`/api/groups/choir-events?${params.toString()}`)
        .then(async (response) => {
          const data = await response.json();
          if (response.ok) setListEvents(data.events ?? []);
          setListLoading(false);
        })
        .catch(() => setListLoading(false));
    },
    [groupId, query, category, registrationFilter],
  );

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  useEffect(() => {
    if (tab === "events" && (listView === "upcoming" || listView === "featured")) {
      loadList(listView === "featured" ? "featured" : "upcoming");
      return;
    }
    if (tab === "past") {
      setListLoading(true);
      fetch(`/api/groups/choir-events?groupId=${encodeURIComponent(groupId)}&view=list&mode=past`)
        .then(async (response) => {
          const data = await response.json();
          if (response.ok) setPastEvents(data.events ?? []);
          setListLoading(false);
        })
        .catch(() => setListLoading(false));
      return;
    }
    if (tab === "registrations") {
      fetch(`/api/groups/choir-events?groupId=${encodeURIComponent(groupId)}&view=registrations`)
        .then(async (response) => {
          const data = await response.json();
          if (response.ok) setRegistrations(data.registrations ?? []);
        })
        .catch(() => undefined);
      return;
    }
    if (tab === "teams") {
      fetch(`/api/groups/choir-events?groupId=${encodeURIComponent(groupId)}&view=teams`)
        .then(async (response) => {
          const data = await response.json();
          if (response.ok) setOpportunities(data.opportunities ?? []);
        })
        .catch(() => undefined);
      return;
    }
    if (tab === "guidelines") {
      fetch(`/api/groups/choir-events?groupId=${encodeURIComponent(groupId)}&view=guidelines`)
        .then((response) => response.json())
        .then((data) => {
          if (data.guidelines?.markdown) setGuidelinesMarkdown(data.guidelines.markdown);
        })
        .catch(() => undefined);
    }
  }, [tab, listView, groupId, loadList]);

  const categoryOptions = useMemo(
    () =>
      (
        [
          "all",
          "worship_night",
          "concert",
          "conference",
          "training",
          "intensive",
          "retreat",
          "gathering",
          "celebration",
          "other",
        ] as const
      ).map((id) => ({
        id,
        label: id === "all" ? "All Events" : worshipEventCategoryLabel(id as WorshipEventCategory),
      })),
    [],
  );

  function scrollToUpcoming() {
    upcomingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function applyListFilters() {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    if (category !== "all") params.set("category", category);
    else params.delete("category");
    if (registrationFilter === "open") params.set("registration", "open");
    else params.delete("registration");
    router.replace(`?${params.toString()}`, { scroll: false });
    if (listView === "upcoming" || listView === "featured") {
      loadList(listView === "featured" ? "featured" : "upcoming");
    }
  }

  if (loading && !payload) {
    return (
      <div className="choir-group-home choir-worship-events-page px-4 py-3">
        <p className="text-sm text-[var(--choir-muted)]">Loading worship events…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="choir-group-home choir-worship-events-page px-4 py-3">
        <p className="text-sm text-red-700">{error ?? "Unavailable."}</p>
        <button type="button" className="choir-setlist-manage-link mt-3" onClick={loadHome}>
          Retry
        </button>
      </div>
    );
  }

  const quickActions = [
    {
      key: "upcoming",
      title: "Upcoming Events",
      sub: "See what's coming up",
      icon: <ChoirIconCalendar />,
      onClick: scrollToUpcoming,
    },
    {
      key: "registrations",
      title: "My Registrations",
      sub: "View and manage",
      icon: <ChoirIconTicket />,
      href: choirWorshipEventsHref(groupId, { tab: "registrations" }),
    },
    {
      key: "teams",
      title: "Join an Event Team",
      sub: "Serve and get involved",
      icon: <ChoirIconUsers />,
      href: choirWorshipEventsHref(groupId, { tab: "teams" }),
    },
    {
      key: "featured",
      title: "Featured Events",
      sub: "Don't miss these",
      icon: <ChoirIconStar />,
      href: choirWorshipEventsFeaturedHref(groupId),
    },
  ];

  const showFullList = tab === "events" && (listView === "upcoming" || listView === "featured");
  const listTitle = listView === "featured" ? "Featured Events" : "Upcoming Worship Events";

  return (
    <div className="choir-group-home choir-worship-events-page choir-page-shell space-y-[18px] pb-10">
      <ChoirSetlistHeader groupId={groupId} chatHref={payload.groupChatHref} />
      <WorshipEventsTabs groupId={groupId} active={tab} />

      {tab === "events" && !showFullList ? (
        <>
          <section className="choir-we-hero">
            <Image
              src={CHOIR_HERO_IMAGE_PATH}
              alt=""
              fill
              className="object-cover opacity-55"
              sizes="(max-width: 430px) 100vw, 480px"
              priority
            />
            <div className="choir-we-hero-overlay">
              <p className="choir-we-hero-kicker">WORSHIP EVENTS</p>
              <h1 className="choir-we-hero-title">Encounter. Equip. Serve.</h1>
              <p className="choir-we-hero-sub">
                Join us for special worship gatherings, concerts, training events and more.
              </p>
            </div>
          </section>

          <div className="choir-we-quick-grid">
            {quickActions.map((action) =>
              action.href ? (
                <Link key={action.key} href={action.href} className="choir-we-quick-card">
                  <span className="choir-we-quick-icon">{action.icon}</span>
                  <p className="choir-we-quick-title">{action.title}</p>
                  <p className="choir-we-quick-sub">{action.sub}</p>
                  <span className="choir-we-quick-chevron" aria-hidden>
                    ›
                  </span>
                </Link>
              ) : (
                <button key={action.key} type="button" className="choir-we-quick-card" onClick={action.onClick}>
                  <span className="choir-we-quick-icon">{action.icon}</span>
                  <p className="choir-we-quick-title">{action.title}</p>
                  <p className="choir-we-quick-sub">{action.sub}</p>
                  <span className="choir-we-quick-chevron" aria-hidden>
                    ›
                  </span>
                </button>
              ),
            )}
          </div>

          <section>
            <div className="choir-we-section-head">
              <h2 className="choir-we-section-title">Featured Event</h2>
              {payload.featuredCount > 1 ? (
                <Link href={choirWorshipEventsFeaturedHref(groupId)} className="choir-we-see-all">
                  See All
                </Link>
              ) : null}
            </div>
            {payload.featured ? (
              <WorshipEventCard event={payload.featured} variant="featured" />
            ) : (
              <div className="choir-card p-5 text-center">
                <p className="font-display text-lg font-bold text-[var(--choir-heading)]">No featured event</p>
                <p className="mt-2 text-sm text-[var(--choir-muted)]">
                  Featured worship events will appear here when leadership publishes them.
                </p>
              </div>
            )}
          </section>

          <section ref={upcomingRef}>
            <div className="choir-we-section-head">
              <h2 className="choir-we-section-title">Upcoming Worship Events</h2>
              {payload.upcomingCount > payload.upcoming.length ? (
                <Link href={choirWorshipEventsUpcomingHref(groupId)} className="choir-we-see-all">
                  See All
                </Link>
              ) : payload.upcomingCount > 0 ? (
                <Link href={choirWorshipEventsUpcomingHref(groupId)} className="choir-we-see-all">
                  See All
                </Link>
              ) : null}
            </div>
            {payload.upcoming.length === 0 ? (
              <div className="choir-card p-5 text-center">
                <p className="font-display text-lg font-bold text-[var(--choir-heading)]">No Upcoming Worship Events</p>
                <p className="mt-2 text-sm text-[var(--choir-muted)]">
                  There are no special worship events scheduled at the moment. Check back for upcoming gatherings.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {payload.upcoming.map((event) => (
                  <li key={event.id}>
                    <WorshipEventCard event={event} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      {tab === "events" && showFullList ? (
        <section className="space-y-4">
          <div>
            <Link href={choirWorshipEventsHref(groupId)} className="text-sm font-semibold text-[var(--choir-gold-dark)]">
              ← Back to events home
            </Link>
            <h2 className="mt-2 font-display text-2xl font-bold text-[var(--choir-heading)]">{listTitle}</h2>
          </div>
          <div className="space-y-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events"
              className="choir-input w-full"
              aria-label="Search events"
            />
            <div className="choir-calendar-filter-row">
              {categoryOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`choir-calendar-filter ${category === option.id ? "is-active" : ""}`}
                  onClick={() => setCategory(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="choir-calendar-filter-row">
              <button
                type="button"
                className={`choir-calendar-filter ${registrationFilter === "all" ? "is-active" : ""}`}
                onClick={() => setRegistrationFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`choir-calendar-filter ${registrationFilter === "open" ? "is-active" : ""}`}
                onClick={() => setRegistrationFilter("open")}
              >
                Registration Open
              </button>
            </div>
            <button type="button" className="choir-btn-secondary min-h-[44px] w-full" onClick={applyListFilters}>
              Apply filters
            </button>
          </div>
          {listLoading ? (
            <p className="text-sm text-[var(--choir-muted)]">Loading events…</p>
          ) : listEvents.length === 0 ? (
            <div className="choir-card p-5 text-center">
              <p className="font-display text-lg font-bold text-[var(--choir-heading)]">No Upcoming Worship Events</p>
              <p className="mt-2 text-sm text-[var(--choir-muted)]">
                There are no special worship events scheduled at the moment. Check back for upcoming gatherings.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {listEvents.map((event) => (
                <li key={event.id}>
                  <WorshipEventCard event={event} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "registrations" ? (
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[var(--choir-heading)]">My Registrations</h2>
            <p className="mt-1 text-sm text-[var(--choir-muted)]">
              View and manage the worship events you&apos;ve registered for.
            </p>
          </div>
          {registrations.length === 0 ? (
            <div className="choir-card p-5 text-center">
              <p className="font-display text-lg font-bold text-[var(--choir-heading)]">No Registrations Yet</p>
              <p className="mt-2 text-sm text-[var(--choir-muted)]">
                You haven&apos;t registered for a worship event yet.
              </p>
              <Link href={choirWorshipEventsHref(groupId)} className="choir-btn-primary mt-4 inline-flex min-h-[44px] items-center px-4">
                Explore Events
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {registrations.map((row) => (
                <li key={row.eventId}>
                  <Link href={row.detailHref} className="choir-card block p-4">
                    <p className="font-bold text-[var(--choir-heading)]">{row.title}</p>
                    <p className="mt-1 text-sm text-[var(--choir-body)]">{row.dateLabel}</p>
                    <p className="text-sm text-[var(--choir-muted)]">
                      {row.timeLabel} · {row.location}
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[var(--choir-gold-dark)]">
                      {row.statusLabel}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "teams" ? (
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Event Teams</h2>
            <p className="mt-1 text-sm text-[var(--choir-muted)]">
              Discover opportunities to serve and prepare together.
            </p>
          </div>
          {opportunities.length === 0 ? (
            <div className="choir-card p-5 text-center">
              <p className="font-display text-lg font-bold text-[var(--choir-heading)]">No Event Team Opportunities</p>
              <p className="mt-2 text-sm text-[var(--choir-muted)]">
                There are no event team opportunities currently open.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {opportunities.map((row) => (
                <li key={row.eventId} className="choir-card p-4">
                  <Link href={row.detailHref} className="font-bold text-[var(--choir-heading)]">
                    {row.title}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--choir-body)]">{row.dateLabel}</p>
                  <p className="text-sm text-[var(--choir-muted)]">{row.teamLabel}</p>
                  <p className="mt-2 text-xs text-[var(--choir-muted)]">Roles: {row.roles.join(", ")}</p>
                  {row.myStatus ? (
                    <p className="mt-2 text-xs font-bold text-[var(--choir-gold-dark)]">Your status: {row.myStatus.replace(/_/g, " ")}</p>
                  ) : null}
                  <Link href={row.detailHref} className="choir-setlist-manage-link mt-3 inline-block">
                    View opportunity →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "past" ? (
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Past Events</h2>
            <p className="mt-1 text-sm text-[var(--choir-muted)]">
              Remember the moments, testimonies and worship gatherings we&apos;ve shared.
            </p>
          </div>
          {listLoading ? (
            <p className="text-sm text-[var(--choir-muted)]">Loading past events…</p>
          ) : pastEvents.length === 0 ? (
            <div className="choir-card p-5 text-center">
              <p className="font-display text-lg font-bold text-[var(--choir-heading)]">No Past Events Available</p>
              <p className="mt-2 text-sm text-[var(--choir-muted)]">
                Past worship events will appear here when they are available.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {pastEvents.map((event) => (
                <li key={event.id}>
                  <WorshipEventCard event={event} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "guidelines" ? (
        <section className="space-y-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Event Guidelines</h2>
          </div>
          <GuidelinesBody markdown={guidelinesMarkdown} />
        </section>
      ) : null}

      {payload.canManageEvents ? (
        <Link href={payload.manageEventsHref} className="choir-setlist-manage-link block text-center">
          Manage events on Events tab →
        </Link>
      ) : null}
    </div>
  );
}
