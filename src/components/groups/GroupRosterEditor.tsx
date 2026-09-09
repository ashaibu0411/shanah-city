"use client";

import { useEffect, useState } from "react";
import { premiumTabPill } from "@/components/app/mobile-premium";
import { GroupPremiumSectionLabel, GroupPremiumStackCard } from "@/components/groups/GroupPremiumUI";
import { groupsPremium } from "@/components/groups/groups-premium";
import { Button } from "@/components/ui";
import {
  DEFAULT_ROSTER_SERVICE_TIME,
  nextServiceSundayIso,
  rosterServiceDateTimeLabel,
  rosterServiceTimes,
  type GroupRosterSlot,
  type GroupServiceRoster,
} from "@/lib/group-roster-types";

type RosterMember = { id: string; name: string };

type GroupRosterEditorProps = {
  groupId: string;
  canManage: boolean;
  initialDate?: string;
  initialTime?: string;
  onUpdated?: () => void;
};

export function GroupRosterEditor({
  groupId,
  canManage,
  initialDate,
  initialTime,
  onUpdated,
}: GroupRosterEditorProps) {
  const [serviceDate, setServiceDate] = useState(initialDate || nextServiceSundayIso());
  const [serviceTime, setServiceTime] = useState(initialTime || DEFAULT_ROSTER_SERVICE_TIME);
  const [assignments, setAssignments] = useState<GroupRosterSlot[]>([]);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("Sunday Service");
  const [status, setStatus] = useState<GroupServiceRoster["status"]>("draft");
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadRoster() {
    setLoading(true);
    const response = await fetch(
      `/api/groups/roster?groupId=${encodeURIComponent(groupId)}&serviceDate=${encodeURIComponent(serviceDate)}&serviceTime=${encodeURIComponent(serviceTime)}`,
    );
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not load service roster.");
      return;
    }

    if (data.roster) {
      setAssignments(data.roster.assignments ?? []);
      setNotes(data.roster.notes ?? "");
      setTitle(data.roster.title?.trim() || "Sunday Service");
      setStatus(data.roster.status);
    } else {
      setAssignments(data.defaultAssignments ?? []);
      setNotes("");
      setTitle("Sunday Service");
      setStatus("draft");
    }
    setMessage(null);
  }

  async function loadTemplate() {
    if (!canManage) return;
    const response = await fetch(
      `/api/groups/roster?groupId=${encodeURIComponent(groupId)}&template=1`,
    );
    const data = await response.json();
    if (response.ok) {
      setMembers(data.members ?? []);
    }
  }

  useEffect(() => {
    loadTemplate();
    loadRoster();
  }, []);

  useEffect(() => {
    loadRoster();
  }, [serviceDate, serviceTime]);

  function updateSlot(index: number, patch: Partial<GroupRosterSlot>) {
    setAssignments((current) =>
      current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...patch } : slot)),
    );
  }

  function addRole() {
    setAssignments((current) => [...current, { roleLabel: "New role", userId: null, name: "" }]);
  }

  function removeRole(index: number) {
    setAssignments((current) => current.filter((_, slotIndex) => slotIndex !== index));
  }

  async function saveRoster(action: "save" | "publish" | "unpublish" | "delete") {
    setMessage(null);
    const response = await fetch("/api/groups/roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        groupId,
        serviceDate,
        serviceTime,
        title,
        notes,
        assignments,
      }),
    });
    const data = await response.json();

    if (response.ok) {
      if (action === "delete") setMessage("Roster deleted.");
      else if (action === "publish") setMessage("Roster published for the team.");
      else if (action === "unpublish") setMessage("Roster moved back to draft.");
      else setMessage("Roster saved.");
      await loadRoster();
      onUpdated?.();
      return;
    }

    setMessage(data.error ?? "Could not save roster.");
  }

  async function copyFromPrevious() {
    setCopying(true);
    setMessage(null);
    const response = await fetch("/api/groups/roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "copy_from_previous",
        groupId,
        serviceDate,
        serviceTime,
      }),
    });
    const data = await response.json();
    setCopying(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not copy previous roster.");
      return;
    }

    setMessage(`Copied from ${data.copiedFrom ?? "previous service"}.`);
    await loadRoster();
    onUpdated?.();
  }

  if (!canManage) {
    return null;
  }

  return (
    <div id="group-roster-editor" className="scroll-mt-24">
      <GroupPremiumSectionLabel className="mb-2 px-0.5">Manage service roster</GroupPremiumSectionLabel>
      <GroupPremiumStackCard>
        <p className={groupsPremium.cardMeta}>
          Assign roles for each service — media, ushering, and ministry teams can customize role names
          like Mac Mini, Camera, or Greeter.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold text-night-800">Service date</span>
            <input
              type="date"
              value={serviceDate}
              onChange={(event) => setServiceDate(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-night-800">Service time</span>
            <select
              value={serviceTime}
              onChange={(event) => setServiceTime(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            >
              {rosterServiceTimes().map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-3 block text-sm">
          <span className="font-semibold text-night-800">Service title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
        </label>

        <p className={`${groupsPremium.cardMeta} mt-3`}>
          {loading ? "Loading roster…" : rosterServiceDateTimeLabel(serviceDate, serviceTime)}
          {status === "published" ? " · Published" : " · Draft"}
        </p>

        <div className="mt-4 space-y-2">
          {assignments.map((slot, index) => (
            <div key={`${slot.roleLabel}-${index}`} className={`${groupsPremium.rowInset} flex-wrap gap-2`}>
              <input
                value={slot.roleLabel}
                onChange={(event) => updateSlot(index, { roleLabel: event.target.value })}
                className="min-w-[7rem] flex-1 rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm font-semibold text-night-900 outline-none"
                placeholder="Role"
              />
              <select
                value={slot.userId ?? ""}
                onChange={(event) => {
                  const member = members.find((entry) => entry.id === event.target.value);
                  updateSlot(index, {
                    userId: event.target.value || null,
                    name: member?.name ?? "",
                  });
                }}
                className="min-w-[10rem] flex-[1.4] rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeRole(index)}
                className="text-xs font-semibold text-red-700 underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={addRole} className={premiumTabPill(false)}>
            Add role
          </button>
          <button
            type="button"
            disabled={copying}
            onClick={copyFromPrevious}
            className={premiumTabPill(false)}
          >
            {copying ? "Copying…" : "Copy previous"}
          </button>
        </div>

        <label className="mt-4 block text-sm">
          <span className="font-semibold text-night-800">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-2xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => saveRoster("save")}>Save draft</Button>
          {status === "published" ? (
            <Button variant="secondary" onClick={() => saveRoster("unpublish")}>
              Unpublish
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => saveRoster("publish")}>
              Publish for team
            </Button>
          )}
          <Button variant="secondary" onClick={() => saveRoster("delete")}>
            Delete
          </Button>
        </div>

        {message ? <p className="mt-3 text-sm text-night-700">{message}</p> : null}
      </GroupPremiumStackCard>
    </div>
  );
}
