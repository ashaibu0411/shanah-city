"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { AvailabilityTabs } from "@/components/groups/choir/availability/AvailabilityTabs";
import { OpportunityCard } from "@/components/groups/choir/availability/OpportunityCard";
import { CHOIR_HERO_IMAGE_PATH, SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { choirAvailabilityHref, choirMyScheduleHref } from "@/lib/choir-availability-links";
import type {
  ChoirAvailabilityAssignmentPreview,
  ChoirAvailabilityHomePayload,
  ChoirAvailabilityOpportunityView,
  ChoirAvailabilityTabId,
  ChoirMySchedulePayload,
} from "@/lib/choir-availability-types";
import {
  ChoirIconCalendar,
  ChoirIconUsers,
} from "@/components/groups/choir/choir-icons";
import { ChoirMyScheduleTab } from "@/components/groups/choir/availability/ChoirMyScheduleTab";
import { getZonedDateParts } from "@/lib/denver-time";
import "../choir-premium.css";

function parseTab(value: string | null): ChoirAvailabilityTabId {
  if (value === "schedule" || value === "my-schedule") return "my-schedule";
  if (value === "upcoming" || value === "past" || value === "guidelines") {
    return value;
  }
  return "home";
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function statusDotClass(status: string) {
  if (status === "available") return "choir-avail-dot-available";
  if (status === "unavailable") return "choir-avail-dot-unavailable";
  if (status === "maybe" || status === "mixed") return "choir-avail-dot-maybe";
  return "choir-avail-dot-pending";
}

type ChoirAvailabilityCenterPageProps = {
  groupId: string;
  initialHomePayload?: ChoirAvailabilityHomePayload | null;
  initialHomeError?: string | null;
  initialMySchedule?: ChoirMySchedulePayload | null;
  initialMyScheduleError?: string | null;
};

export function ChoirAvailabilityCenterPage({
  groupId,
  initialHomePayload = null,
  initialHomeError = null,
  initialMySchedule = null,
  initialMyScheduleError = null,
}: ChoirAvailabilityCenterPageProps) {
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const homeRequired = tab === "home" || tab === "upcoming" || tab === "past" || tab === "guidelines";

  const [payload, setPayload] = useState<ChoirAvailabilityHomePayload | null>(initialHomePayload);
  const [listRows, setListRows] = useState<ChoirAvailabilityOpportunityView[]>([]);
  const [guidelinesMarkdown, setGuidelinesMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialHomePayload && !initialHomeError && homeRequired);
  const [error, setError] = useState<string | null>(initialHomeError);

  const denverToday = getZonedDateParts();
  const [monthCursor, setMonthCursor] = useState(() => ({
    year: Number(denverToday.year),
    month: Number(denverToday.month) - 1,
  }));
  const [calendarDays, setCalendarDays] = useState<
    Array<{
      dateKey: string;
      inMonth: boolean;
      isToday: boolean;
      events: ChoirAvailabilityOpportunityView[];
      dominantStatus: string;
    }>
  >([]);

  const [selectedRow, setSelectedRow] = useState<ChoirAvailabilityOpportunityView | null>(null);
  const [editorNote, setEditorNote] = useState("");
  const [editorBusy, setEditorBusy] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDraft, setBulkDraft] = useState<Record<string, string>>({});
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState<ChoirAvailabilityAssignmentPreview | null>(null);
  const [changeReason, setChangeReason] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [message, setMessage] = useState<string | null>(null);

  const loadHome = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-availability?groupId=${encodeURIComponent(groupId)}&view=home`, {
      credentials: "include",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.payload) {
          setError(data.error ?? "Could not load availability.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load availability.");
        setLoading(false);
      });
  }, [groupId]);

  const loadCalendar = useCallback(() => {
    fetch(
      `/api/groups/choir-availability?groupId=${encodeURIComponent(groupId)}&view=calendar&year=${monthCursor.year}&month=${monthCursor.month}`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.calendar?.days) setCalendarDays(data.calendar.days);
      })
      .catch(() => undefined);
  }, [groupId, monthCursor.month, monthCursor.year]);

  const loadTabData = useCallback(() => {
    if (tab === "home") {
      loadCalendar();
      return;
    }
    if (tab === "guidelines") {
      fetch(`/api/groups/choir-availability?groupId=${encodeURIComponent(groupId)}&view=guidelines`)
        .then((response) => response.json())
        .then((data) => {
          if (data.guidelines?.markdown) setGuidelinesMarkdown(data.guidelines.markdown);
        })
        .catch(() => undefined);
      return;
    }
    if (tab === "my-schedule") {
      return;
    }
    const params = new URLSearchParams({
      groupId,
      view: "opportunities",
      tab,
    });
    if (filterCategory !== "all") params.set("category", filterCategory);
    if (filterStatus !== "all") params.set("status", filterStatus);
    fetch(`/api/groups/choir-availability?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.opportunities) setListRows(data.opportunities);
      })
      .catch(() => setListRows([]));
  }, [groupId, tab, filterCategory, filterStatus, loadCalendar]);

  useEffect(() => {
    if (tab === "my-schedule") return;
    if (initialHomePayload) return;
    loadHome();
    window.scrollTo(0, 0);
  }, [loadHome, initialHomePayload, tab]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  async function saveResponse(eventId: string, response: string, note?: string) {
    setEditorBusy(true);
    setMessage(null);
    const res = await fetch("/api/groups/choir-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_response",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        eventId,
        response,
        note: note ?? editorNote,
      }),
    });
    const data = await res.json();
    setEditorBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "Could not save.");
      return;
    }
    setMessage("Availability saved.");
    setSelectedRow(null);
    loadHome();
    loadTabData();
  }

  async function saveBulk() {
    setEditorBusy(true);
    const updates = Object.entries(bulkDraft)
      .filter(([, response]) => response)
      .map(([eventId, response]) => ({ eventId, response }));
    const res = await fetch("/api/groups/choir-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_bulk",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        updates,
      }),
    });
    const data = await res.json();
    setEditorBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "Bulk save failed.");
      return;
    }
    setMessage(data.partial ? "Some responses could not be saved." : "All changes saved.");
    setBulkOpen(false);
    loadHome();
    loadTabData();
  }

  async function submitChangeRequest(eventId: string) {
    if (!changeReason.trim()) return;
    await fetch("/api/groups/choir-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "request_change",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        eventId,
        reason: changeReason,
        requestType: "cannot_serve",
      }),
    });
    setChangeOpen(null);
    setChangeReason("");
    setMessage("Change request submitted.");
    loadHome();
  }

  const [bulkRows, setBulkRows] = useState<ChoirAvailabilityOpportunityView[]>([]);

  useEffect(() => {
    if (!bulkOpen) return;
    fetch(
      `/api/groups/choir-availability?groupId=${encodeURIComponent(groupId)}&view=opportunities&tab=upcoming`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.opportunities) setBulkRows(data.opportunities);
      })
      .catch(() => setBulkRows(payload?.opportunities ?? []));
  }, [bulkOpen, groupId, payload?.opportunities]);

  const bulkEvents = bulkRows.length > 0 ? bulkRows : payload?.opportunities ?? [];

  const groupChatHref = payload?.groupChatHref ?? `/groups/${encodeURIComponent(groupId)}?chat=1`;

  if (homeRequired && loading && !payload) {
    return (
      <div className="choir-group-home choir-availability-page px-4 py-3">
        <p className="text-sm text-[var(--choir-muted)]">Loading availability center…</p>
      </div>
    );
  }

  if (homeRequired && (error || !payload)) {
    return (
      <div className="choir-group-home choir-availability-page px-4 py-3">
        <p className="text-sm text-red-700">{error ?? "Unavailable."}</p>
        <button type="button" className="choir-setlist-manage-link mt-3" onClick={loadHome}>
          Retry
        </button>
      </div>
    );
  }

  const monthLabel = new Date(monthCursor.year, monthCursor.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="choir-group-home choir-availability-page choir-calendar-page choir-page-shell space-y-[18px] pb-10">
      <ChoirSetlistHeader groupId={groupId} chatHref={groupChatHref} />
      <AvailabilityTabs groupId={groupId} active={tab} />

      {tab === "home" && payload ? (
        <>
          <section className="choir-song-hero choir-avail-hero">
            <Image
              src={CHOIR_HERO_IMAGE_PATH}
              alt=""
              fill
              className="choir-song-hero-img object-cover"
              sizes="(max-width: 430px) 100vw, 400px"
              priority
            />
            <div className="choir-song-hero-overlay">
              <p className="choir-song-hero-kicker">AVAILABILITY CENTER</p>
              <h1 className="choir-song-hero-title">Be Ready to Serve.</h1>
              <p className="choir-song-hero-sub">
                Let us know when you&apos;re available so we can plan and serve together.
              </p>
            </div>
          </section>

          <div className="choir-song-quick-grid">
            <button type="button" className="choir-song-quick-card" onClick={() => setBulkOpen(true)}>
              <span className="choir-song-quick-icon"><ChoirIconCalendar /></span>
              <p className="choir-song-quick-title">Mark Availability</p>
              <p className="choir-song-quick-sub">Let us know your dates</p>
            </button>
            <Link href={choirMyScheduleHref(groupId)} className="choir-song-quick-card">
              <span className="choir-song-quick-icon"><ChoirIconCalendar /></span>
              <p className="choir-song-quick-title">View Schedule</p>
              <p className="choir-song-quick-sub">See your assignments</p>
            </Link>
            <Link href={payload.teamPageHref} className="choir-song-quick-card">
              <span className="choir-song-quick-icon"><ChoirIconUsers /></span>
              <p className="choir-song-quick-title">Request Change</p>
              <p className="choir-song-quick-sub">Need a swap?</p>
            </Link>
            <button type="button" className="choir-song-quick-card" onClick={() => setPrefsOpen(true)}>
              <span className="choir-song-quick-icon">🕐</span>
              <p className="choir-song-quick-title">Set Preferences</p>
              <p className="choir-song-quick-sub">Service times & roles</p>
            </button>
          </div>

          <section>
            <div className="choir-song-section-head">
              <h2 className="choir-song-section-title">Upcoming Opportunities</h2>
              <Link href={choirAvailabilityHref(groupId, "upcoming")} className="choir-song-see-all">
                See All
              </Link>
            </div>
            {payload.opportunities.length === 0 ? (
              <p className="text-sm text-[var(--choir-muted)]">No upcoming events to respond to yet.</p>
            ) : (
              <div className="space-y-2">
                {payload.opportunities.map((row) => (
                  <OpportunityCard key={row.event.id} row={row} onSelect={() => setSelectedRow(row)} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="choir-song-section-head">
              <h2 className="choir-song-section-title">My Availability</h2>
              <Link href={choirAvailabilityHref(groupId, "upcoming")} className="choir-song-see-all">
                View Full Calendar
              </Link>
            </div>
            <div className="choir-calendar-month-card">
              <div className="choir-calendar-month-header">
                <button
                  type="button"
                  className="choir-calendar-month-nav"
                  aria-label="Previous month"
                  onClick={() =>
                    setMonthCursor((current) => {
                      const month = current.month - 1;
                      return month < 0
                        ? { year: current.year - 1, month: 11 }
                        : { year: current.year, month };
                    })
                  }
                >
                  ‹
                </button>
                <p className="choir-calendar-month-title">{monthLabel}</p>
                <button
                  type="button"
                  className="choir-calendar-month-nav"
                  aria-label="Next month"
                  onClick={() =>
                    setMonthCursor((current) => {
                      const month = current.month + 1;
                      return month > 11
                        ? { year: current.year + 1, month: 0 }
                        : { year: current.year, month };
                    })
                  }
                >
                  ›
                </button>
              </div>
              <div className="choir-calendar-weekdays">
                {WEEKDAYS.map((day, index) => (
                  <span key={`${day}-${index}`} className="choir-calendar-weekday">{day}</span>
                ))}
              </div>
              <div className="choir-calendar-grid">
                {calendarDays.map((day) =>
                  day.inMonth ? (
                    <button
                      key={day.dateKey}
                      type="button"
                      className={`choir-calendar-cell ${day.isToday ? "is-today" : ""}`}
                      onClick={() => {
                        if (day.events[0]) setSelectedRow(day.events[0]);
                      }}
                    >
                      <span className="choir-calendar-cell-num">{Number(day.dateKey.slice(-2))}</span>
                      {day.events.length > 0 ? (
                        <span className={`choir-avail-dot ${statusDotClass(day.dominantStatus)}`} />
                      ) : null}
                    </button>
                  ) : (
                    <div key={`pad-${day.dateKey}`} className="choir-calendar-cell is-outside" aria-hidden />
                  ),
                )}
              </div>
              <div className="choir-avail-legend">
                <span><i className="choir-avail-dot choir-avail-dot-available" /> Available</span>
                <span><i className="choir-avail-dot choir-avail-dot-unavailable" /> Unavailable</span>
                <span><i className="choir-avail-dot choir-avail-dot-maybe" /> Maybe</span>
                <span><i className="choir-avail-dot choir-avail-dot-pending" /> Not responded</span>
              </div>
            </div>
          </section>

          <section>
            <div className="choir-song-section-head">
              <h2 className="choir-song-section-title">My Assignments</h2>
              <Link href={choirMyScheduleHref(groupId)} className="choir-song-see-all">
                See All
              </Link>
            </div>
            {payload.assignmentPreview.length === 0 ? (
              <p className="text-sm text-[var(--choir-muted)]">No upcoming assignments.</p>
            ) : (
              <div className="space-y-2">
                {payload.assignmentPreview.map((assignment) => (
                  <Link
                    key={assignment.id}
                    href={choirMyScheduleHref(groupId)}
                    className="choir-avail-assignment-card"
                  >
                    <div>
                      <p className="font-semibold text-[var(--choir-heading)]">{assignment.title}</p>
                      <p className="text-xs text-[var(--choir-muted)]">{assignment.dateTimeLabel}</p>
                      <p className="text-xs text-[var(--choir-body)]">{assignment.roleLabel}</p>
                    </div>
                    <span className="choir-avail-status-badge choir-avail-status-available">
                      {assignment.status === "confirmed" ? "Confirmed" : "Awaiting confirmation"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="choir-song-bottom-cta">
            <span className="choir-song-cta-bulb" aria-hidden>📅</span>
            <div className="choir-song-cta-copy">
              <p className="choir-song-cta-title">Update Your Availability</p>
              <p className="choir-song-cta-sub">Keep your availability up to date so we can plan effectively.</p>
            </div>
            <button type="button" className="choir-song-cta-btn" onClick={() => setBulkOpen(true)}>
              Update Availability
            </button>
          </section>
        </>
      ) : null}

      {tab === "my-schedule" ? (
        <ChoirMyScheduleTab
          groupId={groupId}
          initialData={initialMySchedule}
          initialError={initialMyScheduleError}
        />
      ) : null}

      {(tab === "upcoming" || tab === "past") && (
        <OpportunitiesTab
          tab={tab}
          rows={listRows}
          filterCategory={filterCategory}
          filterStatus={filterStatus}
          onFilterCategory={setFilterCategory}
          onFilterStatus={setFilterStatus}
          onSelect={setSelectedRow}
          summary={payload?.summary ?? { awaiting: 0, available: 0, unavailable: 0, maybe: 0 }}
        />
      )}

      {tab === "guidelines" ? (
        <GuidelinesTab markdown={guidelinesMarkdown ?? ""} />
      ) : null}

      {payload?.canManage && payload.teamAvailabilityHref ? (
        <Link href={payload.teamAvailabilityHref} className="choir-setlist-manage-link block text-center">
          Team availability →
        </Link>
      ) : null}

      {message ? <p className="text-sm text-[var(--choir-body)]">{message}</p> : null}

      {selectedRow ? (
        <ResponseEditor
          row={selectedRow}
          note={editorNote}
          busy={editorBusy}
          onNote={setEditorNote}
          onClose={() => setSelectedRow(null)}
          onSave={(response) => saveResponse(selectedRow.event.id, response)}
        />
      ) : null}

      {bulkOpen ? (
        <BulkEditor
          rows={bulkEvents}
          draft={bulkDraft}
          busy={editorBusy}
          onDraft={setBulkDraft}
          onClose={() => setBulkOpen(false)}
          onSave={saveBulk}
        />
      ) : null}

      {prefsOpen ? <PreferencesSheet groupId={groupId} onClose={() => setPrefsOpen(false)} /> : null}

      {changeOpen ? (
        <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={() => setChangeOpen(null)}>
          <div className="choir-setlist-sheet" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">Request schedule change</h2>
            <p className="mt-2 text-sm text-[var(--choir-body)]">{changeOpen.title}</p>
            <textarea
              className="choir-announcement-textarea mt-3 w-full min-h-[88px]"
              placeholder="Why do you need a change?"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
            />
            <button
              type="button"
              className="choir-btn-primary mt-3 w-full"
              onClick={() => {
                const eventId = listRows.find((row) => row.event.worshipPlanKey === changeOpen.planKey)?.event.id;
                if (eventId) submitChangeRequest(eventId);
              }}
            >
              Submit request
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResponseEditor({
  row,
  note,
  busy,
  onNote,
  onClose,
  onSave,
}: {
  row: ChoirAvailabilityOpportunityView;
  note: string;
  busy: boolean;
  onNote: (value: string) => void;
  onClose: () => void;
  onSave: (response: string) => void;
}) {
  return (
    <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="choir-setlist-sheet" role="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">{row.event.title}</h2>
        <p className="text-sm text-[var(--choir-muted)]">
          {row.event.dateKey} · {row.event.timeLabel} · {row.event.location}
        </p>
        {row.responseDeadline ? (
          <p className="mt-1 text-xs text-[var(--choir-muted)]">
            Respond by {new Date(row.responseDeadline).toLocaleString()}
            {row.deadlinePassed ? " (deadline passed)" : ""}
          </p>
        ) : null}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(["available", "unavailable", "maybe"] as const).map((response) => (
            <button
              key={response}
              type="button"
              className="choir-avail-response-btn"
              disabled={busy || row.deadlinePassed}
              onClick={() => onSave(response)}
            >
              {response === "available" ? "Available" : response === "unavailable" ? "Unavailable" : "Maybe"}
            </button>
          ))}
        </div>
        <textarea
          className="choir-announcement-textarea mt-3 w-full min-h-[72px]"
          placeholder="Optional note for leadership"
          value={note}
          onChange={(e) => onNote(e.target.value)}
        />
      </div>
    </div>
  );
}

function BulkEditor({
  rows,
  draft,
  busy,
  onDraft,
  onClose,
  onSave,
}: {
  rows: ChoirAvailabilityOpportunityView[];
  draft: Record<string, string>;
  busy: boolean;
  onDraft: (value: Record<string, string>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="choir-setlist-sheet choir-song-form-sheet" role="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">Mark availability</h2>
        <div className="mt-3 max-h-[50vh] space-y-3 overflow-y-auto">
          {rows.length === 0 ? (
            <p className="text-sm text-[var(--choir-muted)]">No upcoming events.</p>
          ) : (
            rows.map((row) => (
              <div key={row.event.id} className="choir-card p-3">
                <p className="text-sm font-semibold text-[var(--choir-heading)]">{row.event.title}</p>
                <p className="text-xs text-[var(--choir-muted)]">{row.event.dateKey}</p>
                <select
                  className="choir-setlist-search mt-2 w-full"
                  value={
                    draft[row.event.id] ??
                    (row.availabilityStatus === "not_responded" ? "" : row.availabilityStatus)
                  }
                  onChange={(e) => onDraft({ ...draft, [row.event.id]: e.target.value })}
                >
                  <option value="">No change</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="maybe">Maybe</option>
                </select>
              </div>
            ))
          )}
        </div>
        <button type="button" className="choir-btn-primary mt-4 w-full" disabled={busy} onClick={onSave}>
          Save all
        </button>
      </div>
    </div>
  );
}

function PreferencesSheet({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const [notes, setNotes] = useState("");
  const [general, setGeneral] = useState("usually_available");
  const [maxFreq, setMaxFreq] = useState("flexible");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/groups/choir-availability?groupId=${encodeURIComponent(groupId)}&view=preferences`)
      .then((response) => response.json())
      .then((data) => {
        const prefs = data.preferences?.preferences;
        if (prefs) {
          setNotes(prefs.leadershipNotes ?? "");
          setGeneral(prefs.generalAvailability);
          setMaxFreq(prefs.maxFrequency ?? "flexible");
        }
      })
      .catch(() => undefined);
  }, [groupId]);

  async function save() {
    setBusy(true);
    await fetch("/api/groups/choir-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_preferences",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        generalAvailability: general,
        maxFrequency: maxFreq,
        leadershipNotes: notes,
        preferredServiceTimes: [],
        preferredRoles: [],
      }),
    });
    setBusy(false);
    onClose();
  }

  return (
    <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="choir-setlist-sheet" role="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">Availability preferences</h2>
        <label className="mt-3 block text-sm font-semibold">General pattern</label>
        <select className="choir-setlist-search w-full" value={general} onChange={(e) => setGeneral(e.target.value)}>
          <option value="usually_available">Usually available</option>
          <option value="usually_unavailable">Usually unavailable</option>
          <option value="varies">Varies</option>
        </select>
        <label className="mt-3 block text-sm font-semibold">Serving frequency preference</label>
        <select className="choir-setlist-search w-full" value={maxFreq} onChange={(e) => setMaxFreq(e.target.value)}>
          <option value="weekly">Weekly</option>
          <option value="twice_monthly">Twice monthly</option>
          <option value="monthly">Monthly</option>
          <option value="flexible">Flexible</option>
        </select>
        <textarea
          className="choir-announcement-textarea mt-3 w-full min-h-[80px]"
          placeholder="Notes to leadership"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="button" className="choir-btn-primary mt-3 w-full" disabled={busy} onClick={save}>
          Save preferences
        </button>
      </div>
    </div>
  );
}

function OpportunitiesTab({
  tab,
  rows,
  filterCategory,
  filterStatus,
  onFilterCategory,
  onFilterStatus,
  onSelect,
  summary,
}: {
  tab: "upcoming" | "past";
  rows: ChoirAvailabilityOpportunityView[];
  filterCategory: string;
  filterStatus: string;
  onFilterCategory: (value: string) => void;
  onFilterStatus: (value: string) => void;
  onSelect: (row: ChoirAvailabilityOpportunityView) => void;
  summary: ChoirAvailabilityHomePayload["summary"];
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">
        {tab === "past" ? "Past dates" : "Upcoming dates"}
      </h2>
      {tab === "upcoming" ? (
        <p className="text-xs text-[var(--choir-muted)]">
          Awaiting {summary.awaiting} · Available {summary.available} · Unavailable {summary.unavailable} · Maybe{" "}
          {summary.maybe}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <select className="choir-setlist-search" value={filterCategory} onChange={(e) => onFilterCategory(e.target.value)}>
          <option value="all">All events</option>
          <option value="service">Services</option>
          <option value="rehearsal">Rehearsals</option>
          <option value="event">Special events</option>
        </select>
        <select className="choir-setlist-search" value={filterStatus} onChange={(e) => onFilterStatus(e.target.value)}>
          <option value="all">All responses</option>
          <option value="awaiting">Awaiting response</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
          <option value="maybe">Maybe</option>
        </select>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--choir-muted)]">No events in this view.</p>
      ) : (
        rows.map((row) => <OpportunityCard key={row.event.id} row={row} onSelect={() => onSelect(row)} />)
      )}
    </section>
  );
}

function GuidelinesTab({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n\n+/);
  return (
    <section className="prose prose-sm max-w-none text-[var(--choir-body)]">
      <h2 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Availability Guidelines</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed">
        {blocks.map((block, index) => {
          const trimmed = block.trim();
          if (trimmed.startsWith("### ")) {
            return (
              <h3 key={index} className="font-display text-base font-bold text-[var(--choir-heading)]">
                {trimmed.replace(/^###\s*/, "")}
              </h3>
            );
          }
          if (trimmed.startsWith("## ")) {
            return (
              <h3 key={index} className="font-display text-lg font-bold text-[var(--choir-heading)]">
                {trimmed.replace(/^##\s*/, "")}
              </h3>
            );
          }
          return <p key={index}>{trimmed.replace(/\*\*/g, "")}</p>;
        })}
      </div>
    </section>
  );
}
