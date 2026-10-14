"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { SetlistSongThumbnail } from "@/components/groups/choir/setlist/SetlistSongThumbnail";
import { WorshipAudioPlayer } from "@/components/worship/WorshipAudioPlayer";
import { CHOIR_HERO_IMAGE_PATH } from "@/lib/choir-group-constants";
import type { ChoirRehearsalPagePayload } from "@/lib/choir-rehearsal-types";
import type { ChoirSetlistServiceSummary } from "@/lib/choir-setlist-types";
import { worshipPlannerPath } from "@/lib/worship-plan-links";
import {
  countSongsPrepared,
  listPracticeTracksForPart,
  normalizeSongs,
  visiblePracticeStemsForUser,
  worshipPracticeStemLabel,
  type WorshipServicePlan,
  type WorshipSong,
} from "@/lib/worship-types";
import { RehearsalSegmentTabs, type RehearsalTabId } from "./RehearsalSegmentTabs";
import { RehearsalPartRecordingPanel } from "./RehearsalPartRecordingPanel";
import { RehearsalSongPracticeSheet } from "./RehearsalSongPracticeSheet";
import {
  hasApprovedPracticeAudio,
  parseRehearsalNoteBullets,
  songPrepLabel,
  songPrepStatus,
  vocalStemsForSong,
} from "./rehearsal-utils";
import "../choir-premium.css";

type ChoirRehearsalRoomPageProps = {
  groupId: string;
};

