"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { SongSuggestionTabs } from "@/components/groups/choir/song-suggestions/SongSuggestionTabs";
import { SuggestionCard } from "@/components/groups/choir/song-suggestions/SuggestionCard";
import { CHOIR_HERO_IMAGE_PATH, SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { choirSongSuggestionsHref } from "@/lib/choir-song-suggestion-links";
import type {
  ChoirSongSuggestionCardView,
  ChoirSongSuggestionHomePayload,
  ChoirSongSuggestionTabId,
} from "@/lib/choir-song-suggestion-types";
import { ChoirIconBook, ChoirIconMusic, ChoirIconStar } from "@/components/groups/choir/choir-icons";
import "../choir-premium.css";

type ChoirSongSuggestionsPageProps = {
  groupId: string;
};

function parseTab(value: string | null): ChoirSongSuggestionTabId {
  if (value === "mine" || value === "under_review" || value === "approved" || value === "guidelines") {
    return value;
  }
  return "home";
}

export function ChoirSongSuggestionsPage({ groupId }: ChoirSongSuggestionsPageProps) {
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const [payload, setPayload] = useState<ChoirSongSuggestionHomePayload | null>(null);
  const [listCards, setListCards] = useState<ChoirSongSuggestionCardView[]>([]);
  const [guidelinesMarkdown, setGuidelinesMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(searchParams.get("submit") === "1");
  const [formBusy, setFormBusy] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [reason, setReason] = useState("");
  const [suggestedOccasion, setSuggestedOccasion] = useState("");
  const [songType, setSongType] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [supportBusyId, setSupportBusyId] = useState<string | null>(null);

  const loadHome = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-song-suggestions?groupId=${encodeURIComponent(groupId)}&view=home`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.payload) {
          setError(data.error ?? "Could not load song suggestions.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load song suggestions.");
        setLoading(false);
      });
  }, [groupId]);

  const loadTab = useCallback(() => {
    if (tab === "home") return;
    if (tab === "guidelines") {
      fetch(`/api/groups/choir-song-suggestions?groupId=${encodeURIComponent(groupId)}&view=guidelines`)
        .then((response) => response.json())
        .then((data) => {
          if (data.guidelines?.markdown) setGuidelinesMarkdown(data.guidelines.markdown);
        })
        .catch(() => undefined);
      return;
    }
    fetch(
      `/api/groups/choir-song-suggestions?groupId=${encodeURIComponent(groupId)}&view=list&tab=${encodeURIComponent(tab)}`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.suggestions) setListCards(data.suggestions);
        else setListCards([]);
      })
      .catch(() => setListCards([]));
  }, [groupId, tab]);

  useEffect(() => {
    loadHome();
    window.scrollTo(0, 0);
  }, [loadHome]);

  useEffect(() => {
    loadTab();
  }, [loadTab]);

  async function checkDuplicates() {
    if (!title.trim() || !artist.trim()) return;
    const response = await fetch("/api/groups/choir-song-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "check_duplicates",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        title,
        artist,
      }),
    });
    const data = await response.json();
    if (!response.ok) return;
    const dup = data.duplicates;
    if (!dup) return;
    const parts: string[] = [];
    if (dup.libraryMatches?.length) {
      parts.push(`This may already be in the song library (${dup.libraryMatches[0].title}).`);
    }
    if (dup.similarSuggestions?.length) {
      parts.push(`A similar suggestion is already ${dup.similarSuggestions[0].status.replace(/_/g, " ")}.`);
    }
    setDuplicateWarning(parts.length ? parts.join(" ") : null);
  }

  async function submitSuggestion(event: React.FormEvent, force = false) {
    event.preventDefault();
    if (formBusy) return;
    setFormBusy(true);
    setFormMessage(null);
    if (!force && duplicateWarning) {
      setFormBusy(false);
      return;
    }
    const response = await fetch("/api/groups/choir-song-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        title,
        artist,
        mediaUrl,
        reason,
        suggestedOccasion,
        songType: songType || undefined,
        additionalNotes,
      }),
    });
    const data = await response.json();
    setFormBusy(false);
    if (!response.ok) {
      setFormMessage(data.error ?? "Could not submit.");
      return;
    }
    setFormMessage(data.message ?? "Submitted.");
    setTitle("");
    setArtist("");
    setMediaUrl("");
    setReason("");
    setSuggestedOccasion("");
    setSongType("");
    setAdditionalNotes("");
    setDuplicateWarning(null);
    loadHome();
    setTimeout(() => setFormOpen(false), 1400);
  }

  async function toggleSupport(suggestionId: string) {
    setSupportBusyId(suggestionId);
    const response = await fetch("/api/groups/choir-song-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_support",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        suggestionId,
      }),
    });
    const data = await response.json();
    setSupportBusyId(null);
    if (!response.ok) return;
    setPayload((prev) => {
      if (!prev) return prev;
      const patch = (cards: ChoirSongSuggestionCardView[]) =>
        cards.map((card) =>
          card.id === suggestionId
            ? {
                ...card,
                viewerSupported: data.supported,
                supportCount: data.supportCount,
              }
            : card,
        );
      return { ...prev, recent: patch(prev.recent), trending: patch(prev.trending) };
    });
    setListCards((cards) =>
      cards.map((card) =>
        card.id === suggestionId
          ? { ...card, viewerSupported: data.supported, supportCount: data.supportCount }
          : card,
      ),
    );
  }

  if (loading && !payload) {
    return (
      <div className="choir-group-home choir-song-suggestions-page px-4 py-3">
        <p className="text-sm text-[var(--choir-muted)]">Loading song suggestions…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="choir-group-home choir-song-suggestions-page px-4 py-3">
        <p className="text-sm text-red-700">{error ?? "Unavailable."}</p>
      </div>
    );
  }

  const quickActions = [
    {
      key: "suggest",
      title: "Suggest a Song",
      sub: "Share a song idea",
      icon: <ChoirIconMusic />,
      onClick: () => setFormOpen(true),
    },
    {
      key: "how",
      title: "How It Works",
      sub: "Guidelines & process",
      icon: <ChoirIconBook />,
      href: choirSongSuggestionsHref(groupId, "guidelines"),
    },
    {
      key: "all",
      title: "View All Suggestions",
      sub: "Browse ideas",
      icon: <span aria-hidden>☰</span>,
      href: choirSongSuggestionsHref(groupId, "under_review"),
    },
    {
      key: "approved",
      title: "Approved Songs",
      sub: "See what's been added",
      icon: <ChoirIconStar />,
      href: choirSongSuggestionsHref(groupId, "approved"),
    },
  ];

  return (
    <div className="choir-group-home choir-song-suggestions-page choir-calendar-page choir-page-shell space-y-[18px] pb-10">
      <ChoirSetlistHeader groupId={groupId} chatHref={payload.groupChatHref} />
      <SongSuggestionTabs groupId={groupId} active={tab} />

      {tab === "home" ? (
        <>
          <section className="choir-song-hero">
            <Image
              src={CHOIR_HERO_IMAGE_PATH}
              alt=""
              fill
              className="choir-song-hero-img object-cover"
              sizes="(max-width: 430px) 100vw, 400px"
              priority
            />
            <div className="choir-song-hero-overlay">
              <p className="choir-song-hero-kicker">SONG SUGGESTIONS</p>
              <h1 className="choir-song-hero-title">Let&apos;s Discover What God Is Saying.</h1>
              <p className="choir-song-hero-sub">
                Suggest songs, share worship ideas, and help us discover new songs for our services.
              </p>
            </div>
          </section>

          <div className="choir-song-quick-grid">
            {quickActions.map((action) =>
              action.href ? (
                <Link key={action.key} href={action.href} className="choir-song-quick-card">
                  <span className="choir-song-quick-icon">{action.icon}</span>
                  <p className="choir-song-quick-title">{action.title}</p>
                  <p className="choir-song-quick-sub">{action.sub}</p>
                  <span className="choir-song-quick-chevron" aria-hidden>›</span>
                </Link>
              ) : (
                <button key={action.key} type="button" className="choir-song-quick-card" onClick={action.onClick}>
                  <span className="choir-song-quick-icon">{action.icon}</span>
                  <p className="choir-song-quick-title">{action.title}</p>
                  <p className="choir-song-quick-sub">{action.sub}</p>
                  <span className="choir-song-quick-chevron" aria-hidden>›</span>
                </button>
              ),
            )}
          </div>

          <section>
            <div className="choir-song-section-head">
              <h2 className="choir-song-section-title">Recent Suggestions</h2>
              <Link href={choirSongSuggestionsHref(groupId, "under_review")} className="choir-song-see-all">
                See All
              </Link>
            </div>
            {payload.recent.length === 0 ? (
              <p className="text-sm text-[var(--choir-muted)]">No suggestions yet. Be the first to share a song idea.</p>
            ) : (
              <div className="choir-song-recent-row">
                {payload.recent.map((card) => (
                  <SuggestionCard
                    key={card.id}
                    card={card}
                    onSupport={() => toggleSupport(card.id)}
                    supportBusy={supportBusyId === card.id}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="choir-song-section-head">
              <h2 className="choir-song-section-title">Trending Suggestions</h2>
              <Link href={choirSongSuggestionsHref(groupId, "under_review")} className="choir-song-see-all">
                See All
              </Link>
            </div>
            {payload.trending.length === 0 ? (
              <p className="text-sm text-[var(--choir-muted)]">Trending will appear as the team engages with suggestions.</p>
            ) : (
              <div className="choir-song-trending-row">
                {payload.trending.map((card) => (
                  <SuggestionCard
                    key={card.id}
                    card={card}
                    variant="trending"
                    onSupport={() => toggleSupport(card.id)}
                    supportBusy={supportBusyId === card.id}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="choir-song-bottom-cta">
            <span className="choir-song-cta-bulb" aria-hidden>💡</span>
            <div className="choir-song-cta-copy">
              <p className="choir-song-cta-title">Have a song suggestion?</p>
              <p className="choir-song-cta-sub">
                Share a song, YouTube link, and a short note on why you think it would be a great fit for our worship
                services.
              </p>
            </div>
            <button type="button" className="choir-song-cta-btn" onClick={() => setFormOpen(true)}>
              Suggest a Song →
            </button>
          </section>
        </>
      ) : null}

      {tab !== "home" && tab !== "guidelines" ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">
            {tab === "mine"
              ? "My suggestions"
              : tab === "under_review"
                ? "Under review"
                : tab === "approved"
                  ? "Approved songs"
                  : "Suggestions"}
          </h2>
          {listCards.length === 0 ? (
            <p className="text-sm text-[var(--choir-muted)]">
              {tab === "mine"
                ? "You have not submitted any songs yet."
                : tab === "approved"
                  ? "No approved songs to show yet."
                  : "Nothing to show in this view yet."}
            </p>
          ) : (
            <div className="space-y-3">
              {listCards.map((card) => (
                <SuggestionCard
                  key={card.id}
                  card={card}
                  variant="list"
                  onSupport={() => toggleSupport(card.id)}
                  supportBusy={supportBusyId === card.id}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === "guidelines" ? (
        <section className="choir-song-guidelines prose prose-sm max-w-none text-[var(--choir-body)]">
          <h2 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Song Suggestion Guidelines</h2>
          <GuidelinesBody markdown={guidelinesMarkdown ?? payload.guidelinesPreview} />
        </section>
      ) : null}

      {payload.canManage && payload.reviewQueueHref ? (
        <Link href={payload.reviewQueueHref} className="choir-setlist-manage-link block text-center">
          Leadership review queue →
        </Link>
      ) : null}

      {formOpen ? (
        <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={() => setFormOpen(false)}>
          <div className="choir-setlist-sheet choir-song-form-sheet" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">Suggest a song</h2>
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => submitSuggestion(event, false)}
            >
              <input
                className="choir-setlist-search w-full"
                placeholder="Song title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => checkDuplicates()}
                required
              />
              <input
                className="choir-setlist-search w-full"
                placeholder="Artist / worship ministry *"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                onBlur={() => checkDuplicates()}
                required
              />
              <input
                className="choir-setlist-search w-full"
                placeholder="YouTube or music link (recommended)"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                inputMode="url"
              />
              <textarea
                className="choir-announcement-textarea w-full min-h-[88px]"
                placeholder="Why are you suggesting this song? *"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <input
                className="choir-setlist-search w-full"
                placeholder="Suggested service or occasion"
                value={suggestedOccasion}
                onChange={(e) => setSuggestedOccasion(e.target.value)}
              />
              <select
                className="choir-setlist-search w-full"
                value={songType}
                onChange={(e) => setSongType(e.target.value)}
              >
                <option value="">Song type (optional)</option>
                <option value="praise">Praise</option>
                <option value="worship">Worship</option>
                <option value="hymn">Hymn</option>
                <option value="spontaneous">Spontaneous worship</option>
                <option value="other">Other</option>
              </select>
              <textarea
                className="choir-announcement-textarea w-full min-h-[64px]"
                placeholder="Additional notes (optional)"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
              {duplicateWarning ? (
                <div className="rounded-xl border border-[#D6A64C] bg-[#F5EFE5] p-3 text-sm text-[var(--choir-body)]">
                  <p>{duplicateWarning}</p>
                  <button
                    type="button"
                    className="mt-2 text-sm font-bold text-[#AA751D]"
                    onClick={(event) => submitSuggestion(event, true)}
                  >
                    Submit anyway
                  </button>
                </div>
              ) : null}
              {formMessage ? <p className="text-sm text-[var(--choir-body)]">{formMessage}</p> : null}
              <button type="submit" className="choir-btn-primary w-full" disabled={formBusy}>
                {formBusy ? "Submitting…" : "Submit suggestion"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="choir-song-fab"
        aria-label="Suggest a song"
        onClick={() => setFormOpen(true)}
      >
        +
      </button>
    </div>
  );
}

function GuidelinesBody({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n\n+/);
  return (
    <div className="mt-4 space-y-3 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={index} className="font-display text-base font-bold text-[var(--choir-heading)]">
              {trimmed.replace(/^###\s*/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={index} className="font-display text-lg font-bold text-[var(--choir-heading)]">
              {trimmed.replace(/^##\s*/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("- ")) {
          const items = trimmed.split("\n").map((line) => line.replace(/^-+\s*/, ""));
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
        }
        if (/^\d+\./.test(trimmed)) {
          const items = trimmed.split("\n").map((line) => line.replace(/^\d+\.\s*/, ""));
          return (
            <ol key={index} className="list-decimal space-y-1 pl-5">
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          );
        }
        return <p key={index}>{trimmed}</p>;
      })}
    </div>
  );
}
