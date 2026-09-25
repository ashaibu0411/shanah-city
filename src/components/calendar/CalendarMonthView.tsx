"use client";

import { useMemo, useState } from "react";
import {
  formatMonthLabel,
  formatSelectedDay,
  groupItemsByDate,
  shiftMonth,
  type CalendarPlannable,
} from "@/lib/calendar-utils";
import { getZonedDateParts } from "@/lib/denver-time";
import { Button, Card } from "@/components/ui";

type CalendarMonthViewProps<T extends CalendarPlannable> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyDayLabel?: string;
  emptyMonthLabel?: string;
};

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function denverMonthCursor(reference = new Date()) {
  const denver = getZonedDateParts(reference);
  return {
    year: Number(denver.year),
    month: Number(denver.month) - 1,
    dateKey: denver.dateKey,
  };
}

function isViewingDenverMonth(
  monthCursor: { year: number; month: number },
  dateKey: string,
) {
  const [year, month] = dateKey.split("-").map(Number);
  return monthCursor.year === year && monthCursor.month === month - 1;
}

function itemTime(item: CalendarPlannable) {
  return item.time?.trim() || item.schedule?.trim() || "";
}

function previewPeopleLines(item: CalendarPlannable) {
  const previewLines = item.calendarPreview?.trim().split("\n").filter(Boolean) ?? [];
  if (previewLines.length <= 1) return previewLines;
  return previewLines.slice(1);
}

/** One line for month grid cells — avoids breaking the 7-column layout on small screens. */
function calendarGridSummary(item: CalendarPlannable) {
  const people = previewPeopleLines(item);
  if (people.length === 1) return people[0];
  if (people.length > 1) {
    const first = people[0];
    const short = first.length > 18 ? `${first.slice(0, 16)}…` : first;
    return `${short} +${people.length - 1}`;
  }
  const title = item.title.trim();
  return title.length > 22 ? `${title.slice(0, 20)}…` : title;
}

