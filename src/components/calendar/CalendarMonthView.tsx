"use client";

import { useMemo, useState } from "react";
import {
  formatMonthLabel,
  formatSelectedDay,
  groupItemsByDate,
  shiftMonth,
  type CalendarPlannable,
} from "@/lib/calendar-utils";
import { Button, Card } from "@/components/ui";

type CalendarMonthViewProps<T extends CalendarPlannable> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyDayLabel?: string;
};

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView<T extends CalendarPlannable>({
  items,
  renderItem,
  emptyDayLabel = "No events on this day.",
}: CalendarMonthViewProps<T>) {
  const today = new Date();
  const [monthCursor, setMonthCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
  );

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
                const now = new Date();
                setMonthCursor({ year: now.getFullYear(), month: now.getMonth() });
                setSelectedDate(
                  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
                );
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

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-night-500">
          {WEEKDAY_HEADERS.map((label) => (
            <div key={label} className="py-2">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, index) => {
            if (cell.day == null || !cell.isoDate) {
              return <div key={`empty-${index}`} className="min-h-24 rounded-xl bg-sand-50/40" />;
            }

            const dayItems = itemsByDate.get(cell.isoDate) ?? [];
            const isSelected = selectedDate === cell.isoDate;
            const isToday =
              cell.isoDate ===
              `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

            return (
              <button
                key={cell.isoDate}
                type="button"
                onClick={() => setSelectedDate(cell.isoDate!)}
                className={`min-h-24 rounded-xl border p-2 text-left transition ${
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
                <div className="mt-1 space-y-1">
                  {dayItems.slice(0, 3).map((item) => (
                    <p
                      key={item.id}
                      className={`truncate text-[11px] leading-tight ${
                        isSelected ? "text-sand-100" : "text-night-700"
                      }`}
                    >
                      {item.title}
                    </p>
                  ))}
                  {dayItems.length > 3 && (
                    <p className={`text-[10px] ${isSelected ? "text-sand-200" : "text-night-500"}`}>
                      +{dayItems.length - 3} more
                    </p>
                  )}
                </div>
              </button>
            );
          })}
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
