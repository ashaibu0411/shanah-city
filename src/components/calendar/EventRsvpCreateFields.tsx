"use client";

import type { EventRsvpAudience } from "@/lib/event-rsvp-types";
import {
  localDateTimeInputToIso,
  toLocalDeadlineInputValue,
} from "@/lib/event-rsvp-utils";

export type EventRsvpFormState = {
  rsvpEnabled: boolean;
  rsvpAudience: EventRsvpAudience;
  rsvpDeadline: string;
  rsvpCapacity: string;
  rsvpInstructions: string;
};

export function defaultEventRsvpFormState(
  audience: EventRsvpAudience = "church",
): EventRsvpFormState {
  return {
    rsvpEnabled: false,
    rsvpAudience: audience,
    rsvpDeadline: "",
    rsvpCapacity: "",
    rsvpInstructions: "",
  };
}

export function eventRsvpFormToPayload(state: EventRsvpFormState) {
  return {
    rsvpEnabled: state.rsvpEnabled,
    rsvpAudience: state.rsvpAudience,
    rsvpDeadline: state.rsvpDeadline
      ? localDateTimeInputToIso(state.rsvpDeadline)
      : null,
    rsvpCapacity: state.rsvpCapacity.trim() ? Number(state.rsvpCapacity) : null,
    rsvpInstructions: state.rsvpInstructions.trim() || null,
  };
}

type EventRsvpCreateFieldsProps = {
  state: EventRsvpFormState;
  onChange: (state: EventRsvpFormState) => void;
  defaultAudience?: EventRsvpAudience;
  compact?: boolean;
};

export function EventRsvpCreateFields({
  state,
  onChange,
  defaultAudience = "church",
  compact = false,
}: EventRsvpCreateFieldsProps) {
  const audience = state.rsvpAudience || defaultAudience;

  return (
    <div
      className={`rounded-2xl border border-teal-200 bg-teal-50/70 ${
        compact ? "p-3.5 sm:col-span-2" : "p-4 sm:col-span-2"
      }`}
    >
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={state.rsvpEnabled}
          onChange={(event) =>
            onChange({
              ...state,
              rsvpEnabled: event.target.checked,
              rsvpAudience: audience,
            })
          }
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-semibold text-night-900">Require RSVP</span>
          <span className="mt-1 block text-xs text-night-600">
            For major or team events only. Members can tap Going, Maybe, or Can&apos;t go.
          </span>
        </span>
      </label>

      {state.rsvpEnabled ? (
        <div className="mt-4 grid gap-3">
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide text-night-500">
              Who should respond?
            </legend>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-night-800">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rsvp-audience"
                  checked={audience === "church"}
                  onChange={() => onChange({ ...state, rsvpAudience: "church" })}
                />
                All signed-in members
              </label>
              {defaultAudience === "group" ? (
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rsvp-audience"
                    checked={audience === "group"}
                    onChange={() => onChange({ ...state, rsvpAudience: "group" })}
                  />
                  This group only
                </label>
              ) : null}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-semibold text-night-800">RSVP deadline (optional)</span>
            <input
              type="datetime-local"
              value={state.rsvpDeadline}
              onChange={(event) => onChange({ ...state, rsvpDeadline: event.target.value })}
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-night-800">Capacity (optional)</span>
            <input
              type="number"
              min={1}
              value={state.rsvpCapacity}
              onChange={(event) => onChange({ ...state, rsvpCapacity: event.target.value })}
              placeholder="e.g. 20"
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-night-800">Instructions (optional)</span>
            <textarea
              value={state.rsvpInstructions}
              onChange={(event) => onChange({ ...state, rsvpInstructions: event.target.value })}
              rows={2}
              placeholder="Meet at the south entrance at 5:45."
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

export function eventToRsvpFormState(
  event: {
    rsvpEnabled?: boolean;
    rsvpAudience?: EventRsvpAudience | null;
    rsvpDeadline?: string | null;
    rsvpCapacity?: number | null;
    rsvpInstructions?: string | null;
    groupId?: string | null;
  },
): EventRsvpFormState {
  return {
    rsvpEnabled: Boolean(event.rsvpEnabled),
    rsvpAudience: event.rsvpAudience ?? (event.groupId ? "group" : "church"),
    rsvpDeadline: toLocalDeadlineInputValue(event.rsvpDeadline),
    rsvpCapacity: event.rsvpCapacity ? String(event.rsvpCapacity) : "",
    rsvpInstructions: event.rsvpInstructions ?? "",
  };
}
