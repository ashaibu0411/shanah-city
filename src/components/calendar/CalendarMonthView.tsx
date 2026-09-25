"use client";

import { useMemo, useState } from "react";
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

type CalendarViewMode = "month" | "week";

function formatAgendaDayHeading(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

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
  expanded = false,
}: {
  item: CalendarPlannable;
  inverted?: boolean;
  compact?: boolean;
  grid?: boolean;
  expanded?: boolean;
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
      ? expanded
        ? peopleLines.length > 0
          ? [item.title, ...peopleLines]
          : previewLines
        : compact
          ? peopleLines.length > 0
            ? [item.title, ...peopleLines]
            : previewLines
          : previewLines
      : [item.title];

  const textSize = expanded ? "text-[9px]" : compact ? "text-[10px]" : "text-[11px]";

  return (
    <div
      className={`rounded-md px-1 py-0.5 ${
        inverted ? "bg-white/12 text-sand-50" : "bg-violet-50 text-night-900"
      } ${expanded ? "max-lg:landscape:px-0.5" : "px-1.5 py-1"}`}
    >
      {time && previewLines.length === 0 && !expanded ? (
        <p className={`font-semibold leading-tight ${compact ? "text-[10px]" : "text-xs"}`}>
          {time}
        </p>
      ) : null}
      {bodyLines.map((line, index) => (
        <p
          key={`${item.id}-${index}`}
          className={`leading-snug ${textSize} ${
            expanded
              ? "whitespace-pre-wrap break-words"
              : compact
                ? "line-clamp-2 break-normal"
                : "whitespace-pre-wrap break-words"
          } ${inverted ? "text-sand-50" : index === 0 ? "text-night-900" : "text-night-700"}`}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: CalendarViewMode;
  onChange: (mode: CalendarViewMode) => void;
}) {
  return (
    <div
      className="inline-flex rounded-xl bg-sand-100 p-1 ring-1 ring-night-900/5"
      role="tablist"
      aria-label="Calendar view"
    >
      {(
        [
          { id: "month" as const, label: "Month" },
          { id: "week" as const, label: "Week" },
        ] as const
      ).map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={mode === option.id}
          onClick={() => onChange(option.id)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            mode === option.id
              ? "bg-white text-night-900 shadow-sm"
              : "text-night-600 hover:text-night-900"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SelectedDayPanel<T extends CalendarPlannable>({
  selectedDate,
  selectedItems,
  emptyDayLabel,
  renderItem,
}: {
  selectedDate: string;
  selectedItems: T[];
  emptyDayLabel: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div className="mt-4 rounded-xl border border-night-900/10 bg-sand-50/80 p-4">
      <h4 className="font-display text-base font-semibold text-night-900">
        {formatSelectedDay(selectedDate)}
      </h4>
      {selectedItems.length === 0 ? (
        <p className="mt-2 text-sm text-night-500">{emptyDayLabel}</p>
      ) : (
        <div className="mt-3 space-y-3">{selectedItems.map((item) => renderItem(item))}</div>
      )}
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
            <span
              className={`text-[9px] font-semibold ${isSelected ? "text-sand-200" : "text-violet-700"}`}
            >
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
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [weekStart, setWeekStart] = useState(() => startOfWeekSunday(todayKey));
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey);

  const itemsByDate = useMemo(
    () => groupItemsByDate(items, monthCursor.year, monthCursor.month),
    [items, monthCursor.month, monthCursor.year],
  );

  const itemsByWeek = useMemo(
    () => groupItemsByWeek(items, weekStart),
    [items, weekStart],
  );

  const weekDays = useMemo(() => getIsoWeekDays(weekStart), [weekStart]);

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

  const selectedItems = useMemo(() => {
    if (!selectedDate) return [] as T[];
    if (viewMode === "week") {
      return (itemsByWeek.get(selectedDate) ?? []) as T[];
    }
    return (itemsByDate.get(selectedDate) ?? []) as T[];
  }, [itemsByDate, itemsByWeek, selectedDate, viewMode]);

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

  function goToToday() {
    const now = denverMonthCursor();
    setMonthCursor({ year: now.year, month: now.month });
    setWeekStart(startOfWeekSunday(now.dateKey));
    setSelectedDate(now.dateKey);
  }

  function goPrevious() {
    if (viewMode === "month") {
      setMonthCursor((current) => shiftMonth(current.year, current.month, -1));
      return;
    }
    setWeekStart((current) => shiftWeek(current, -1));
  }

  function goNext() {
    if (viewMode === "month") {
      setMonthCursor((current) => shiftMonth(current.year, current.month, 1));
      return;
    }
    setWeekStart((current) => shiftWeek(current, 1));
  }

  function changeViewMode(mode: CalendarViewMode) {
    if (mode === viewMode) return;
    const anchor = selectedDate ?? todayKey;
    if (mode === "week") {
      setWeekStart(startOfWeekSunday(anchor));
    } else {
      const [year, month] = anchor.split("-").map(Number);
      setMonthCursor({ year, month: month - 1 });
    }
    setViewMode(mode);
  }

  function renderDesktopDayColumn(
    isoDate: string,
    dayNumber: number,
    dayItems: CalendarPlannable[],
    weekColumn = false,
  ) {
    const isSelected = selectedDate === isoDate;
    const isToday = isoDate === todayKey;
    const maxVisible = weekColumn ? 6 : 4;

    return (
      <div
        key={isoDate}
        role="button"
        tabIndex={0}
        onClick={() => setSelectedDate(isoDate)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setSelectedDate(isoDate);
          }
        }}
        className={`flex ${
          weekColumn ? "min-h-[14rem]" : "h-[10rem]"
        } max-lg:landscape:h-auto max-lg:landscape:min-h-[7rem] max-lg:landscape:max-h-none flex-col overflow-hidden rounded-xl border p-1.5 text-left transition sm:p-2 ${
          isSelected
            ? "border-night-900 bg-night-900 text-sand-50 max-lg:landscape:ring-1 max-lg:landscape:ring-night-900"
            : "border-night-900/10 bg-white hover:bg-sand-50"
        }`}
      >
        <span
          className={`shrink-0 text-sm font-semibold ${
            isToday && !isSelected ? "text-amber-700" : ""
          }`}
        >
          {dayNumber}
        </span>
        <div className="mt-1 hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
          <div className="min-h-0 flex-1 space-y-1 overflow-hidden">
            {dayItems.slice(0, maxVisible).map((item) =>
              weekColumn ? (
                <EventText key={item.id} item={item} inverted={isSelected} compact />
              ) : (
                <EventText key={item.id} item={item} inverted={isSelected} grid />
              ),
            )}
            {dayItems.length > maxVisible ? (
              <p
                className={`text-[11px] font-semibold ${isSelected ? "text-sand-200" : "text-night-500"}`}
              >
                +{dayItems.length - maxVisible} more
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-0.5 min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain lg:hidden max-lg:landscape:block max-lg:portrait:hidden">
          {dayItems.length === 0 ? (
            <p className={`text-[10px] ${isSelected ? "text-sand-300" : "text-night-400"}`}>—</p>
          ) : (
            dayItems.map((item) => (
              <EventText key={item.id} item={item} inverted={isSelected} expanded />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="space-y-2">
            <ViewModeToggle mode={viewMode} onChange={changeViewMode} />
            <h3 className="font-display text-lg font-semibold text-night-900">
              {viewMode === "month"
                ? formatMonthLabel(monthCursor.year, monthCursor.month)
                : formatWeekLabel(weekStart)}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={goPrevious}>
              Previous
            </Button>
            <Button variant="secondary" onClick={goToToday}>
              Today
            </Button>
            <Button variant="secondary" onClick={goNext}>
              Next
            </Button>
          </div>
        </div>

        <div className="mt-4 hidden lg:block max-lg:landscape:block">
          <div className={viewMode === "month" ? "lg:min-w-[64rem] lg:overflow-x-auto" : ""}>
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-wide text-night-500">
              {WEEKDAY_HEADERS.map((label) => (
                <div key={label} className="py-2">
                  {label}
                </div>
              ))}
            </div>
            {viewMode === "month" ? (
              <div className="grid grid-cols-7 gap-1.5 max-lg:landscape:gap-1 max-lg:landscape:items-start">
                {cells.map((cell, index) => {
                  if (cell.day == null || !cell.isoDate) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="h-[10rem] max-lg:landscape:h-auto max-lg:landscape:min-h-[7rem] rounded-xl bg-sand-50/40"
                      />
                    );
                  }
                  return renderDesktopDayColumn(
                    cell.isoDate,
                    cell.day,
                    itemsByDate.get(cell.isoDate) ?? [],
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((isoDate) => {
                  const dayNumber = Number(isoDate.split("-")[2]);
                  return renderDesktopDayColumn(
                    isoDate,
                    dayNumber,
                    itemsByWeek.get(isoDate) ?? [],
                    true,
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 block max-lg:landscape:hidden lg:hidden">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-night-500">
            {WEEKDAY_HEADERS.map((label) => (
              <div key={label} className="py-1">
                {label.slice(0, 1)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {viewMode === "month"
              ? cells.map((cell, index) => {
                  if (cell.day == null || !cell.isoDate) {
                    return (
                      <div key={`empty-${index}`} className="h-11 rounded-lg bg-sand-50/40" />
                    );
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
                })
              : weekDays.map((isoDate) => {
                  const dayNumber = Number(isoDate.split("-")[2]);
                  const count = itemsByWeek.get(isoDate)?.length ?? 0;
                  const isSelected = selectedDate === isoDate;
                  const isToday = isoDate === todayKey;
                  return (
                    <MobileMonthDayCell
                      key={isoDate}
                      day={dayNumber}
                      isoDate={isoDate}
                      count={count}
                      isSelected={isSelected}
                      isToday={isToday}
                      onSelect={() => setSelectedDate(isoDate)}
                    />
                  );
                })}
          </div>

          {selectedDate ? (
            <SelectedDayPanel
              selectedDate={selectedDate}
              selectedItems={selectedItems}
              emptyDayLabel={emptyDayLabel}
              renderItem={renderItem}
            />
          ) : null}

          {viewMode === "week" ? (
            <div className="mt-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
                This week
              </p>
              {weekDays.map((isoDate) => {
                const dayItems = itemsByWeek.get(isoDate) ?? [];
                const isSelected = selectedDate === isoDate;
                return (
                  <section
                    key={isoDate}
                    className={`rounded-xl border px-3 py-3 ${
                      isSelected ? "border-teal-200 bg-teal-50/40" : "border-night-900/8 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDate(isoDate)}
                      className="mb-2 text-left"
                    >
                      <h4
                        className={`font-display text-base font-semibold ${
                          isSelected ? "text-teal-800" : "text-night-900"
                        }`}
                      >
                        {formatAgendaDayHeading(isoDate)}
                      </h4>
                    </button>
                    {isSelected ? (
                      <p className="text-xs text-night-500">Details shown above.</p>
                    ) : dayItems.length === 0 ? (
                      <p className="text-sm text-night-500">No events</p>
                    ) : (
                      <div className="space-y-2">
                        {dayItems.map((item) => (
                          <EventText key={item.id} item={item} compact />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
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
          )}
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
