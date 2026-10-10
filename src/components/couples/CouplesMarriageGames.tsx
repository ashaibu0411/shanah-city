"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CouplesGameOverlay } from "@/components/couples/CouplesGameOverlay";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import {
  CouplesLoadingSkeleton,
  CouplesPrimaryButton,
  CouplesSecondaryButton,
} from "@/components/couples/design-system";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import {
  BIBLE_TRIVIA,
  CONVERSATION_PROMPTS,
  THIS_OR_THAT,
  WEEKLY_CHALLENGES,
  shuffleDeck,
  type CoupleGameId,
} from "@/lib/couple-games-catalog";
import {
  buildTriviaOptions,
  COUPLES_GAME_LIST,
  CouplesGameListCard,
  CouplesGamesHero,
  GameAnswerOption,
  GameDiscussionPanel,
} from "@/lib/couple-games-ui";
import type { KnowSpouseClientView } from "@/lib/couple-game-state-types";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

function advanceDeck<T>(deck: T[], index: number, setDeck: (d: T[]) => void, setIndex: (i: number) => void) {
  if (index + 1 < deck.length) {
    setIndex(index + 1);
    return;
  }
  setDeck(shuffleDeck(deck));
  setIndex(0);
}

function KnowSpouseGamePanel({
  view,
  loading,
  error,
  busy,
  draft,
  onDraftChange,
  onRefresh,
  onSubmit,
  onConsent,
  onNext,
}: {
  view: KnowSpouseClientView | null;
  loading: boolean;
  error: string | null;
  busy: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onRefresh: () => void;
  onSubmit: () => void;
  onConsent: () => void;
  onNext: () => void;
}) {
  if (loading && !view) {
    return <CouplesLoadingSkeleton rows={4} />;
  }
  if (error && !view) {
    return <p className={couplesHubPremium.sheetStatusError}>{error}</p>;
  }
  if (!view) return null;

  return (
    <div>
      <p className="text-lg font-medium leading-relaxed text-[var(--couples-text)]">{view.question}</p>
      <p className="mt-2 text-sm text-[var(--couples-muted)]">
        Your answer stays private until you both submit and agree to reveal.
      </p>

      {view.phase === "answer" ? (
        <>
          <textarea
            className="mt-4 min-h-[7rem] w-full rounded-2xl border border-[var(--couples-border)] bg-white px-3 py-3 text-sm text-[var(--couples-text)] placeholder:text-[var(--couples-muted)]"
            placeholder="Type your answer…"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            maxLength={2000}
          />
          <CouplesPrimaryButton className="mt-4" disabled={busy || !draft.trim()} onClick={onSubmit}>
            Submit privately
          </CouplesPrimaryButton>
        </>
      ) : null}

      {view.phase === "waiting" ? (
        <GameDiscussionPanel title="Waiting on your spouse">
          <p>You submitted your answer. We&apos;ll notify this screen when {view.spouseName} is ready.</p>
          <CouplesSecondaryButton className="mt-4" onClick={onRefresh}>
            Refresh
          </CouplesSecondaryButton>
        </GameDiscussionPanel>
      ) : null}

      {view.phase === "consent" ? (
        <>
          <GameDiscussionPanel title="Ready to reveal">
            <p>
              You both answered. When you&apos;re ready, agree to reveal — {view.spouseName} must agree too.
            </p>
          </GameDiscussionPanel>
          {view.myConsent ? (
            <p className="mt-4 text-sm font-medium text-[var(--couples-muted)]">
              You agreed to reveal. Waiting on {view.spouseName}…
            </p>
          ) : (
            <CouplesPrimaryButton className="mt-4" disabled={busy} onClick={onConsent}>
              I agree — reveal our answers
            </CouplesPrimaryButton>
          )}
          <CouplesSecondaryButton className="mt-3" onClick={onRefresh}>
            Refresh
          </CouplesSecondaryButton>
        </>
      ) : null}

      {view.phase === "revealed" ? (
        <>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-[var(--couples-border)]">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--couples-muted)]">Your answer</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--couples-text)]">{view.myAnswer}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-[var(--couples-border)]">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--couples-muted)]">
                {view.spouseName}&apos;s answer
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--couples-text)]">{view.spouseAnswer}</p>
            </div>
          </div>
          <GameDiscussionPanel title="Discuss">
            <p>What surprised you? What do you want to celebrate or follow up on this week?</p>
          </GameDiscussionPanel>
          <CouplesPrimaryButton className="mt-5" disabled={busy} onClick={onNext}>
            Next question
          </CouplesPrimaryButton>
        </>
      ) : null}
    </div>
  );
}