function EventText({
  item,
  inverted = false,
  compact = false,
  grid = false,
}: {
  item: CalendarPlannable;
  inverted?: boolean;
  compact?: boolean;
  grid?: boolean;
}) {
  const time = itemTime(item);
  const previewLines = item.calendarPreview?.trim().split("\n").filter(Boolean) ?? [];
  const peopleLines = previewPeopleLines(item);

  if (grid) {
    return (
      <p
        className={`truncate text-[10px] leading-tight ${
          inverted ? "text-sand-100" : "text-night-800"
        }`}
        title={calendarGridSummary(item)}
      >
        {calendarGridSummary(item)}
      </p>
    );
  }

  const bodyLines =
    previewLines.length > 0
      ? compact
        ? peopleLines.length > 0
          ? [item.title, ...peopleLines]
          : previewLines
        : previewLines
      : [item.title];

  return (
    <div
      className={`rounded-md px-1.5 py-1 ${
        inverted ? "bg-white/12 text-sand-50" : "bg-violet-50 text-night-900"
      }`}
    >
      {time && previewLines.length === 0 ? (
        <p className={`font-semibold leading-tight ${compact ? "text-[10px]" : "text-xs"}`}>
          {time}
        </p>
      ) : null}
      {bodyLines.map((line, index) => (
        <p
          key={`${item.id}-${index}`}
          className={`leading-snug ${
            compact ? "text-[10px]" : "text-[11px]"
          } ${compact ? "line-clamp-2 break-normal" : "whitespace-pre-wrap break-words"} ${
            inverted ? "text-sand-50" : index === 0 ? "text-night-900" : "text-night-700"
          }`}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

function MobileMonthDayCell({
  day,
  isoDate,
  count,
  isSelected,
  isToday,
  onSelect,
}: {
  day: number;
  isoDate: string;
  count: number;
  isSelected: boolean;
  isToday: boolean;
  onSelect: () => void;
}) {
  const dotCount = Math.min(count, 3);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={
        count > 0
          ? `${day}, ${count} event${count === 1 ? "" : "s"}`
          : `${day}, no events`
      }
      className={`flex h-11 w-full flex-col items-center justify-center rounded-lg ring-1 ring-night-900/5 ${
        isSelected
          ? "bg-night-900 text-white ring-night-900"
          : isToday
            ? "bg-amber-50 text-amber-950 ring-amber-200"
            : count > 0
              ? "bg-violet-50/90 text-night-900"
              : "bg-white text-night-700"
      }`}
    >
      <span className="text-sm font-semibold leading-none">{day}</span>
      {count > 0 ? (
        <div className="mt-1 flex items-center gap-0.5">
          {Array.from({ length: dotCount }).map((_, index) => (
            <span
              key={`dot-${isoDate}-${index}`}
              className={`h-1.5 w-1.5 rounded-full ${
                isSelected ? "bg-sand-200" : "bg-violet-500"
              }`}
            />
          ))}
          {count > 3 ? (
            <span className={`text-[9px] font-semibold ${isSelected ? "text-sand-200" : "text-violet-700"}`}>
              +{count - 3}
            </span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}

export function CalendarMonthView<T extends CalendarPlannable>({
  items,
  renderItem,
  emptyDayLabel = "No events on this day.",
  emptyMonthLabel = "No events this month.",
}: CalendarMonthViewProps<T>) {
  const denverToday = denverMonthCursor();
  const todayKey = denverToday.dateKey;
  const [monthCursor, setMonthCursor] = useState({
    year: denverToday.year,
    month: denverToday.month,
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey);

  const itemsByDate = useMemo(
    () => groupItemsByDate(items, monthCursor.year, monthCursor.month),
    [items, monthCursor.month, monthCursor.year],
  );

  const firstWeekday = new Date(monthCursor.year, monthCursor.month, 1).getDay();
  const daysInMonth = new Date(monthCursor.year, monthCursor.month + 1, 0).getDate();
  const cells: Array<{ day: number | null; isoDate?: string }> = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ day: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isoDate = `${monthCursor.year}-${String(monthCursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, isoDate });
  }

  const selectedItems = selectedDate ? (itemsByDate.get(selectedDate) ?? []) : [];
  const agendaDays = cells
    .filter((cell): cell is { day: number; isoDate: string } => Boolean(cell.isoDate && cell.day))
    .map((cell) => ({
      ...cell,
      dayItems: itemsByDate.get(cell.isoDate) ?? [],
    }))
    .filter((cell) => cell.dayItems.length > 0);

  const viewingCurrentMonth = isViewingDenverMonth(monthCursor, todayKey);
  const upcomingAgendaDays = viewingCurrentMonth
    ? agendaDays.filter((day) => day.isoDate >= todayKey)
    : agendaDays;

  return (
    <div className="mb-6 space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-night-900">
            {formatMonthLabel(monthCursor.year, monthCursor.month)}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setMonthCursor((current) => shiftMonth(current.year, current.month, -1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const now = denverMonthCursor();
                setMonthCursor({ year: now.year, month: now.month });
                setSelectedDate(now.dateKey);
              }}
            >
              Today
            </Button>
            <Button
              variant="secondary"
              onClick={() => setMonthCursor((current) => shiftMonth(current.year, current.month, 1))}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="mt-4 hidden overflow-x-auto lg:block">
          <div className="min-w-[64rem]">
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-wide text-night-500">
              {WEEKDAY_HEADERS.map((label) => (
                <div key={label} className="py-2">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((cell, index) => {
                if (cell.day == null || !cell.isoDate) {
                  return <div key={`empty-${index}`} className="h-[10rem] rounded-xl bg-sand-50/40" />;
                }

                const dayItems = itemsByDate.get(cell.isoDate) ?? [];
                const isSelected = selectedDate === cell.isoDate;
                const isToday = cell.isoDate === todayKey;

                return (
                  <button
                    key={cell.isoDate}
                    type="button"
                    onClick={() => setSelectedDate(cell.isoDate!)}
                    className={`flex h-[10rem] flex-col overflow-hidden rounded-xl border p-2 text-left transition ${
                      isSelected
                        ? "border-night-900 bg-night-900 text-sand-50"
                        : "border-night-900/10 bg-white hover:bg-sand-50"
                    }`}
                  >
                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        isToday && !isSelected ? "text-amber-700" : ""
                      }`}
                    >
                      {cell.day}
                    </span>
                    <div className="mt-1.5 min-h-0 flex-1 space-y-1 overflow-hidden">
                      {dayItems.slice(0, 4).map((item) => (
                        <EventText
                          key={item.id}
                          item={item}
                          inverted={isSelected}
                          grid
                        />
                      ))}
                      {dayItems.length > 4 && (
                        <p className={`text-[11px] font-semibold ${isSelected ? "text-sand-200" : "text-night-500"}`}>
                          +{dayItems.length - 4} more
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 lg:hidden">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-night-500">
            {WEEKDAY_HEADERS.map((label) => (
              <div key={label} className="py-1">
                {label.slice(0, 1)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, index) => {
              if (cell.day == null || !cell.isoDate) {
                return <div key={`empty-${index}`} className="h-11 rounded-lg bg-sand-50/40" />;
              }
              const count = itemsByDate.get(cell.isoDate)?.length ?? 0;
              const isSelected = selectedDate === cell.isoDate;
              const isToday = cell.isoDate === todayKey;
              return (
                <MobileMonthDayCell
                  key={cell.isoDate}
                  day={cell.day}
                  isoDate={cell.isoDate}
                  count={count}
                  isSelected={isSelected}
                  isToday={isToday}
                  onSelect={() => setSelectedDate(cell.isoDate!)}
                />
              );
            })}
          </div>

          {selectedDate ? (
            <div className="mt-4 rounded-xl border border-night-900/10 bg-sand-50/80 p-4">
              <h4 className="font-display text-base font-semibold text-night-900">
                {formatSelectedDay(selectedDate)}
              </h4>
              {selectedItems.length === 0 ? (
                <p className="mt-2 text-sm text-night-500">{emptyDayLabel}</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {selectedItems.map((item) => renderItem(item as T))}
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
              Upcoming this month
            </p>
            {upcomingAgendaDays.length === 0 ? (
              <p className="text-sm text-night-500">
                {viewingCurrentMonth ? "No upcoming events this month." : emptyMonthLabel}
              </p>
            ) : (
              upcomingAgendaDays.map((day) => {
                const isSelected = selectedDate === day.isoDate;
                return (
                  <section key={day.isoDate}>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(day.isoDate)}
                      className="mb-2 text-left"
                    >
                      <h4
                        className={`font-display text-base font-semibold ${
                          isSelected ? "text-teal-800" : "text-night-900"
                        }`}
                      >
                        {formatSelectedDay(day.isoDate)}
                      </h4>
                    </button>
                    {isSelected ? null : (
                      <div className="space-y-2">
                        {day.dayItems.map((item) => (
                          <EventText key={item.id} item={item} compact />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {selectedDate ? (
        <Card className="hidden lg:block">
          <h3 className="font-display text-lg font-semibold text-night-900">
            {formatSelectedDay(selectedDate)}
          </h3>
          {selectedItems.length === 0 ? (
            <p className="mt-3 text-sm text-night-500">{emptyDayLabel}</p>
          ) : (
            <div className="mt-4 grid gap-3">{selectedItems.map((item) => renderItem(item))}</div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
