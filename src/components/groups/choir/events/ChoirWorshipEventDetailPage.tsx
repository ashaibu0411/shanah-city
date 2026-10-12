"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EventRsvpPanel } from "@/components/calendar/EventRsvpPanel";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { choirWorshipEventsHref } from "@/lib/choir-events-links";
import type { ChoirWorshipEventDetailPayload } from "@/lib/choir-events-types";
import { parseEventTimeTo24, worshipEventCategoryLabel } from "@/lib/choir-events-utils";
import { buildIcsEventFile, downloadIcsFile } from "@/lib/calendar-ics-export";
import "../choir-premium.css";

type ChoirWorshipEventDetailPageProps = {
  groupId: string;
  eventId: string;
};

export function ChoirWorshipEventDetailPage({ groupId, eventId }: ChoirWorshipEventDetailPageProps) {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<ChoirWorshipEventDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamRole, setTeamRole] = useState("");
  const [teamNote, setTeamNote] = useState("");
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamMessage, setTeamMessage] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(
      `/api/groups/choir-events?groupId=${encodeURIComponent(groupId)}&view=detail&eventId=${encodeURIComponent(eventId)}`,
    )
      .then((response) => response.json())
      .then((detailData) => {
        if (!detailData.payload) {
          setError(detailData.error ?? "Event not found.");
          setPayload(null);
        } else {
          setPayload(detailData.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load event.");
        setLoading(false);
      });
  }, [groupId, eventId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitTeamInterest() {
    if (!payload) return;
    setTeamBusy(true);
    setTeamMessage(null);
    const response = await fetch("/api/groups/choir-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "team_interest",
        groupId,
        eventId,
        preferredRole: teamRole.trim() || null,
        note: teamNote.trim() || null,
      }),
    });
    const data = await response.json();
    setTeamBusy(false);
    if (!response.ok) {
      setTeamMessage(data.error ?? "Could not submit request.");
      return;
    }
    setTeamMessage("Your interest was submitted for leadership review.");
    load();
  }

  async function shareEvent() {
    if (!payload) return;
    const url = payload.shareUrl;
    if (navigator.share) {
      try {
        await navigator.share({ title: payload.event.title, url });
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareMessage("Link copied.");
    } catch {
      setShareMessage("Could not copy link.");
    }
  }

  function addToCalendar() {
    if (!payload) return;
    const time24 = parseEventTimeTo24(payload.event.timeLabel);
    const ics = buildIcsEventFile({
      uid: payload.event.id,
      title: payload.event.title,
      dateKey: payload.event.dateKey,
      time24,
      location: payload.event.location,
      description: payload.description,
    });
    downloadIcsFile(`${payload.event.title.replace(/\s+/g, "-")}.ics`, ics);
  }

  if (loading) {
    return (
      <div className="choir-group-home choir-worship-events-page px-4 py-3">
        <p className="text-sm text-[var(--choir-muted)]">Loading event…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="choir-group-home choir-worship-events-page px-4 py-3">
        <p className="text-sm text-red-700">{error ?? "Event not found."}</p>
        <Link href={choirWorshipEventsHref(groupId)} className="choir-setlist-manage-link mt-3 inline-block">
          Back to worship events
        </Link>
      </div>
    );
  }

  const showRegister = searchParams.get("register") === "1" || payload.canRegister;

  return (
    <div className="choir-group-home choir-worship-events-page choir-page-shell space-y-[18px] pb-10">
      <ChoirSetlistHeader groupId={groupId} chatHref={`/groups/${encodeURIComponent(groupId)}?chat=1`} />

      <Link href={choirWorshipEventsHref(groupId)} className="text-sm font-semibold text-[var(--choir-gold-dark)]">
        ← Worship events
      </Link>

      <div className="choir-we-detail-hero">
        <Image src={payload.event.imageUrl} alt="" fill className="object-cover" sizes="100vw" priority />
        <div className="choir-we-detail-gradient" />
        <div className="choir-we-detail-hero-copy">
          <p className="choir-we-detail-kicker">{worshipEventCategoryLabel(payload.event.category)}</p>
          <h1 className="choir-we-detail-title">{payload.event.title}</h1>
          <p className="choir-we-detail-meta">
            {payload.event.timeLabel} · {payload.event.location}
          </p>
        </div>
      </div>

      <section className="choir-card space-y-3 p-4">
        <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">About the event</h2>
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--choir-body)]">{payload.description}</p>
      </section>

      <section className="choir-card space-y-2 p-4 text-sm text-[var(--choir-body)]">
        <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Event information</h2>
        <p>
          <span className="font-semibold">Organizer:</span> {payload.organizerLabel}
        </p>
        <p>
          <span className="font-semibold">Audience:</span> {payload.event.audienceLabel}
        </p>
        {payload.deadlineLabel ? (
          <p>
            <span className="font-semibold">Registration deadline:</span> {payload.deadlineLabel}
          </p>
        ) : null}
        {payload.capacityLabel ? (
          <p>
            <span className="font-semibold">Capacity:</span> {payload.capacityLabel}
          </p>
        ) : null}
        {payload.rsvpInstructions ? (
          <p className="whitespace-pre-wrap">
            <span className="font-semibold">Instructions:</span> {payload.rsvpInstructions}
          </p>
        ) : null}
      </section>

      {payload.rsvpEvent && (showRegister || payload.event.rsvpEnabled) ? (
        <section className="choir-card p-4">
          <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Registration</h2>
          <EventRsvpPanel event={payload.rsvpEvent} canManage={payload.canManageRsvp} onRsvpChanged={load} />
        </section>
      ) : null}

      {payload.teamVolunteerOpen ? (
        <section className="choir-card space-y-3 p-4">
          <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Join event team</h2>
          <p className="text-sm text-[var(--choir-muted)]">
            Express interest to serve at this event. Leadership will review before any assignment is confirmed.
          </p>
          {payload.myTeamStatus ? (
            <p className="text-sm font-semibold text-[var(--choir-gold-dark)]">
              Status: {payload.myTeamStatus.replace(/_/g, " ")}
            </p>
          ) : (
            <>
              <input
                type="text"
                value={teamRole}
                onChange={(event) => setTeamRole(event.target.value)}
                placeholder="Preferred role (optional)"
                className="choir-input w-full"
              />
              <textarea
                value={teamNote}
                onChange={(event) => setTeamNote(event.target.value)}
                placeholder="Note for leadership (optional)"
                className="choir-input min-h-[88px] w-full"
              />
              <button
                type="button"
                className="choir-btn-primary min-h-[44px] w-full"
                disabled={teamBusy}
                onClick={() => void submitTeamInterest()}
              >
                {teamBusy ? "Submitting…" : "Submit interest"}
              </button>
            </>
          )}
          {teamMessage ? <p className="text-sm text-[var(--choir-body)]">{teamMessage}</p> : null}
        </section>
      ) : null}

      {(payload.recapSummary || payload.recapPhotoUrls.length > 0 || payload.recapVideoUrls.length > 0) && (
        <section className="choir-card space-y-3 p-4">
          <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Event recap</h2>
          {payload.recapSummary ? (
            <p className="text-sm whitespace-pre-wrap text-[var(--choir-body)]">{payload.recapSummary}</p>
          ) : null}
          {payload.recapPhotoUrls.length > 0 ? (
            <ul className="grid grid-cols-2 gap-2">
              {payload.recapPhotoUrls.map((url) => (
                <li key={url} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image src={url} alt="" fill className="object-cover" sizes="50vw" />
                </li>
              ))}
            </ul>
          ) : null}
          {payload.recapVideoUrls.map((url) => (
            <a key={url} href={url} className="choir-btn-secondary block min-h-[44px] text-center leading-[44px]" target="_blank" rel="noreferrer">
              Watch video
            </a>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        {payload.setlistHref ? (
          <Link href={payload.setlistHref} className="choir-btn-secondary min-h-[44px] text-center leading-[44px]">
            View setlist
          </Link>
        ) : null}
        {payload.rehearsalHref ? (
          <Link href={payload.rehearsalHref} className="choir-btn-secondary min-h-[44px] text-center leading-[44px]">
            Open rehearsal room
          </Link>
        ) : null}
        {payload.worshipPlanHref ? (
          <Link href={payload.worshipPlanHref} className="choir-setlist-manage-link text-center">
            Worship planner →
          </Link>
        ) : null}
        <button type="button" className="choir-btn-secondary min-h-[44px]" onClick={addToCalendar}>
          Add to calendar
        </button>
        <button type="button" className="choir-btn-secondary min-h-[44px]" onClick={() => void shareEvent()}>
          Share event
        </button>
        {shareMessage ? <p className="text-center text-xs text-[var(--choir-muted)]">{shareMessage}</p> : null}
      </section>
    </div>
  );
}
