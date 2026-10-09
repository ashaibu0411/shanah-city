"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MemberAvatarLink } from "@/components/auth/MemberAvatarLink";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import {
  CouplesLoadingSkeleton,
  CouplesPageHeader,
  CouplesPrimaryButton,
  CouplesSecondaryButton,
} from "@/components/couples/design-system";
import { CouplesSharedCalendar } from "@/components/couples/CouplesSharedCalendar";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import {
  COUPLE_CALENDAR_CATEGORIES,
  type CoupleCalendarPlannable,
} from "@/lib/couple-calendar-types";
import {
  mergeCalendarNotes,
  splitCalendarNotes,
  type CouplesCalendarViewMode,
} from "@/lib/couples-calendar-ui";
import { getZonedDateParts } from "@/lib/denver-time";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

type FormState = {
  eventId: string | null;
  title: string;
  location: string;
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
  location: "",
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

export function CouplesMarriageCalendar() {
  const { user, loading: authLoading } = useAuth();
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [items, setItems] = useState<CoupleCalendarPlannable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CouplesCalendarViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(getZonedDateParts().dateKey);

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

  function openCreate(prefillDate?: string) {
    setForm({
      ...EMPTY_FORM,
      dateKey: prefillDate ?? selectedDate,
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
    const { location, body } = splitCalendarNotes(item.notes);
    let endDateKey = "";
    let endTime = "";
    if (item.endAt) {
      const endParts = getZonedDateParts(new Date(item.endAt), item.timezone);
      endDateKey = endParts.dateKey;
      endTime = `${String(endParts.hour).padStart(2, "0")}:${String(endParts.minute).padStart(2, "0")}`;
    }
    setForm({
      eventId: item.id,
      title: item.title,
      location,
      notes: body,
      category: item.category,
      dateKey: parts.dateKey,
      time: item.allDay ? "19:00" : `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`,
      endDateKey,
      endTime,
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
    const notes = mergeCalendarNotes(form.location, form.notes);
    const endDateKey =
      form.endTime && !form.endDateKey ? form.dateKey : form.endDateKey || undefined;
    const body = {
      action: form.eventId ? "update" : "create",
      eventId: form.eventId,
      title: form.title,
      notes,
      category: form.category,
      dateKey: form.dateKey,
      time: form.time,
      endDateKey,
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
    setStatus(form.eventId ? "Event updated." : "Event added.");
  }

  async function deleteCurrentEvent() {
    if (!form.eventId) return;
    const item = items.find((entry) => entry.id === form.eventId);
    if (!item || item.isVirtualAnniversary) return;
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
    setFormOpen(false);
    setStatus("Event deleted.");
  }

  return (
    <div className={`${couplesHubPremium.page} couples-hub-typography min-h-full`}>
      <div className="mx-auto w-full max-w-lg">
        <CouplesPageHeader
          title="Our Calendar"
          backHref="/couples/marriage"
          backLabel="Back to Our Marriage"
          rightSlot={
            <MemberAvatarLink user={user} loading={authLoading} size="sm" className="!h-10 !w-10 ring-white/20" />
          }
        />

        <div className="px-[var(--couples-page-padding)] pb-32 pt-4">
          <p className="text-sm text-[var(--couples-muted)]">
            Shared with your spouse only · Mountain Time
          </p>

          {locked ? (
            <div className="mt-6">
              <CouplesLinkGate tone="sheet" pendingIncoming={hub?.pendingIncomingInvite} />
            </div>
          ) : error ? (
            <div className="mt-6 rounded-[1.25rem] bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
              <button
                type="button"
                className="mt-2 block font-semibold text-red-900 underline"
                onClick={() => void loadCalendar()}
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="mt-8">
              <CouplesLoadingSkeleton rows={5} />
            </div>
          ) : (
            <div className="mt-4">
              <CouplesSharedCalendar
                items={items}
                selectedDate={selectedDate}
                onSelectedDateChange={setSelectedDate}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onEventSelect={openEdit}
              />
            </div>
          )}

          {status ? (
            <p className="mt-4 rounded-xl bg-[var(--couples-sage)] px-3 py-2 text-sm text-[var(--couples-text)]">
              {status}
            </p>
          ) : null}
        </div>
      </div>

      {!locked && !loading ? (
        <button
          type="button"
          aria-label="Add calendar event"
          className="fixed bottom-24 right-[max(1rem,env(safe-area-inset-right))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--couples-midnight)] text-3xl font-light text-white shadow-lg transition active:scale-95 motion-reduce:transition-none"
          onClick={() => openCreate(selectedDate)}
        >
          +
        </button>
      ) : null}

      {formOpen && !locked ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--couples-midnight)]/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="couple-event-form-title"
        >
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[1.375rem] bg-[var(--couples-surface)] p-5 shadow-xl safe-bottom">
            <h2
              id="couple-event-form-title"
              className="font-[family-name:var(--font-couples-display)] text-xl font-semibold text-[var(--couples-text)]"
            >
              {form.eventId ? "Edit event" : "New event"}
            </h2>

            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="font-semibold text-[var(--couples-muted)]">Event title</span>
                <input
                  className="mt-1 w-full rounded-xl border border-[var(--couples-border)] bg-white px-3 py-2.5 text-sm"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                />
              </label>

              <label className="block text-sm">
                <span className="font-semibold text-[var(--couples-muted)]">Date</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-[var(--couples-border)] bg-white px-3 py-2.5 text-sm"
                  value={form.dateKey}
                  onChange={(event) => setForm((current) => ({ ...current, dateKey: event.target.value }))}
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-[var(--couples-text)]">
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(event) => setForm((current) => ({ ...current, allDay: event.target.checked }))}
                />
                <span className="font-semibold">All day</span>
              </label>

              {!form.allDay ? (
                <>
                  <label className="block text-sm">
                    <span className="font-semibold text-[var(--couples-muted)]">Start time</span>
                    <input
                      type="time"
                      className="mt-1 w-full rounded-xl border border-[var(--couples-border)] bg-white px-3 py-2.5 text-sm"
                      value={form.time}
                      onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-semibold text-[var(--couples-muted)]">End time (optional)</span>
                    <input
                      type="time"
                      className="mt-1 w-full rounded-xl border border-[var(--couples-border)] bg-white px-3 py-2.5 text-sm"
                      value={form.endTime}
                      onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                    />
                  </label>
                </>
              ) : null}

              <label className="block text-sm">
                <span className="font-semibold text-[var(--couples-muted)]">Category</span>
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--couples-border)] bg-white px-3 py-2.5 text-sm"
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                >
                  {COUPLE_CALENDAR_CATEGORIES.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.label}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="font-semibold text-[var(--couples-muted)]">Location</span>
                <input
                  className="mt-1 w-full rounded-xl border border-[var(--couples-border)] bg-white px-3 py-2.5 text-sm"
                  value={form.location}
                  placeholder="Optional"
                  onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                />
              </label>

              <label className="block text-sm">
                <span className="font-semibold text-[var(--couples-muted)]">Reminder</span>
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--couples-border)] bg-white px-3 py-2.5 text-sm"
                  value={form.reminderMin}
                  onChange={(event) => setForm((current) => ({ ...current, reminderMin: event.target.value }))}
                >
                  {REMINDER_OPTIONS.map((option) => (
                    <option key={option.value || "none"} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="font-semibold text-[var(--couples-muted)]">Notes</span>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[var(--couples-border)] bg-white px-3 py-2.5 text-sm"
                  rows={3}
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <CouplesPrimaryButton disabled={busy} onClick={() => void saveEvent()}>
                {busy ? "Saving…" : "Save"}
              </CouplesPrimaryButton>
              <CouplesSecondaryButton
                onClick={() => {
                  setFormOpen(false);
                }}
              >
                Cancel
              </CouplesSecondaryButton>
              {form.eventId ? (
                <button
                  type="button"
                  disabled={busy}
                  className="py-2 text-sm font-semibold text-red-700"
                  onClick={() => void deleteCurrentEvent()}
                >
                  Delete event
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