export function CouplesMarriageGames() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<CoupleGameId | null>(null);

  const [knowView, setKnowView] = useState<KnowSpouseClientView | null>(null);
  const [knowLoading, setKnowLoading] = useState(false);
  const [knowError, setKnowError] = useState<string | null>(null);
  const [knowBusy, setKnowBusy] = useState(false);
  const [knowDraft, setKnowDraft] = useState("");

  const [triviaDeck, setTriviaDeck] = useState<typeof BIBLE_TRIVIA>([]);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaPicked, setTriviaPicked] = useState<string | null>(null);
  const [triviaRevealed, setTriviaRevealed] = useState(false);

  const [conversationDeck, setConversationDeck] = useState<string[]>([]);
  const [conversationIndex, setConversationIndex] = useState(0);

  const [thisOrThatDeck, setThisOrThatDeck] = useState<typeof THIS_OR_THAT>([]);
  const [thisOrThatIndex, setThisOrThatIndex] = useState(0);
  const [thisOrThatPick, setThisOrThatPick] = useState<"a" | "b" | null>(null);

  const [weeklyDeck, setWeeklyDeck] = useState<string[]>([]);
  const [weeklyIndex, setWeeklyIndex] = useState(0);
  const [weeklyAccepted, setWeeklyAccepted] = useState(false);

  const locked = !hub?.hasActiveLink;

  const loadHub = useCallback(() => {
    return fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setHub(data.overview ?? null);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const loadKnowSpouse = useCallback(() => {
    setKnowLoading(true);
    setKnowError(null);
    return fetch("/api/couples/games")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load game.");
        setKnowView(data.knowSpouse ?? null);
        if (data.knowSpouse?.myAnswer) setKnowDraft(data.knowSpouse.myAnswer);
      })
      .catch((err) => {
        setKnowError(err instanceof Error ? err.message : "Could not load game.");
      })
      .finally(() => setKnowLoading(false));
  }, []);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  useEffect(() => {
    if (activeGame === "know-spouse" && !locked) {
      void loadKnowSpouse();
    }
  }, [activeGame, locked, loadKnowSpouse]);

  useEffect(() => {
    if (activeGame !== "know-spouse" || locked) return;
    if (!knowView || (knowView.phase !== "waiting" && knowView.phase !== "consent")) return;
    const timer = window.setInterval(() => {
      void loadKnowSpouse();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeGame, knowView, locked, loadKnowSpouse]);

  const activeMeta = COUPLES_GAME_LIST.find((g) => g.id === activeGame);

  const triviaCard = triviaDeck[triviaIndex] ?? BIBLE_TRIVIA[0];
  const triviaOptions = useMemo(
    () => buildTriviaOptions(triviaCard, triviaDeck.length ? triviaDeck : BIBLE_TRIVIA),
    [triviaCard, triviaDeck],
  );

  const conversationPrompt = conversationDeck[conversationIndex] ?? CONVERSATION_PROMPTS[0];
  const thisOrThat = thisOrThatDeck[thisOrThatIndex] ?? THIS_OR_THAT[0];
  const weeklyChallenge = weeklyDeck[weeklyIndex] ?? WEEKLY_CHALLENGES[0];

  function openGame(id: CoupleGameId) {
    setActiveGame(id);
    setKnowView(null);
    setKnowDraft("");
    setKnowError(null);
    setTriviaDeck(shuffleDeck(BIBLE_TRIVIA));
    setTriviaIndex(0);
    setTriviaPicked(null);
    setTriviaRevealed(false);
    setConversationDeck(shuffleDeck(CONVERSATION_PROMPTS));
    setConversationIndex(0);
    setThisOrThatDeck(shuffleDeck(THIS_OR_THAT));
    setThisOrThatIndex(0);
    setThisOrThatPick(null);
    setWeeklyDeck(shuffleDeck(WEEKLY_CHALLENGES));
    setWeeklyIndex(0);
    setWeeklyAccepted(false);
  }

  function closeGame() {
    setActiveGame(null);
  }

  async function postKnowSpouse(action: string, payload: Record<string, unknown> = {}) {
    setKnowBusy(true);
    setKnowError(null);
    const response = await fetch("/api/couples/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await response.json();
    setKnowBusy(false);
    if (!response.ok) {
      setKnowError(data.error ?? "Something went wrong.");
      return;
    }
    setKnowView(data.knowSpouse ?? null);
    if (data.knowSpouse?.phase === "answer") setKnowDraft("");
  }

  const overlayProgress = useMemo(() => {
    if (activeGame === "know-spouse" && knowView) {
      return knowView.progress;
    }
    if (activeGame === "bible-trivia") {
      return { current: triviaIndex + 1, total: triviaDeck.length || BIBLE_TRIVIA.length };
    }
    if (activeGame === "conversation") {
      return { current: conversationIndex + 1, total: conversationDeck.length || CONVERSATION_PROMPTS.length };
    }
    if (activeGame === "this-or-that") {
      return { current: thisOrThatIndex + 1, total: thisOrThatDeck.length || THIS_OR_THAT.length };
    }
    if (activeGame === "weekly") {
      return { current: weeklyIndex + 1, total: weeklyDeck.length || WEEKLY_CHALLENGES.length };
    }
    return undefined;
  }, [
    activeGame,
    knowView,
    triviaIndex,
    triviaDeck.length,
    conversationIndex,
    conversationDeck.length,
    thisOrThatIndex,
    thisOrThatDeck.length,
    weeklyIndex,
    weeklyDeck.length,
  ]);

  const gameOpen = Boolean(activeGame && activeMeta && !locked);

  return (
    <div className={`${couplesHubPremium.page} couples-hub-typography min-h-full`}>
      {!gameOpen ? (
        <div className="mx-auto w-full max-w-lg">
          <header
            className="sticky top-0 z-30 flex min-h-[3.25rem] items-center gap-2 bg-[var(--couples-midnight)] px-[var(--couples-page-padding)] py-3 text-white safe-top"
          >
            <Link
              href="/couples/marriage"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl font-light transition hover:bg-white/10 active:scale-95"
              aria-label="Back to Our Marriage"
            >
              ‹
            </Link>
            <h1
              className="min-w-0 flex-1 truncate text-center font-[family-name:var(--font-couples-display)] text-[1.05rem] font-semibold tracking-tight"
            >
              Couples Games
            </h1>
            <span className="h-11 w-11 shrink-0" aria-hidden />
          </header>

          <CouplesGamesHero />

          <main className="px-[var(--couples-page-padding)] pb-10 pt-5">
            {locked ? (
              <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
            ) : loading ? (
              <CouplesLoadingSkeleton rows={5} />
            ) : (
              <ul className="space-y-3">
                {COUPLES_GAME_LIST.map((game) => (
                  <CouplesGameListCard key={game.id} item={game} onClick={() => openGame(game.id)} />
                ))}
              </ul>
            )}
          </main>
        </div>
      ) : null}

      <CouplesGameOverlay
        open={gameOpen}
        title={activeMeta?.title ?? "Game"}
        subtitle={activeMeta?.subtitle}
        progress={overlayProgress}
        onClose={closeGame}
      >
        {activeGame === "know-spouse" ? (
          <KnowSpouseGamePanel
            view={knowView}
            loading={knowLoading}
            error={knowError}
            busy={knowBusy}
            draft={knowDraft}
            onDraftChange={setKnowDraft}
            onRefresh={() => void loadKnowSpouse()}
            onSubmit={() => void postKnowSpouse("knowSpouseSubmit", { answer: knowDraft })}
            onConsent={() => void postKnowSpouse("knowSpouseConsent")}
            onNext={() => void postKnowSpouse("knowSpouseNext")}
          />
        ) : null}

        {activeGame === "bible-trivia" ? (
          <div>
            <p className="text-lg font-medium leading-relaxed text-[var(--couples-text)]">
              {triviaCard.question}
            </p>
            <div className="mt-5 grid gap-3">
              {triviaOptions.options.map((option) => (
                <GameAnswerOption
                  key={option}
                  label={option}
                  selected={triviaPicked === option}
                  disabled={triviaRevealed}
                  onSelect={() => {
                    setTriviaPicked(option);
                    setTriviaRevealed(true);
                  }}
                />
              ))}
            </div>
            {triviaRevealed ? (
              <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-[var(--couples-border)]">
                <p className="text-sm leading-relaxed text-[var(--couples-text)]">{triviaCard.answer}</p>
                <p className="mt-2 text-xs font-semibold text-[var(--couples-gold)]">{triviaCard.reference}</p>
                {triviaPicked !== triviaOptions.correct ? (
                  <p className="mt-2 text-xs text-[var(--couples-muted)]">No worries — talk through it together.</p>
                ) : null}
              </div>
            ) : null}
            {triviaRevealed ? (
              <CouplesPrimaryButton
                className="mt-5"
                onClick={() => {
                  setTriviaPicked(null);
                  setTriviaRevealed(false);
                  advanceDeck(triviaDeck, triviaIndex, setTriviaDeck, setTriviaIndex);
                }}
              >
                Next question
              </CouplesPrimaryButton>
            ) : null}
          </div>
        ) : null}

        {activeGame === "conversation" ? (
          <div>
            <p className="rounded-2xl bg-white px-5 py-6 text-center text-lg font-medium leading-relaxed text-[var(--couples-text)] ring-1 ring-[var(--couples-border)]">
              {conversationPrompt}
            </p>
            <GameDiscussionPanel title="Take your time">
              <p>There&apos;s no score — listen, ask follow-ups, and pray if it feels right.</p>
            </GameDiscussionPanel>
            <CouplesPrimaryButton
              className="mt-5"
              onClick={() =>
                advanceDeck(conversationDeck, conversationIndex, setConversationDeck, setConversationIndex)
              }
            >
              Next prompt
            </CouplesPrimaryButton>
          </div>
        ) : null}

        {activeGame === "this-or-that" ? (
          <div>
            <p className="text-center text-sm text-[var(--couples-muted)]">
              Each pick a side — then compare why.
            </p>
            <div className="mt-4 grid gap-3">
              <GameAnswerOption
                label={thisOrThat.a}
                selected={thisOrThatPick === "a"}
                onSelect={() => setThisOrThatPick("a")}
              />
              <GameAnswerOption
                label={thisOrThat.b}
                selected={thisOrThatPick === "b"}
                onSelect={() => setThisOrThatPick("b")}
              />
            </div>
            {thisOrThatPick ? (
              <GameDiscussionPanel title="Discuss">
                <p>Did you match or choose differently? Share the story behind your pick.</p>
              </GameDiscussionPanel>
            ) : null}
            <CouplesPrimaryButton
              className="mt-5"
              onClick={() => {
                setThisOrThatPick(null);
                advanceDeck(thisOrThatDeck, thisOrThatIndex, setThisOrThatDeck, setThisOrThatIndex);
              }}
            >
              Next pair
            </CouplesPrimaryButton>
          </div>
        ) : null}

        {activeGame === "weekly" ? (
          <div>
            <p className="text-lg leading-relaxed text-[var(--couples-text)]">{weeklyChallenge}</p>
            {!weeklyAccepted ? (
              <CouplesPrimaryButton className="mt-5" onClick={() => setWeeklyAccepted(true)}>
                We&apos;re in — let&apos;s do this
              </CouplesPrimaryButton>
            ) : (
              <>
                <GameDiscussionPanel title="This week">
                  <p>
                    Put it on the calendar, check in mid-week, and celebrate when you complete it — even if it&apos;s
                    imperfect.
                  </p>
                </GameDiscussionPanel>
                <CouplesPrimaryButton
                  className="mt-5"
                  onClick={() => {
                    setWeeklyAccepted(false);
                    advanceDeck(weeklyDeck, weeklyIndex, setWeeklyDeck, setWeeklyIndex);
                  }}
                >
                  Draw another challenge
                </CouplesPrimaryButton>
              </>
            )}
          </div>
        ) : null}
      </CouplesGameOverlay>
    </div>
  );
}