export function ChoirRehearsalRoomPage({ groupId }: ChoirRehearsalRoomPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const initialTab = (searchParams.get("tab") as RehearsalTabId) || "room";
  const [tab, setTab] = useState<RehearsalTabId>(
    initialTab === "audio" || initialTab === "parts" || initialTab === "notes" ? initialTab : "room",
  );

  const [payload, setPayload] = useState<ChoirRehearsalPagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [plan, setPlan] = useState<WorshipServicePlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [detailSong, setDetailSong] = useState<{
    song: WorshipSong;
    position: number;
    focusListen?: boolean;
    focusRecord?: boolean;
  } | null>(null);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);

  const loadPayload = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-rehearsal?groupId=${encodeURIComponent(groupId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.payload) {
          setError(data.error ?? "Could not load rehearsal room.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load rehearsal room.");
        setLoading(false);
      });
  }, [groupId]);

  useEffect(() => {
    loadPayload();
  }, [loadPayload]);

  const services = payload?.services ?? [];

  useEffect(() => {
    if (!services.length) return;
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const serviceId = searchParams.get("serviceId");
    let key = serviceId?.trim() || searchParams.get("service")?.trim();
    if (!key && date && time) {
      key = `${date}|${time}`;
    }
    if (!key || !services.some((entry) => entry.planKey === key)) {
      key = services.find((entry) => entry.status === "published")?.planKey ?? services[0].planKey;
    }
    setSelectedKey(key);
  }, [services, searchParams]);

  const selectedService = useMemo(
    () => services.find((entry) => entry.planKey === selectedKey) ?? services[0] ?? null,
    [services, selectedKey],
  );

  const loadPlan = useCallback(() => {
    if (!selectedService) {
      setPlan(null);
      return;
    }
    setPlanLoading(true);
    const params = new URLSearchParams({
      serviceDate: selectedService.serviceDate,
      serviceTime: String(selectedService.serviceTime),
    });
    fetch(`/api/worship?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        setPlan(data.plan ?? null);
        setPlanLoading(false);
      })
      .catch(() => {
        setPlan(null);
        setPlanLoading(false);
      });
  }, [selectedService]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const songs = useMemo(() => (plan ? normalizeSongs(plan.songs) : []), [plan]);

  useEffect(() => {
    const songParam = searchParams.get("song")?.trim();
    if (songParam && songs.some((song) => song.id === songParam)) {
      setActiveSongId(songParam);
    } else if (songs.length && !activeSongId) {
      setActiveSongId(songs[0].id);
    }
  }, [songs, searchParams, activeSongId]);

  const activeSong = useMemo(
    () => songs.find((song) => song.id === activeSongId) ?? songs[0] ?? null,
    [songs, activeSongId],
  );

  const activePosition = useMemo(() => {
    if (!activeSong) return 0;
    return songs.findIndex((song) => song.id === activeSong.id) + 1;
  }, [songs, activeSong]);

  function selectService(planKey: string) {
    setSelectedKey(planKey);
    setServicePickerOpen(false);
    const service = services.find((entry) => entry.planKey === planKey);
    if (!service) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", service.serviceDate);
    params.set("time", String(service.serviceTime));
    params.set("serviceId", planKey);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function changeTab(next: RehearsalTabId) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function selectSong(songId: string) {
    setActiveSongId(songId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("song", songId);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  async function toggleSongPrepared(songId: string, prepared: boolean) {
    if (!selectedService) return;
    const response = await fetch("/api/worship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_song",
        serviceDate: selectedService.serviceDate,
        serviceTime: selectedService.serviceTime,
        songId,
        prepared,
      }),
    });
    const data = await response.json();
    if (response.ok && data.plan) {
      setPlan(data.plan);
      setDetailSong((current) => {
        if (!current) return current;
        const updated = normalizeSongs(data.plan.songs).find((entry) => entry.id === current.song.id);
        return updated ? { ...current, song: updated } : current;
      });
    }
  }

  function openReferenceAudio(song: WorshipSong) {
    const idx = songs.findIndex((entry) => entry.id === song.id);
    setDetailSong({
      song,
      position: idx >= 0 ? idx + 1 : 1,
      focusListen: true,
      focusRecord: false,
    });
  }

  function openRecordPart(song: WorshipSong) {
    const idx = songs.findIndex((entry) => entry.id === song.id);
    setDetailSong({
      song,
      position: idx >= 0 ? idx + 1 : 1,
      focusListen: false,
      focusRecord: true,
    });
  }

  const userId = user?.id;
  const canManage = payload?.canManage ?? false;
  const rosterPartRole = useMemo(() => {
    if (plan && userId) {
      const member = plan.team.find((entry) => entry.userId === userId);
      if (member?.partRole?.trim()) return member.partRole.trim();
    }
    return payload?.memberPartRole?.trim() || null;
  }, [plan, userId, payload?.memberPartRole]);
  const partRole = rosterPartRole || "full";

  function applyUpdatedSong(updatedSong: WorshipSong) {
    const normalized = normalizeSongs([updatedSong])[0] ?? updatedSong;
    setPlan((current) => {
      if (!current) return current;
      return {
        ...current,
        songs: current.songs.map((entry) => (entry.id === normalized.id ? normalized : entry)),
      };
    });
    setDetailSong((current) =>
      current && current.song.id === normalized.id ? { ...current, song: normalized } : current,
    );
  }

  const preparedCount = userId ? countSongsPrepared(userId, songs) : 0;
  const totalSongs = songs.length;
  const progressPct = totalSongs > 0 ? Math.round((preparedCount / totalSongs) * 100) : 0;

  const activeTracks = useMemo(() => {
    if (!activeSong) return [];
    return listPracticeTracksForPart(activeSong, partRole, { userId, isManager: canManage });
  }, [activeSong, partRole, userId, canManage]);

  const activeStem = activeTracks[0] ?? null;

  const noteBullets = plan?.rehearsalNotes?.trim() ? parseRehearsalNoteBullets(plan.rehearsalNotes.trim()) : [];
  const serviceTitle = selectedService?.title ?? "Sunday Service";
  const isPublished = plan?.status === "published";

  if (loading) {
    return (
      <div className="choir-group-home choir-rehearsal-page px-4 py-3">
        <p className="text-sm text-[var(--choir-muted)]">Loading rehearsal room…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="choir-group-home choir-rehearsal-page px-4 py-3">
        <p className="text-sm text-red-700">{error ?? "Unavailable."}</p>
        <button type="button" className="choir-setlist-manage-link mt-3" onClick={loadPayload}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="choir-group-home choir-rehearsal-page choir-page-shell space-y-[18px] pb-8">
      <ChoirSetlistHeader groupId={groupId} chatHref={payload.groupChatHref} />

      <div className="px-0">
        <h1 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Rehearsal Room</h1>
        <p className="mt-1 text-sm font-medium text-[var(--choir-muted)]">Practice your part. Prepare your heart.</p>
      </div>

      <RehearsalSegmentTabs active={tab} onChange={changeTab} />

      {tab === "room" ? (
        <RehearsalRoomTabContent
          groupId={groupId}
          services={services}
          selectedService={selectedService}
          servicePickerOpen={servicePickerOpen}
          onToggleServicePicker={() => setServicePickerOpen((open) => !open)}
          onSelectService={selectService}
          planLoading={planLoading}
          isPublished={isPublished}
          serviceTitle={serviceTitle}
          preparedCount={preparedCount}
          totalSongs={totalSongs}
          progressPct={progressPct}
          memberRoleLabel={payload.memberRoleLabel}
          activeSong={activeSong}
          activePosition={activePosition}
          activeStem={activeStem}
          partRole={partRole}
          songs={songs}
          userId={userId}
          canManage={canManage}
          onSelectSong={selectSong}
          onOpenDetail={(song, position) => setDetailSong({ song, position })}
          onOpenReferenceAudio={openReferenceAudio}
          onOpenRecordPart={openRecordPart}
          onOpenLyrics={(song) =>
            setDetailSong({
              song,
              position: songs.findIndex((s) => s.id === song.id) + 1,
            })
          }
          onOpenChords={(song) => {
            if (song.chartUrl) window.open(song.chartUrl, "_blank", "noopener,noreferrer");
          }}
          rosterPartRole={rosterPartRole}
          serviceDate={selectedService?.serviceDate ?? ""}
          serviceTime={selectedService ? String(selectedService.serviceTime) : ""}
          onSongUpdated={applyUpdatedSong}
          rehearsal={payload.rehearsal}
          noteBullets={noteBullets}
          onNotesNavigate={() => changeTab("notes")}
        />
      ) : null}

      {tab === "audio" ? (
        <RehearsalAudioTab
          groupId={groupId}
          serviceDate={selectedService?.serviceDate ?? ""}
          serviceTime={selectedService ? String(selectedService.serviceTime) : ""}
          songs={songs}
          plan={plan}
          userId={userId}
          canManage={canManage}
          activeSongId={activeSongId}
          onSelectSong={selectSong}
          onOpenDetail={(song, position) => setDetailSong({ song, position })}
          onOpenReference={openReferenceAudio}
        />
      ) : null}

      {tab === "parts" ? (
        <RehearsalPartsTab
          songs={songs}
          rosterPartRole={rosterPartRole}
          userId={userId}
          canManage={canManage}
          isPublished={isPublished}
          onOpenDetail={(song, position) => setDetailSong({ song, position })}
        />
      ) : null}

      {tab === "notes" ? (
        <RehearsalNotesTab
          noteBullets={noteBullets}
          serviceTitle={serviceTitle}
          rehearsal={payload.rehearsal}
          songs={songs}
        />
      ) : null}

      {canManage && selectedService && plan ? (
        <Link href={worshipPlannerPath(plan)} className="choir-setlist-manage-link block text-center">
          Manage practice resources in worship planner
        </Link>
      ) : null}

      {plan && detailSong && selectedService ? (
        <RehearsalSongPracticeSheet
          groupId={groupId}
          open={Boolean(detailSong)}
          song={detailSong.song}
          position={detailSong.position}
          plan={plan}
          serviceTitle={serviceTitle}
          rosterPartRole={rosterPartRole}
          userId={userId}
          canManage={canManage}
          serviceDate={selectedService.serviceDate}
          serviceTime={String(selectedService.serviceTime)}
          focusListen={detailSong.focusListen}
          focusRecord={detailSong.focusRecord}
          onClose={() => setDetailSong(null)}
          onTogglePrepared={(prepared) => {
            void toggleSongPrepared(detailSong.song.id, prepared);
          }}
          onSongUpdated={applyUpdatedSong}
        />
      ) : null}
    </div>
  );
}

type RehearsalRoomTabContentProps = {
  groupId: string;
  services: ChoirSetlistServiceSummary[];
  selectedService: ChoirSetlistServiceSummary | null;
  servicePickerOpen: boolean;
  onToggleServicePicker: () => void;
  onSelectService: (key: string) => void;
  planLoading: boolean;
  isPublished: boolean;
  serviceTitle: string;
  preparedCount: number;
  totalSongs: number;
  progressPct: number;
  memberRoleLabel: string | null;
  activeSong: WorshipSong | null;
  activePosition: number;
  activeStem: { audioUrl: string; fileName: string; role: string } | null;
  partRole: string;
  songs: WorshipSong[];
  userId?: string;
  canManage: boolean;
  onSelectSong: (id: string) => void;
  onOpenDetail: (song: WorshipSong, position: number) => void;
  onOpenReferenceAudio: (song: WorshipSong) => void;
  onOpenRecordPart: (song: WorshipSong) => void;
  onOpenLyrics: (song: WorshipSong) => void;
  onOpenChords: (song: WorshipSong) => void;
  rosterPartRole: string | null;
  serviceDate: string;
  serviceTime: string;
  onSongUpdated: (song: WorshipSong) => void;
  rehearsal: ChoirRehearsalPagePayload["rehearsal"];
  noteBullets: string[];
  onNotesNavigate: () => void;
};

function RehearsalRoomTabContent({
  groupId,
  services,
  selectedService,
  servicePickerOpen,
  onToggleServicePicker,
  onSelectService,
  planLoading,
  isPublished,
  serviceTitle,
  preparedCount,
  totalSongs,
  progressPct,
  memberRoleLabel,
  activeSong,
  activePosition,
  activeStem,
  partRole,
  songs,
  userId,
  canManage,
  onSelectSong,
  onOpenDetail,
  onOpenReferenceAudio,
  onOpenRecordPart,
  onOpenLyrics,
  onOpenChords,
  rosterPartRole,
  serviceDate,
  serviceTime,
  onSongUpdated,
  rehearsal,
  noteBullets,
  onNotesNavigate,
}: RehearsalRoomTabContentProps) {
  if (!services.length) {
    return (
      <div className="choir-card p-5 text-center">
        <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">No upcoming service</h2>
        <p className="mt-2 text-sm text-[var(--choir-muted)]">
          When your worship leader publishes a service plan, your songs will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="choir-rehearsal-hero choir-page-bleed">
        <Image src={CHOIR_HERO_IMAGE_PATH} alt="" fill className="object-cover object-center" sizes="100vw" priority />
        <div className="choir-rehearsal-hero-overlay" />
        <div className="choir-rehearsal-hero-copy">
          <p className="choir-rehearsal-hero-kicker">Rehearsal room</p>
          <h2 className="choir-rehearsal-hero-title font-display">Ready for the Next Sound</h2>
          <p className="choir-rehearsal-hero-sub">Everything you need to prepare before we minister.</p>
        </div>
      </div>

      <section aria-labelledby="choir-preparing-for">
        <p id="choir-preparing-for" className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--choir-muted)]">
          Preparing for
        </p>
        <div className="choir-rehearsal-service-card">
          <SetlistSongThumbnail youtubeVideoId={undefined} title={serviceTitle} />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[var(--choir-heading)]">{serviceTitle}</p>
            <p className="text-sm text-[var(--choir-body)]">{selectedService?.dateTimeLabel}</p>
            <p className="text-xs text-[var(--choir-muted)]">
              {totalSongs} song{totalSongs === 1 ? "" : "s"} to prepare
            </p>
          </div>
          {services.length > 1 ? (
            <button type="button" className="choir-rehearsal-change-service" onClick={onToggleServicePicker}>
              Change
              <span aria-hidden className="ml-0.5">▾</span>
            </button>
          ) : null}
        </div>
        {servicePickerOpen && services.length > 1 ? (
          <ul className="choir-rehearsal-service-picker mt-2">
            {services.map((service) => (
              <li key={service.planKey}>
                <button type="button" className="choir-rehearsal-service-option" onClick={() => onSelectService(service.planKey)}>
                  {service.title} — {service.dateTimeLabel}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="choir-rehearsal-progress-card" aria-labelledby="choir-practice-progress">
        <h2 id="choir-practice-progress" className="text-base font-bold text-[var(--choir-heading)]">
          My practice progress
        </h2>
        <p className="mt-1 text-sm font-semibold text-[var(--choir-body)]">
          {preparedCount} of {totalSongs} songs ready
        </p>
        <p className="text-sm text-[var(--choir-muted)]">{progressPct}% prepared</p>
        {memberRoleLabel ? (
          <p className="mt-1 text-xs font-medium text-[var(--choir-body)]">Role: {memberRoleLabel}</p>
        ) : null}
        <div className="choir-rehearsal-progress-track mt-3" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="choir-rehearsal-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </section>

      {planLoading ? (
        <p className="text-sm text-[var(--choir-muted)]">Loading songs…</p>
      ) : !isPublished ? (
        <div className="choir-card p-4 text-sm text-[var(--choir-body)]">
          This service plan is not published yet. Check back after your worship leader publishes the setlist.
        </div>
      ) : activeSong ? (
        <section className="choir-rehearsal-now-playing" aria-label="Now playing">
          <div className="flex gap-3">
            <SetlistSongThumbnail youtubeVideoId={activeSong.youtubeVideoId} title={activeSong.title} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--choir-gold)]">Now playing</p>
              <p className="text-lg font-bold text-[var(--choir-heading)]">{activeSong.title}</p>
              {activeSong.leaderName ? (
                <p className="text-sm text-[var(--choir-muted)]">{activeSong.leaderName}</p>
              ) : null}
              <p className="mt-1 text-xs text-[var(--choir-muted)]">
                {activeSong.key?.trim() ? `Key: ${activeSong.key.trim()}` : ""}
                {activeSong.bpm ? ` · BPM: ${activeSong.bpm}` : ""}
              </p>
            </div>
          </div>
          {activeStem ? (
            <WorshipAudioPlayer
              className="mt-3 w-full"
              src={activeStem.audioUrl}
              fileName={activeStem.fileName}
              globalPlayer={
                activeSong
                  ? {
                      id: `rehearsal-${serviceDate}-${serviceTime}-${activeSong.id}-${activeStem.role}`,
                      title: `${activeSong.title} · ${worshipPracticeStemLabel(activeStem.role)}`,
                      kind: "worship-rehearsal",
                      href: `/groups/${groupId}/rehearsal`,
                    }
                  : undefined
              }
            />
          ) : (
            <button type="button" className="choir-rehearsal-resource-btn mt-3 w-full" onClick={() => onOpenReferenceAudio(activeSong)}>
              Open practice reference
            </button>
          )}
          <div className="choir-rehearsal-quick-actions mt-3">
            <button type="button" className="choir-rehearsal-quick-action" onClick={() => onOpenLyrics(activeSong)}>
              <span>View lyrics</span>
              <span aria-hidden>›</span>
            </button>
            <button
              type="button"
              className="choir-rehearsal-quick-action"
              onClick={() => onOpenChords(activeSong)}
              disabled={!activeSong.chartUrl}
            >
              <span>Open chart</span>
              <span aria-hidden>›</span>
            </button>
            <button type="button" className="choir-rehearsal-quick-action" onClick={() => onOpenReferenceAudio(activeSong)}>
              <span>Practice track</span>
              <span aria-hidden>›</span>
            </button>
            <button
              type="button"
              className="choir-rehearsal-quick-action"
              onClick={() => onOpenDetail(activeSong, activePosition)}
            >
              <span>Your part ({worshipPracticeStemLabel(partRole)})</span>
              <span aria-hidden>›</span>
            </button>
            {isPublished && userId ? (
              <button
                type="button"
                className="choir-rehearsal-quick-action choir-rehearsal-quick-action-highlight"
                onClick={() => onOpenRecordPart(activeSong)}
              >
                <span>Record your part</span>
                <span aria-hidden>›</span>
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {isPublished && activeSong && userId && serviceDate && serviceTime ? (
        <section className="choir-card p-4" aria-labelledby="choir-record-rehearsal-heading">
          <h2 id="choir-record-rehearsal-heading" className="font-display text-lg font-bold text-[var(--choir-heading)]">
            Record for rehearsal
          </h2>
          <p className="mt-1 text-sm text-[var(--choir-muted)]">
            For <span className="font-semibold text-[var(--choir-heading)]">{activeSong.title}</span> — submit audio
            for your leader to review.
          </p>
          <RehearsalPartRecordingPanel
            serviceDate={serviceDate}
            serviceTime={serviceTime}
            song={activeSong}
            userId={userId}
            rosterPartRole={rosterPartRole}
            onSongUpdated={onSongUpdated}
          />
        </section>
      ) : null}

      <section aria-labelledby="choir-songs-prepare">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 id="choir-songs-prepare" className="font-display text-lg font-bold text-[var(--choir-heading)]">
              This service&apos;s songs
            </h2>
            <p className="text-xs text-[var(--choir-muted)]">Learn your parts before the next service.</p>
          </div>
        </div>
        {songs.length === 0 ? (
          <div className="choir-card p-4 text-sm text-[var(--choir-muted)]">No songs on this setlist yet.</div>
        ) : (
          <ul className="space-y-2.5">
            {songs.map((song, index) => {
              const position = index + 1;
              const isActive = song.id === activeSong?.id;
              const status = songPrepStatus(song, userId);
              const meta: string[] = [];
              if (song.key?.trim()) meta.push(`Key: ${song.key.trim()}`);
              if (song.bpm) meta.push(`BPM: ${song.bpm}`);
              return (
                <li key={song.id}>
                  <article className={`choir-rehearsal-song-row ${isActive ? "is-active" : ""}`}>
                    <button
                      type="button"
                      className="choir-rehearsal-song-main"
                      onClick={() => {
                        onSelectSong(song.id);
                        onOpenDetail(song, position);
                      }}
                    >
                      <span className={`choir-rehearsal-song-num ${isActive ? "is-active" : ""}`}>{position}</span>
                      <SetlistSongThumbnail youtubeVideoId={song.youtubeVideoId} title={song.title} />
                      <div className="min-w-0 flex-1 text-left">
                        <p className="choir-setlist-song-title">{song.title}</p>
                        {meta.length > 0 ? <p className="choir-setlist-song-meta">{meta.join(" | ")}</p> : null}
                        <p className={`mt-1 text-xs font-semibold ${status === "ready" ? "text-[var(--choir-success)]" : "text-[var(--choir-muted)]"}`}>
                          {songPrepLabel(status)}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="choir-setlist-row-menu"
                      aria-label={`Practice ${song.title}`}
                      onClick={() => onOpenDetail(song, position)}
                    >
                      ⋯
                    </button>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {noteBullets.length > 0 ? (
        <button type="button" className="choir-rehearsal-notes-link-card" onClick={onNotesNavigate}>
          <span className="choir-rehearsal-notes-icon" aria-hidden>📋</span>
          <div className="min-w-0 flex-1 text-left">
            <p className="font-bold text-[var(--choir-heading)]">Rehearsal notes</p>
            <p className="text-xs text-[var(--choir-muted)]">Practice tips and reminders from your leader.</p>
          </div>
          <span aria-hidden>›</span>
        </button>
      ) : null}

      {rehearsal ? (
        <section className="choir-card p-4" aria-labelledby="choir-next-rehearsal">
          <h2 id="choir-next-rehearsal" className="text-base font-bold text-[var(--choir-heading)]">
            Next team rehearsal
          </h2>
          <p className="mt-1 font-semibold text-[var(--choir-body)]">{rehearsal.title}</p>
          <p className="text-sm text-[var(--choir-body)]">{rehearsal.dateLabel} · {rehearsal.timeLabel}</p>
          <p className="text-sm text-[var(--choir-muted)]">{rehearsal.location}</p>
          <Link href={rehearsal.calendarHref} className="choir-setlist-manage-link mt-3 inline-flex">
            View rehearsal details
          </Link>
        </section>
      ) : null}
    </div>
  );
}

function RehearsalAudioTab({
  groupId,
  serviceDate,
  serviceTime,
  songs,
  plan,
  userId,
  canManage,
  activeSongId,
  onSelectSong,
  onOpenDetail,
  onOpenReference,
}: {
  groupId: string;
  serviceDate: string;
  serviceTime: string;
  songs: WorshipSong[];
  plan: WorshipServicePlan | null;
  userId?: string;
  canManage: boolean;
  activeSongId: string | null;
  onSelectSong: (id: string) => void;
  onOpenDetail: (song: WorshipSong, position: number) => void;
  onOpenReference: (song: WorshipSong) => void;
}) {
  if (!plan || plan.status !== "published") {
    return (
      <div className="choir-card p-4 text-sm text-[var(--choir-muted)]">
        Select a published service to practice audio.
      </div>
    );
  }

  const withAudio = songs.filter((song) => hasApprovedPracticeAudio(song, { userId, isManager: canManage }));

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Practice audio</h2>
      {withAudio.length === 0 ? (
        <p className="text-sm text-[var(--choir-muted)]">No practice tracks uploaded for this service yet.</p>
      ) : (
        <ul className="space-y-3">
          {withAudio.map((song, index) => {
            const stems = visiblePracticeStemsForUser(song.practiceStems, userId, canManage);
            const stem = stems.find((entry) => entry.role === "full") ?? stems[0];
            return (
              <li key={song.id} className="choir-card p-3">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    onSelectSong(song.id);
                    onOpenDetail(song, index + 1);
                  }}
                >
                  <p className="font-bold text-[var(--choir-heading)]">{song.title}</p>
                </button>
                {stem ? (
                  <WorshipAudioPlayer
                    className="mt-2 w-full"
                    src={stem.audioUrl}
                    fileName={stem.fileName}
                    globalPlayer={{
                      id: `rehearsal-${serviceDate}-${serviceTime}-${song.id}-${stem.role}`,
                      title: `${song.title} · ${worshipPracticeStemLabel(stem.role)}`,
                      kind: "worship-rehearsal",
                      href: `/groups/${groupId}/rehearsal`,
                    }}
                  />
                ) : (
                  <button type="button" className="choir-rehearsal-resource-btn mt-2" onClick={() => onOpenReference(song)}>
                    Open reference
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RehearsalPartsTab({
  songs,
  rosterPartRole,
  userId,
  canManage,
  isPublished,
  onOpenDetail,
}: {
  songs: WorshipSong[];
  rosterPartRole: string | null;
  userId?: string;
  canManage: boolean;
  isPublished: boolean;
  onOpenDetail: (song: WorshipSong, position: number) => void;
}) {
  const part = rosterPartRole?.trim() || "full";

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Vocal parts</h2>
      <p className="text-sm text-[var(--choir-muted)]">
        {rosterPartRole
          ? `Your section: ${worshipPracticeStemLabel(part)}`
          : "Open a song to practice full mix or uploaded part tracks."}
      </p>
      {isPublished && userId ? (
        <p className="text-xs text-[var(--choir-muted)]">
          Scroll to <strong className="text-[var(--choir-heading)]">Record for rehearsal</strong> on the Rehearsal Room
          tab, or open a song and use Record your part.
        </p>
      ) : null}
      <ul className="space-y-2">
        {songs.map((song, index) => {
          const stems = vocalStemsForSong(song, { userId, isManager: canManage });
          if (stems.length === 0) return null;
          return (
            <li key={song.id}>
              <button
                type="button"
                className="choir-rehearsal-song-row w-full"
                onClick={() => onOpenDetail(song, index + 1)}
              >
                <span className="choir-rehearsal-song-main">
                  <span className="min-w-0 flex-1 text-left">
                    <p className="font-bold text-[var(--choir-heading)]">{song.title}</p>
                    <p className="text-xs text-[var(--choir-muted)]">
                      {stems.map((stem) => worshipPracticeStemLabel(stem.role)).join(" · ")}
                    </p>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {songs.every((song) => vocalStemsForSong(song, { userId, isManager: canManage }).length === 0) ? (
        <p className="text-sm text-[var(--choir-muted)]">No vocal-part recordings for this service yet.</p>
      ) : null}
    </div>
  );
}

function RehearsalNotesTab({
  noteBullets,
  serviceTitle,
  rehearsal,
  songs,
}: {
  noteBullets: string[];
  serviceTitle: string;
  rehearsal: ChoirRehearsalPagePayload["rehearsal"];
  songs: WorshipSong[];
}) {
  const songNotes = songs.filter((song) => song.notes?.trim());

  return (
    <div className="space-y-4">
      <section className="choir-setlist-notes-card">
        <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Notes from your worship leader</h2>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">{serviceTitle}</p>
        {noteBullets.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--choir-muted)]">No service notes published yet.</p>
        ) : (
          <ul className="choir-setlist-notes-list mt-3">
            {noteBullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </section>

      {songNotes.length > 0 ? (
        <section className="choir-setlist-notes-card">
          <h3 className="text-base font-bold text-[var(--choir-heading)]">Song-specific notes</h3>
          <ul className="mt-2 space-y-3">
            {songNotes.map((song) => (
              <li key={song.id}>
                <p className="text-sm font-bold text-[var(--choir-heading)]">{song.title}</p>
                <p className="text-sm text-[var(--choir-body)]">{song.notes?.trim()}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="choir-card p-4">
        <h3 className="text-base font-bold text-[var(--choir-heading)]">Next team rehearsal</h3>
        {rehearsal ? (
          <>
            <p className="mt-2 font-semibold text-[var(--choir-body)]">{rehearsal.title}</p>
            <p className="text-sm text-[var(--choir-body)]">{rehearsal.dateLabel} · {rehearsal.timeLabel}</p>
            <p className="text-sm text-[var(--choir-muted)]">{rehearsal.location}</p>
            {rehearsal.notes ? <p className="mt-2 text-sm text-[var(--choir-body)]">{rehearsal.notes}</p> : null}
            <Link href={rehearsal.calendarHref} className="choir-setlist-manage-link mt-3 inline-flex">
              View rehearsal details
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 font-bold text-[var(--choir-heading)]">No rehearsal scheduled</p>
            <p className="text-sm text-[var(--choir-muted)]">
              Your next rehearsal will appear here when it is published.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
