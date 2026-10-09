"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarMonthView } from "@/components/calendar/CalendarMonthView";
import { CouplesHubScreen } from "@/components/couples/CouplesHubScreen";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { powerCouplesGroupHubPath } from "@/lib/couples-hub-paths";
import { Button } from "@/components/ui";
import {
  COUPLE_CALENDAR_CATEGORIES,
  type CoupleCalendarPlannable,
} from "@/lib/couple-calendar-types";
import { getZonedDateParts } from "@/lib/denver-time";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

type FormState = {
  eventId: string | null;
  title: string;
  notes: string;
  category: string;
  dateKey: string;
  time: string;
  endDateKey: string;
  endTime: string;
  allDay: boolean;
  recurrence: "none" | "daily" | "weekly";
  reminderMin: string;
};

const EMPTY_FORM: FormState = {
  eventId: null,
  title: "",
  notes: "",
  category: "general",
  dateKey: getZonedDateParts().dateKey,
  time: "19:00",
  endDateKey: "",
  endTime: "",
  allDay: false,
  recurrence: "none",
  reminderMin: "",
};

const REMINDER_OPTIONS = [
  { value: "", label: "No reminder" },
  { value: "15", label: "15 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

function categoryChipClass(category: string) {
  switch (category) {
    case "date-night":
      return "bg-rose-500/25 text-rose-100";
    case "anniversary":
      return "bg-amber-500/25 text-amber-100";
    case "family":
      return "bg-sky-500/25 text-sky-100";
    case "church":
      return "bg-violet-500/25 text-violet-100";
    default:
      return "bg-white/10 text-[var(--couples-text-muted)]";
  }
}

export function CouplesMarriageCalendar() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [items, setItems] = useState<CoupleCalendarPlannable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CoupleCalendarPlannable | null>(null);

  const loadHub = useCallback(() => {
    return fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setHub(data.overview ?? null);
      })
      .catch(() => undefined);
  }, []);

  const loadCalendar = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetch("/api/couples/calendar")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Could not load calendar.");
        }
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load calendar.");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadHub();
    void loadCalendar();
  }, [loadHub, loadCalendar]);

  const locked = !hub?.hasActiveLink;

  const calendarItems = useMemo(() => items, [items]);

  function openCreate(prefillDate?: string) {
    setSelectedItem(null);
    setForm({
      ...EMPTY_FORM,
      dateKey: prefillDate ?? getZonedDateParts().dateKey,
    });
    setFormOpen(true);
    setStatus(null);
  }

  function openEdit(item: CoupleCalendarPlannable) {
    if (item.isVirtualAnniversary) {
      setStatus("Set your wedding anniversary on Profile to edit anniversary reminders.");
      return;
    }
    const parts = getZonedDateParts(new Date(item.startAt), item.timezone);
    setSelectedItem(item);
    setForm({
      eventId: item.id,
      title: item.title,
      notes: item.notes ?? "",
      category: item.category,
      dateKey: parts.dateKey,
      time: item.allDay ? "19:00" : `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`,
      endDateKey: item.endAt
        ? getZonedDateParts(new Date(item.endAt), item.timezone).dateKey
        : "",
      endTime: "",
      allDay: item.allDay,
      recurrence: item.recurrence ?? "none",
      reminderMin: item.reminderMin != null ? String(item.reminderMin) : "",
    });
    setFormOpen(true);
    setStatus(null);
  }

  async function saveEvent() {
    setBusy(true);
    setStatus(null);
    const body = {
      action: form.eventId ? "update" : "create",
      eventId: form.eventId,
      title: form.title,
      notes: form.notes,
      category: form.category,
      dateKey: form.dateKey,
      time: form.time,
      endDateKey: form.endDateKey || undefined,
      endTime: form.endTime || undefined,
      allDay: form.allDay,
      recurrence: form.recurrence,
      reminderMin: form.reminderMin || null,
      timezone: "America/Denver",
    };

    const response = await fetch("/api/couples/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not save event.");
      return;
    }

    setItems(Array.isArray(data.items) ? data.items : []);
    setFormOpen(false);
    setSelectedItem(null);
    setStatus(form.eventId ? "Event updated." : "Event added.");
  }

  async function deleteEvent(item: CoupleCalendarPlannable) {
    if (item.isVirtualAnniversary) return;
    if (!window.confirm(`Delete “${item.title}”?`)) return;

    setBusy(true);
    const response = await fetch("/api/couples/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", eventId: item.id }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not delete event.");
      return;
    }

    setItems(Array.isArray(data.items) ? data.items : []);
    setSelectedItem(null);
    setStatus("Event deleted.");
  }

  return (
    <CouplesHubScreen
      title="Our calendar"
      fab={
        locked
          ? undefined
          : { label: "Add calendar event", onClick: () => openCreate() }
      }
    >
        <p className={couplesHubPremium.sheetSubtitle}>
          Shared with your spouse only. Times use Mountain Time.
        </p>

        {locked ? (
          <div className="mt-6">
            <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
          </div>
        ) : (
          <>
            {error ? (
              <p className={couplesHubPremium.sheetStatusError}>{error}</p>
            ) : loading ? (
              <p className="mt-8 text-center text-sm text-[var(--couples-sheet-muted)]">Loading calendar…</p>
            ) : (
              <div className="couples-hub-calendar mt-2">
                <CalendarMonthView
                  items={calendarItems}
                  emptyDayLabel="Nothing planned — tap + or pick another day."
                  emptyMonthLabel="No shared events this month yet."
                  renderItem={(item) => (
                    <div className={couplesHubPremium.sheetListRow}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${categoryChipClass(item.category)}`}
                          >
                            {COUPLE_CALENDAR_CATEGORIES.find((entry) => entry.id === item.category)
                              ?.label ?? item.category}
                          </span>
                          <p className="mt-1 font-display text-base font-semibold text-stone-900">
                            {item.title}
                          </p>
                          <p className="text-sm text-[var(--couples-sheet-muted)]">
                            {item.allDay ? "All day" : item.time || item.schedule}
                            {item.recurrence && item.recurrence !== "none"
                              ? ` · Repeats ${item.recurrence}`
                              : ""}
                          </p>
                          {item.notes ? (
                            <p className="mt-2 text-sm text-[var(--couples-text-muted)]">{item.notes}</p>
                          ) : null}
                          {item.isVirtualAnniversary ? (
                            <p className="mt-1 text-xs text-[var(--couples-text-muted)]">
                              From your profile anniversary — edit the date on Profile.
                            </p>
                          ) : null}
                        </div>
                        {!item.isVirtualAnniversary ? (
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              className="text-xs font-semibold text-[var(--couples-text)] underline-offset-2 hover:underline"
                              onClick={() => openEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-xs font-semibold text-red-300 underline-offset-2 hover:underline"
                              onClick={() => void deleteEvent(item)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                />
              </div>
            )}

            {status ? (
              <p className={couplesHubPremium.sheetStatusOk}>{status}</p>
            ) : null}
          </>
        )}

        {formOpen && !locked ? (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="couple-event-form-title"
          >
            <div className={couplesHubPremium.sheetModal}>
              <h2
                id="couple-event-form-title"
                className="font-display text-lg font-semibold text-stone-900"
              >
                {form.eventId ? "Edit event" : "New event"}
              </h2>

              <div className="mt-4 space-y-3">
                <label className="block text-sm">
                  <span className="font-semibold text-[var(--couples-sheet-muted)]">Title</span>
                  <input
                    className={`mt-1 ${couplesHubPremium.sheetInput}`}
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-[var(--couples-sheet-muted)]">Category</span>
                  <select
                    className={`mt-1 ${couplesHubPremium.sheetInput}`}
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, category: event.target.value }))
                    }
                  >
                    {COUPLE_CALENDAR_CATEGORIES.map((entry) => (
                      <option key={entry.id} value={entry.id}>{entry.label}</option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2 text-sm text-[var(--couples-text-muted)]">
                  <input
                    type="checkbox"
                    checked={form.allDay}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, allDay: event.target.checked }))
                    }
                  />
                  <span className="font-semibold">All day</span>
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-[var(--couples-sheet-muted)]">Date</span>
                  <input
                    type="date"
                    className={`mt-1 ${couplesHubPremium.sheetInput}`}
                    value={form.dateKey}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, dateKey: event.target.value }))
                    }
                  />
                </label>

                {!form.allDay ? (
                  <label className="block text-sm">
                    <span className="font-semibold text-[var(--couples-sheet-muted)]">Start time</span>
                    <input
                      type="time"
                      className={`mt-1 ${couplesHubPremium.sheetInput}`}
                      value={form.time}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, time: event.target.value }))
                      }
                    />
                  </label>
                ) : null}

                <label className="block text-sm">
                  <span className="font-semibold text-[var(--couples-sheet-muted)]">Repeat</span>
                  <select
                    className={`mt-1 ${couplesHubPremium.sheetInput}`}
                    value={form.recurrence}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        recurrence: event.target.value as FormState["recurrence"],
                      }))
                    }
                  >
                    <option value="none">Does not repeat</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-[var(--couples-sheet-muted)]">Reminder</span>
                  <select
                    className={`mt-1 ${couplesHubPremium.sheetInput}`}
                    value={form.reminderMin}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, reminderMin: event.target.value }))
                    }
                  >
                    {REMINDER_OPTIONS.map((option) => (
                      <option key={option.value || "none"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-[var(--couples-sheet-muted)]">Notes</span>
                  <textarea
                    className={`mt-1 ${couplesHubPremium.sheetInput}`}
                    rows={3}
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, notes: event.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" disabled={busy} onClick={() => void saveEvent()}>
                  {busy ? "Saving…" : "Save"}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => {
                    setFormOpen(false);
                    setSelectedItem(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <Link href={powerCouplesGroupHubPath()} className={`${couplesHubPremium.sheetPrimaryCta} mt-10 !bg-stone-200 !text-stone-900`}>
          Back to Couples Hub
        </Link>
    </CouplesHubScreen>
  );
}
