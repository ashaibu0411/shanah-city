"use client";

import { GuestCareProfile } from "@/components/frontliners/GuestCareProfile";
import { GuestReturnVisit } from "@/components/frontliners/GuestReturnVisit";
import { FollowUpReports } from "@/components/frontliners/FollowUpReports";
import { FollowUpSundayChecklist } from "@/components/frontliners/FollowUpSundayChecklist";
import { FollowUpJourney } from "@/components/frontliners/FollowUpJourney";
import { FollowUpAssignments } from "@/components/frontliners/FollowUpAssignments";
import { GuestContactHistory } from "@/components/frontliners/GuestContactHistory";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import {
  guestStatusLabel,
  serviceTimeLabel,
  type GuestSubmission,
  type GuestSubmissionStatus,
} from "@/lib/frontliners-types";

type GuestQueuePanelProps = {
  variant?: "admin" | "follow-up";
  compactHeader?: boolean;
};

export function GuestQueuePanel({
  variant = "admin",
  compactHeader = false,
}: GuestQueuePanelProps) {
  const { permissions } = useAuth();
  const [guests, setGuests] = useState<GuestSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<GuestSubmissionStatus | "all">("new");
  const [search, setSearch] = useState("");
  const [expandedGuestId, setExpandedGuestId] = useState<string | null>(null);
  const [showTeam, setShowTeam] = useState(true);
  const [showJourney, setShowJourney] = useState(false);
  const [showSunday, setShowSunday] = useState(false);
  const [showReports, setShowReports] = useState(false);

  const isFollowUp = variant === "follow-up";
  const canManage = isFollowUp ? permissions.canAccessFollowUp : permissions.canManageGuestSubmissions;
  const canChangeStatus = permissions.canManageGuestSubmissions;

  async function loadGuests() {
    setLoading(true);
    const response = await fetch("/api/guests");
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      setGuests(data.guests ?? []);
    }
  }

  useEffect(() => {
    if (canManage) {
      loadGuests();
    }
  }, [canManage]);

  async function updateStatus(id: string, status: GuestSubmissionStatus) {
    if (!canChangeStatus) return;
    const response = await fetch("/api/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await response.json();
    if (response.ok) {
      setGuests((current) => current.map((guest) => (guest.id === id ? data.guest : guest)));
      setMessage(`Marked as ${guestStatusLabel(status).toLowerCase()}.`);
    }
  }

  if (!canManage) {
    return (
      <Card>
        <p className="text-sm text-night-600">
          Guest follow-up is managed by the Follow-Up Ministry and Admin Group.
        </p>
      </Card>
    );
  }

  const filtered = guests.filter(g => (filter === "all" || g.status === filter) && (g.name + " " + (g.email ?? "") + " " + (g.phone ?? "")).toLowerCase().includes(search.toLowerCase().trim()));
  const newCount = guests.filter((guest) => guest.status === "new").length;
  const overdueCount = guests.filter((guest) => guest.status === "new" && Date.now() - new Date(guest.submittedAt).getTime() > 172800000).length;

  return (
    <div className="space-y-6">
      {!compactHeader ? (
        <Card className="overflow-hidden p-0 ring-1 ring-night-900/10">
          <div
            className={
              isFollowUp
                ? "bg-gradient-to-br from-clay-700 via-clay-800 to-night-900 px-6 py-5 text-white"
                : "bg-gradient-to-br from-emerald-700 to-teal-900 px-6 py-5 text-white"
            }
          >
            <p
              className={
                isFollowUp
                  ? "text-xs font-semibold uppercase tracking-[0.2em] text-clay-200"
                  : "text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200"
              }
            >
              {isFollowUp ? "Follow-Up Ministry · Guest care" : "Admin · Guest follow-up"}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">Guest queue</h2>
            <p
              className={
                isFollowUp ? "mt-2 text-sm text-clay-100/90" : "mt-2 text-sm text-emerald-100/90"
              }
            >
              Visitors submit at{" "}
              <a href="/guest" className="font-semibold underline" target="_blank" rel="noreferrer">
                /guest
              </a>{" "}
              — contact new guests within 48 hours, then mark contacted or archive.
            </p>
            {newCount > 0 ? (
              <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
                {newCount} new guest{newCount === 1 ? "" : "s"} waiting
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {isFollowUp && <div className="grid grid-cols-3 gap-2">
        {[{label:"To contact",value:newCount},{label:"Overdue",value:overdueCount},{label:"Contacted",value:guests.filter(g=>g.status==="contacted").length}].map(item=><div key={item.label} className="rounded-xl bg-white p-3 text-center ring-1 ring-night-900/10"><p className="text-2xl font-bold text-night-900">{item.value}</p><p className="text-xs text-night-600">{item.label}</p></div>)}
      </div>}
      {isFollowUp && <div className="space-y-2"><button type="button" aria-expanded={showTeam} onClick={()=>setShowTeam(!showTeam)} className="min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-left font-semibold text-night-900">Team assignments & tasks {showTeam ? "−" : "+"}</button>{showTeam && !loading && <FollowUpAssignments guests={guests} onChanged={()=>void loadGuests()} />}</div>}
      {isFollowUp && <div className="space-y-2"><button type="button" aria-expanded={showJourney} onClick={()=>setShowJourney(!showJourney)} className="min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-left font-semibold text-night-900">Guest journey & scheduled callbacks {showJourney ? "−" : "+"}</button>{showJourney && !loading && <FollowUpJourney guests={guests} />}</div>}
      {isFollowUp && <div className="space-y-2"><button type="button" aria-expanded={showSunday} onClick={()=>setShowSunday(!showSunday)} className="min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-left font-semibold text-night-900">Sunday guest care checklist {showSunday ? "−" : "+"}</button>{showSunday && <FollowUpSundayChecklist />}</div>}
      {isFollowUp && permissions.canManageFollowUp && <div className="space-y-2"><button type="button" aria-expanded={showReports} onClick={()=>setShowReports(!showReports)} className="min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-left font-semibold text-night-900">Guest growth & retention report {showReports ? "−" : "+"}</button>{showReports && <FollowUpReports />}</div>}
      <input aria-label="Search guests" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search guests" className="min-h-12 w-full rounded-xl border bg-white px-4 text-base text-night-900" />
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "new", label: "New" },
            { id: "contacted", label: "Contacted" },
            { id: "archived", label: "Archived" },
            { id: "all", label: "All" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === item.id
                ? "bg-night-900 text-sand-50"
                : "bg-white text-night-600 ring-1 ring-night-900/10 hover:bg-sand-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-night-500">Loading guest submissions…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-night-600">No guest submissions in this view yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((guest) => (
            <Card key={guest.id} className="overflow-hidden p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold text-night-900">{guest.name}</p>
                  <p className="mt-1 text-sm text-night-600">
                    {guest.isFirstVisit ? "First visit" : "Returning guest"}
                    {guest.visitDate ? ` · ${guest.visitDate}` : ""}
                    {guest.serviceTime ? ` · ${serviceTimeLabel(guest.serviceTime)}` : ""}
                  </p>
                  {guest.status === "new" && Date.now() - new Date(guest.submittedAt).getTime() > 172800000 && <p className="mt-2 text-sm font-semibold text-red-700">Follow-up overdue · more than 48 hours</p>}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    guest.status === "new"
                      ? "bg-amber-100 text-amber-800"
                      : guest.status === "contacted"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-sand-100 text-night-600"
                  }`}
                >
                  {guestStatusLabel(guest.status)}
                </span>
              </div>

              {isFollowUp && <button type="button" aria-expanded={expandedGuestId === guest.id} onClick={() => setExpandedGuestId(expandedGuestId === guest.id ? null : guest.id)} className="mt-4 min-h-12 w-full rounded-xl bg-night-900 px-4 py-3 text-left text-sm font-semibold text-white">{expandedGuestId === guest.id ? "Close guest details −" : "Open guest & record follow-up +"}</button>}
              {(!isFollowUp || expandedGuestId === guest.id) && <div className="mt-4 space-y-3 border-t border-night-900/10 pt-4">
                <div className="flex flex-wrap gap-2">
                  {guest.phone && <a href={"tel:" + guest.phone} className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white">Call</a>}
                  {guest.phone && <a href={"sms:" + guest.phone} className="inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold text-night-900">Text</a>}
                  {guest.email && <a href={"mailto:" + guest.email} className="inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold text-night-900">Email</a>}
                </div>
                {guest.notes && <p className="whitespace-pre-wrap rounded-lg bg-sand-100 p-3 text-sm text-night-700">{guest.notes}</p>}
                <p className="text-xs text-night-600">Submitted {new Date(guest.submittedAt).toLocaleString()}</p>
                {isFollowUp && <GuestCareProfile guestId={guest.id} isLeader={permissions.canManageFollowUp} />}
                {isFollowUp && <GuestReturnVisit guestId={guest.id} />}
                {isFollowUp && <GuestContactHistory guestId={guest.id} onConnected={() => void loadGuests()} />}
              <div className="flex flex-wrap gap-2">
                {!isFollowUp && guest.status !== "contacted" && (
                  <Button variant="secondary" onClick={() => updateStatus(guest.id, "contacted")}>
                    Mark contacted
                  </Button>
                )}
                {permissions.canManageAdmin && guest.status !== "archived" && (
                  <Button variant="secondary" onClick={() => updateStatus(guest.id, "archived")}>
                    Archive
                  </Button>
                )}
                {permissions.canManageAdmin && guest.status !== "new" && (
                  <Button variant="secondary" onClick={() => updateStatus(guest.id, "new")}>
                    Move back to new
                  </Button>
                )}
              </div>
              </div>}
            </Card>
          ))}
        </div>
      )}

      {message && (
        <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">{message}</p>
      )}
    </div>
  );
}
