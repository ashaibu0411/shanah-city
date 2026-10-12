"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import type { ChoirSetlistPagePayload } from "@/lib/choir-setlist-types";
import { normalizeSongs, type WorshipLibrarySong, type WorshipServicePlan, type WorshipSong } from "@/lib/worship-types";
import { WorshipSongBreakdownLyrics } from "@/components/worship/WorshipSongBreakdownLyrics";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { SetlistSegmentTabs, type SetlistTabId } from "@/components/groups/choir/setlist/SetlistSegmentTabs";
import { CurrentSetlistTab } from "@/components/groups/choir/setlist/CurrentSetlistTab";
import { SongLibraryTab } from "@/components/groups/choir/setlist/SongLibraryTab";
import { FavoriteSongsTab } from "@/components/groups/choir/setlist/FavoriteSongsTab";
import { SongDetailSheet } from "@/components/groups/choir/setlist/SongDetailSheet";
import { LibrarySongDetailSheet } from "@/components/groups/choir/setlist/LibrarySongDetailSheet";
import "../choir-premium.css";

type ChoirSetlistPageProps = {
  groupId: string;
};

export function ChoirSetlistPage({ groupId }: ChoirSetlistPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const initialTab = (searchParams.get("tab") as SetlistTabId) || "current";
  const [tab, setTab] = useState<SetlistTabId>(
    initialTab === "library" || initialTab === "favorites" ? initialTab : "current",
  );

  const [payload, setPayload] = useState<ChoirSetlistPagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [plan, setPlan] = useState<WorshipServicePlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  const [detailSong, setDetailSong] = useState<{
    song: WorshipSong;
    position: number;
    focusListen?: boolean;
  } | null>(null);
  const [lyricsSong, setLyricsSong] = useState<WorshipSong | null>(null);
  const [librarySong, setLibrarySong] = useState<WorshipLibrarySong | null>(null);

  const loadPayload = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-setlists?groupId=${encodeURIComponent(groupId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.payload) {
          setError(data.error ?? "Could not load setlists.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load setlists.");
        setLoading(false);
      });
  }, [groupId]);

  useEffect(() => {
    loadPayload();
  }, [loadPayload]);

  const services = payload?.services ?? [];

  useEffect(() => {
    if (!services.length) return;
    const fromUrl = searchParams.get("service");
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    let key = fromUrl;
    if (!key && date && time) {
      key = `${date}|${time}`;
    }
    if (!key || !services.some((entry) => entry.planKey === key)) {
      key = services[0].planKey;
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
    if (tab === "current") {
      loadPlan();
    }
  }, [tab, loadPlan]);

  function selectService(planKey: string) {
    setSelectedKey(planKey);
    const service = services.find((entry) => entry.planKey === planKey);
    if (!service) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", service.serviceDate);
    params.set("time", String(service.serviceTime));
    params.set("service", planKey);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function changeTab(next: SetlistTabId) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  async function toggleFavorite(songId: string) {
    const response = await fetch("/api/groups/choir-setlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_favorite",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        songId,
      }),
    });
    const data = await response.json();
    if (response.ok && data.favoriteSongIds) {
      setPayload((current) =>
        current ? { ...current, favoriteSongIds: data.favoriteSongIds } : current,
      );
    }
  }

  function openChords(song: WorshipSong) {
    if (song.chartUrl) {
      window.open(song.chartUrl, "_blank", "noopener,noreferrer");
    }
  }

  function openAudio(song: WorshipSong) {
    if (!plan) return;
    const idx = normalizeSongs(plan.songs).findIndex((entry) => entry.id === song.id);
    setDetailSong({
      song,
      position: idx >= 0 ? idx + 1 : 1,
      focusListen: true,
    });
  }

  const favoriteIds = payload?.favoriteSongIds ?? [];
  const canManage = payload?.canManage ?? false;
  const serviceTitle = selectedService?.title ?? "Sunday Service";

  function openLibrarySearch() {
    changeTab("library");
  }

  if (loading) {
    return (
      <div className="choir-group-home choir-setlist-page px-4 py-3">
        <p className="text-sm text-[var(--choir-muted)]">Loading setlists…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="choir-group-home choir-setlist-page px-4 py-3">
        <p className="text-sm text-red-700">{error ?? "Unavailable."}</p>
        <button type="button" className="choir-setlist-manage-link mt-3" onClick={loadPayload}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="choir-group-home choir-setlist-page choir-page-shell space-y-[18px] pb-6">
      <ChoirSetlistHeader
        groupId={groupId}
        chatHref={payload.groupChatHref}
        onSearchClick={openLibrarySearch}
      />

      <SetlistSegmentTabs active={tab} onChange={changeTab} />

      {tab === "current" ? (
        <CurrentSetlistTab
          services={services}
          selectedKey={selectedKey}
          onSelectService={selectService}
          plan={plan}
          planLoading={planLoading}
          canManage={canManage}
          onOpenSong={(song, position) => setDetailSong({ song, position })}
          onLyrics={(song) => setLyricsSong(song)}
          onChords={openChords}
          onAudio={openAudio}
        />
      ) : null}

      {tab === "library" ? (
        <SongLibraryTab
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          onOpenSong={setLibrarySong}
        />
      ) : null}

      {tab === "favorites" ? (
        <FavoriteSongsTab
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          onOpenSong={setLibrarySong}
        />
      ) : null}

      <SongDetailSheet
        open={Boolean(detailSong)}
        song={detailSong?.song ?? null}
        position={detailSong?.position}
        serviceDate={selectedService?.serviceDate ?? ""}
        serviceTime={String(selectedService?.serviceTime ?? "")}
        serviceTitle={serviceTitle}
        planStatus={plan?.status ?? "draft"}
        userId={user?.id}
        canManage={canManage}
        focusListen={detailSong?.focusListen}
        onClose={() => setDetailSong(null)}
      />

      <LibrarySongDetailSheet
        open={Boolean(librarySong)}
        song={librarySong}
        onClose={() => setLibrarySong(null)}
      />

      {lyricsSong ? (
        <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={() => setLyricsSong(null)}>
          <div
            className="choir-setlist-sheet"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="choir-header-icon-btn !h-10 !w-10 mb-2"
              onClick={() => setLyricsSong(null)}
              aria-label="Close"
            >
              ×
            </button>
            <WorshipSongBreakdownLyrics title={lyricsSong.title} lyrics={lyricsSong.lyrics} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
