"use client";

import { useMemo, useState } from "react";
import type { CoupleCalendarPlannable } from "@/lib/couple-calendar-types";
import {
  couplesCalendarCategoryUi,
  type CouplesCalendarViewMode,
} from "@/lib/couples-calendar-ui";
import {
  formatMonthLabel,
  formatSelectedDay,
  formatWeekLabel,
  getIsoWeekDays,
  groupItemsByDate,
  groupItemsByWeek,
  shiftMonth,
  shiftWeek,
  startOfWeekSunday,
} from "@/lib/calendar-utils";
import { getZonedDateParts } from "@/lib/denver-time";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function denverToday() {
  const denver = getZonedDateParts();
  return {
    year: Number(denver.year),
    month: Number(denver.month) - 1,
    dateKey: denver.dateKey,
  };
}

function formatEventTimeLine(item: CoupleCalendarPlannable) {
  if (item.allDay) return "All day";
  const start = new Date(item.startAt);
  if (!Number.isNaN(start.getTime())) {
    const weekday = start.toLocaleDateString(undefined, { weekday: "long" });
    const time = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${weekday} · ${time}`;
  }
  return item.time || item.schedule || "Time TBA";
}

function categoryDots(items: CoupleCalendarPlannable[]) {
  const seen = new Set<string>();
  const dots: string[] = [];
  for (const item of items) {
    const ui = couplesCalendarCategoryUi(item.category);
    if (seen.has(ui.dot)) continue;
    seen.add(ui.dot);
    dots.push(ui.dot);
    if (dots.length >= 3) break;
  }
  return dots;
}

export function CouplesCalendarViewSelector({
  mode,
  onChange,
}: {
  mode: CouplesCalendarViewMode;
  onChange: (mode: CouplesCalendarViewMode) => void;
}) {
  const options: { id: CouplesCalendarViewMode; label: string }[] = [
    { id: "month", label: "Month" },
    { id: "week", label: "Week" },
    { id: "agenda", label: "Agenda" },
  ];
  return (
    <div
      className="couples-calendar-view-selector flex rounded-full bg-[var(--couples-midnight)] p-1"
      role="tablist"
      aria-label="Calendar view"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={mode === option.id}
          onClick={() => onChange(option.id)}
          className={`flex-1 rounded-full px-3 py-2 text-center text-sm font-semibold transition motion-reduce:transition-none ${
            mode === option.id
              ? "bg-[var(--couples-surface)] text-[var(--couples-text)] shadow-sm"
              : "text-white/65 hover:text-white/90"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function DayCell({
  day,
  isoDate,
  items,
  isSelected,
  isToday,
  onSelect,
}: {
  day: number;
  isoDate: string;
  items: CoupleCalendarPlannable[];
  isSelected: boolean;
  isToday: boolean;
  onSelect: () => void;
}) {
  const dots = categoryDots(items);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex h-11 w-full flex-col items-center justify-center"
      aria-label={`${day}${items.length ? `, ${items.length} events` : ""}`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
          isSelected
            ? "bg-[var(--couples-midnight)] text-white"
            : isToday
              ? "ring-2 ring-[var(--couples-gold)] text-[var(--couples-text)]"
              : "text-[var(--couples-text)]"
        }`}
      >
        {day}
      </span>
      {dots.length > 0 ? (
        <span className="mt-0.5 flex items-center gap-0.5">
          {dots.map((color) => (
            <span key={color} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          ))}
        </span>
      ) : (
        <span className="mt-1.5 h-1.5" aria-hidden />
      )}
    </button>
  );
}

export function CouplesSharedCalendar({
  items,
  selectedDate,
  onSelectedDateChange,
  viewMode,
  onViewModeChange,
  onEventSelect,
}: {
  items: CoupleCalendarPlannable[];
  selectedDate: string;
  onSelectedDateChange: (dateKey: string) => void;
  viewMode: CouplesCalendarViewMode;
  onViewModeChange: (mode: CouplesCalendarViewMode) => void;
  onEventSelect?: (item: CoupleCalendarPlannable) => void;
}) {
  const today = denverToday();
  const todayKey = today.dateKey;
  const [monthCursor, setMonthCursor] = useState({ year: today.year, month: today.month });
  const [weekStart, setWeekStart] = useState(() => startOfWeekSunday(todayKey));

  const itemsByDate = useMemo(
    () => groupItemsByDate(items, monthCursor.year, monthCursor.month),
    [items, monthCursor.month, monthCursor.year],
  );

  const itemsByWeek = useMemo(() => groupItemsByWeek(items, weekStart), [items, weekStart]);

  const weekDays = useMemo(() => getIsoWeekDays(weekStart), [weekStart]);

  const firstWeekday = new Date(monthCursor.year, monthCursor.month, 1).getDay();
  const daysInMonth = new Date(monthCursor.year, monthCursor.month + 1, 0).getDate();
  const monthCells: Array<{ day: number | null; isoDate?: string }> = [];
  for (let index = 0; index < firstWeekday; index += 1) monthCells.push({ day: null });
  for (let day = 1; day <= daysInMonth; day += 1) {
    const isoDate = `${monthCursor.year}-${String(monthCursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    monthCells.push({ day, isoDate });
  }

  const headerLabel =
    viewMode === "week"
      ? formatWeekLabel(weekStart)
      : formatMonthLabel(monthCursor.year, monthCursor.month);

  function goPrevious() {
    if (viewMode === "week") {
      setWeekStart((current) => shiftWeek(current, -1));
      return;
    }
    setMonthCursor((current) => shiftMonth(current.year, current.month, -1));
  }

  function goNext() {
    if (viewMode === "week") {
      setWeekStart((current) => shiftWeek(current, 1));
      return;
    }
    setMonthCursor((current) => shiftMonth(current.year, current.month, 1));
  }

  const selectedDayItems = useMemo(() => {
    if (viewMode === "week") {
      return itemsByWeek.get(selectedDate) ?? [];
    }
    return itemsByDate.get(selectedDate) ?? [];
  }, [itemsByDate, itemsByWeek, selectedDate, viewMode]);

  const agendaGroups = useMemo(() => {
    const keys = new Set<string>();
    for (const item of items) {
      const parts = getZonedDateParts(new Date(item.startAt), item.timezone);
      keys.add(parts.dateKey);
    }
    return Array.from(keys)
      .sort()
      .filter((dateKey) => dateKey >= todayKey)
      .map((dateKey) => ({
        dateKey,
        items: items.filter((item) => {
          const parts = getZonedDateParts(new Date(item.startAt), item.timezone);
          return parts.dateKey === dateKey;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [items, todayKey]);

  return (
    <div className="space-y-4">
      <CouplesCalendarViewSelector mode={viewMode} onChange={onViewModeChange} />

      {viewMode !== "agenda" ? (
        <div className="rounded-[1.375rem] bg-[var(--couples-surface)] px-3 pb-4 pt-4 shadow-[var(--couples-shadow-card)]">
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              aria-label="Previous"
              className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-[var(--couples-muted)] transition hover:bg-[var(--couples-background)] active:scale-95"
              onClick={goPrevious}
            >
              ‹
            </button>
            <h3
              className="font-[family-name:var(--font-couples-display)] text-[1.125rem] font-semibold text-[var(--couples-text)]"
            >
              {headerLabel}
            </h3>
            <button
              type="button"
              aria-label="Next"
              className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-[var(--couples-muted)] transition hover:bg-[var(--couples-background)] active:scale-95"
              onClick={goNext}
            >
              ›
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-0.5 text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
            {WEEKDAY_HEADERS.map((label) => (
              <div key={label} className="py-1.5">{label}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {viewMode === "month"
              ? monthCells.map((cell, index) => {
                  if (cell.day == null || !cell.isoDate) {
                    return <div key={`e-${index}`} className="h-11" />;
                  }
                  const dayItems = itemsByDate.get(cell.isoDate) ?? [];
                  return (
                    <DayCell
                      key={cell.isoDate}
                      day={cell.day}
                      isoDate={cell.isoDate}
                      items={dayItems}
                      isSelected={selectedDate === cell.isoDate}
                      isToday={cell.isoDate === todayKey}
                      onSelect={() => onSelectedDateChange(cell.isoDate!)}
                    />
                  );
                })
              : weekDays.map((isoDate) => {
                  const dayNumber = Number(isoDate.split("-")[2]);
                  const dayItems = itemsByWeek.get(isoDate) ?? [];
                  return (
                    <DayCell
                      key={isoDate}
                      day={dayNumber}
                      isoDate={isoDate}
                      items={dayItems}
                      isSelected={selectedDate === isoDate}
                      isToday={isoDate === todayKey}
                      onSelect={() => onSelectedDateChange(isoDate)}
                    />
                  );
                })}
          </div>
        </div>
      ) : null}

      {viewMode === "agenda" ? (
        <div className="space-y-3">
          {agendaGroups.length === 0 ? (
            <p className="rounded-[1.375rem] bg-[var(--couples-surface)] px-4 py-8 text-center text-sm text-[var(--couples-muted)]">
              No upcoming events on your shared calendar.
            </p>
          ) : (
            agendaGroups.map((group) => (
              <section key={group.dateKey}>
                <button
                  type="button"
                  className="mb-2 text-left font-[family-name:var(--font-couples-display)] text-base font-semibold text-[var(--couples-text)]"
                  onClick={() => onSelectedDateChange(group.dateKey)}
                >
                  {formatSelectedDay(group.dateKey)}
                </button>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <AgendaRow
                      key={item.id}
                      item={item}
                      onPress={() => {
                        onSelectedDateChange(group.dateKey);
                        onEventSelect?.(item);
                      }}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      ) : (
        <SelectedDayEvents
          selectedDate={selectedDate}
          items={selectedDayItems}
          onSelectItem={(item) => onEventSelect?.(item)}
        />
      )}
    </div>
  );
}

function AgendaRow({
  item,
  onPress,
}: {
  item: CoupleCalendarPlannable;
  onPress: () => void;
}) {
  const ui = couplesCalendarCategoryUi(item.category);
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-center gap-3 rounded-[1.125rem] bg-[var(--couples-surface)] px-3 py-3 text-left transition active:scale-[0.99]"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: ui.iconBg, color: ui.iconColor }}
        aria-hidden
      >
        •
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-semibold text-[var(--couples-text)]">{item.title}</span>
        <span className="mt-0.5 block text-xs text-[var(--couples-muted)]">{formatEventTimeLine(item)}</span>
      </span>
      <span className="text-[var(--couples-muted)]" aria-hidden>›</span>
    </button>
  );
}

export function CouplesCalendarEventCard({
  item,
  onClick,
}: {
  item: CoupleCalendarPlannable;
  onClick?: () => void;
}) {
  const ui = couplesCalendarCategoryUi(item.category);
  const inner = (
    <>
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ backgroundColor: ui.iconBg, color: ui.iconColor }}
        aria-hidden
      >
        {item.category === "date-night" ? "♥" : item.category === "church" ? "✦" : "•"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-semibold text-[var(--couples-text)]">{item.title}</span>
        <span className="mt-0.5 block text-[0.8125rem] text-[var(--couples-muted)]">
          {formatEventTimeLine(item)}
        </span>
        <span className="mt-1 inline-block text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--couples-gold)]">
          {ui.label}
        </span>
      </span>
      <span className="self-center text-[var(--couples-muted)]" aria-hidden>›</span>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-[1.125rem] bg-[var(--couples-surface)] px-3 py-3.5 text-left transition active:scale-[0.99] motion-reduce:transition-none"
      >
        {inner}
      </button>
    );
  }
  return <div className="flex w-full items-center gap-3 rounded-[1.125rem] bg-[var(--couples-surface)] px-3 py-3.5">{inner}</div>;
}

function SelectedDayEvents({
  selectedDate,
  items,
  onSelectItem,
}: {
  selectedDate: string;
  items: CoupleCalendarPlannable[];
  onSelectItem: (item: CoupleCalendarPlannable) => void;
}) {
  return (
    <section>
      <h4 className="font-[family-name:var(--font-couples-display)] text-[1.0625rem] font-semibold text-[var(--couples-text)]">
        {formatSelectedDay(selectedDate)}
      </h4>
      {items.length === 0 ? (
        <p className="mt-3 rounded-[1.125rem] bg-[var(--couples-surface)] px-4 py-6 text-center text-sm text-[var(--couples-muted)]">
          Nothing planned this day.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <CouplesCalendarEventCard key={item.id} item={item} onClick={() => onSelectItem(item)} />
          ))}
        </div>
      )}
    </section>
  );
}
