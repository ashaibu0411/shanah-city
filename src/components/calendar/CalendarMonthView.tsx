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

function EventText({
  item,
  inverted = false,
  compact = false,
}: {
  item: CalendarPlannable;
  inverted?: boolean;
  compact?: boolean;
}) {
  const time = itemTime(item);
  return (
    <div
      className={`rounded-md px-1.5 py-1 ${
        inverted ? "bg-white/12 text-sand-50" : "bg-violet-50 text-night-900"
      }`}
    >
      {time ? (
        <p className={`font-semibold leading-tight ${compact ? "text-[10px]" : "text-xs"}`}>
          {time}
        </p>
      ) : null}
      <p
        className={`leading-snug ${compact ? "line-clamp-3 text-[11px]" : "text-sm"} ${
          inverted ? "text-sand-50" : "text-night-800"
        }`}
      >
        {item.title}
      </p>
    </div>
  );
}

export function CalendarMonthView<T extends CalendarPlannable>({
  items,
  renderItem,
  emptyDayLabel = "No events on this day.",
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
                  return <div key={`empty-${index}`} className="min-h-[10rem] rounded-xl bg-sand-50/40" />;
                }

                const dayItems = itemsByDate.get(cell.isoDate) ?? [];
                const isSelected = selectedDate === cell.isoDate;
                const isToday = cell.isoDate === todayKey;

                return (
                  <button
                    key={cell.isoDate}
                    type="button"
                    onClick={() => setSelectedDate(cell.isoDate!)}
                    className={`min-h-[10rem] rounded-xl border p-2 text-left transition ${
                      isSelected
                        ? "border-night-900 bg-night-900 text-sand-50"
                        : "border-night-900/10 bg-white hover:bg-sand-50"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        isToday && !isSelected ? "text-amber-700" : ""
                      }`}
                    >
                      {cell.day}
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {dayItems.slice(0, 4).map((item) => (
                        <EventText
                          key={item.id}
                          item={item}
                          inverted={isSelected}
                          compact
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
                return <div key={`empty-${index}`} className="h-10 rounded-lg bg-sand-50/40" />;
              }
              const count = itemsByDate.get(cell.isoDate)?.length ?? 0;
              const isSelected = selectedDate === cell.isoDate;
              const isToday = cell.isoDate === todayKey;
              return (
                <button
                  key={cell.isoDate}
                  type="button"
                  onClick={() => setSelectedDate(cell.isoDate!)}
                  className={`h-10 rounded-lg text-sm font-semibold ${
                    isSelected
                      ? "bg-night-900 text-white"
                      : isToday
                        ? "bg-amber-100 text-amber-900"
                        : count > 0
                          ? "bg-violet-50 text-night-900"
                          : "bg-white text-night-700 ring-1 ring-night-900/5"
                  }`}
                >
                  {cell.day}
                  {count > 0 ? (
                    <span className="mx-auto mt-0.5 block h-1 w-1 rounded-full bg-current opacity-70" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-4">
            {upcomingAgendaDays.length === 0 ? (
              <p className="text-sm text-night-500">
                {viewingCurrentMonth
                  ? "No upcoming meetings this month."
                  : "No events this month."}
              </p>
            ) : (
              upcomingAgendaDays.map((day) => (
                <section key={day.isoDate}>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(day.isoDate)}
                    className="mb-2 text-left"
                  >
                    <h4 className="font-display text-base font-semibold text-night-900">
                      {formatSelectedDay(day.isoDate)}
                    </h4>
                  </button>
                  <div className="space-y-2">
                    {day.dayItems.map((item) => (
                      <EventText key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </Card>

      {selectedDate && (
        <Card>
          <h3 className="font-display text-lg font-semibold text-night-900">
            {formatSelectedDay(selectedDate)}
          </h3>
          {selectedItems.length === 0 ? (
            <p className="mt-3 text-sm text-night-500">{emptyDayLabel}</p>
          ) : (
            <div className="mt-4 grid gap-3">{selectedItems.map((item) => renderItem(item))}</div>
          )}
        </Card>
      )}
    </div>
  );
}
