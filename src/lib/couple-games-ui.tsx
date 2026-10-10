"use client";

import type { CoupleGameId } from "@/lib/couple-games-catalog";
import { BIBLE_TRIVIA, shuffleDeck } from "@/lib/couple-games-catalog";

export type CouplesGameListItem = {
  id: CoupleGameId;
  title: string;
  subtitle: string;
  icon: "brain" | "book" | "bubble" | "shuffle" | "trophy";
};

export const COUPLES_GAME_LIST: CouplesGameListItem[] = [
  {
    id: "know-spouse",
    title: "How Well Do You Know Your Spouse?",
    subtitle: "Private answers, revealed together",
    icon: "brain",
  },
  {
    id: "bible-trivia",
    title: "Marriage Bible Trivia",
    subtitle: "Scripture and wisdom for couples",
    icon: "book",
  },
  {
    id: "conversation",
    title: "Conversation Cards",
    subtitle: "Meaningful prompts to go deeper",
    icon: "bubble",
  },
  {
    id: "this-or-that",
    title: "This or That",
    subtitle: "Playful choices — compare why",
    icon: "shuffle",
  },
  {
    id: "weekly",
    title: "Challenge of the Week",
    subtitle: "One assignment to try together",
    icon: "trophy",
  },
];

const iconRing: Record<CouplesGameListItem["icon"], string> = {
  brain: "bg-violet-100 text-violet-700 ring-violet-200/80",
  book: "bg-amber-100 text-amber-900 ring-amber-200/80",
  bubble: "bg-rose-100 text-rose-700 ring-rose-200/80",
  shuffle: "bg-sky-100 text-sky-800 ring-sky-200/80",
  trophy: "bg-[var(--couples-gold-light)] text-[var(--couples-mocha)] ring-[var(--couples-border)]",
};

function BrainIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9.5 4.5a3.5 3.5 0 0 0-3.2 2.1A3.5 3.5 0 0 0 3 9.5v1a3.5 3.5 0 0 0 2.3 3.3A4 4 0 0 0 8 18.5V20a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1.5a4 4 0 0 0 2.7-3.7A3.5 3.5 0 0 0 21 10.5v-1a3.5 3.5 0 0 0-3.3-2.9 3.5 3.5 0 0 0-6.4-1.6A3.5 3.5 0 0 0 9.5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5.5A2.5 2.5 0 0 1 7.5 3H18v16.5H7.5A2.5 2.5 0 0 0 5 22V5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 7h8M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BubbleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6.5A4.5 4.5 0 0 1 10.5 2h3A4.5 4.5 0 0 1 18 6.5V12a4.5 4.5 0 0 1-4.5 4.5h-2.2L9 20.5V16.5H10.5A4.5 4.5 0 0 1 6 12V6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 4h4v4M20 4l-6 6M8 20H4v-4M4 20l6-6M14 10l-4 4M10 10l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4h10v3a5 5 0 0 1-10 0V4ZM5 7H3v1a3 3 0 0 0 3 3M19 7h2v1a3 3 0 0 1-3 3M12 12v3M9 20h6M10 15h4v2H10v-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CouplesGameListIcon({ icon }: { icon: CouplesGameListItem["icon"] }) {
  const ring = iconRing[icon];
  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${ring}`}
      aria-hidden
    >
      {icon === "brain" ? <BrainIcon /> : null}
      {icon === "book" ? <BookIcon /> : null}
      {icon === "bubble" ? <BubbleIcon /> : null}
      {icon === "shuffle" ? <ShuffleIcon /> : null}
      {icon === "trophy" ? <TrophyIcon className="text-[var(--couples-gold)]" /> : null}
    </span>
  );
}

export function CouplesGamesHero() {
  return (
    <section
      className="relative mx-[var(--couples-page-padding)] mt-2 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#3d1f4a] via-[#5c2d6e] to-[#2a1840] px-6 py-7 text-center text-white shadow-md ring-1 ring-white/10"
    >
      <div className="mx-auto flex max-w-sm flex-col items-center">
        <span className="text-[var(--couples-gold)]">
          <TrophyIcon className="h-9 w-9" />
        </span>
        <h2
          className="mt-3 font-[family-name:var(--font-couples-display)] text-[1.45rem] font-semibold leading-tight"
        >
          Have Fun. Get Closer.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/88">
          Games and challenges designed to help you know, love and grow together.
        </p>
      </div>
    </section>
  );
}

export function CouplesGameListCard({
  item,
  onClick,
}: {
  item: CouplesGameListItem;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex h-[4.75rem] w-full items-center gap-3 rounded-[18px] bg-white px-4 text-left shadow-sm ring-1 ring-[var(--couples-border)] transition active:scale-[0.99] hover:ring-[var(--couples-gold)]/35"
      >
        <CouplesGameListIcon icon={item.icon} />
        <span className="min-w-0 flex-1 font-semibold text-[var(--couples-text)]">{item.title}</span>
        <span className="shrink-0 text-xl text-[var(--couples-muted)]" aria-hidden>›</span>
      </button>
    </li>
  );
}

export function GameProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--couples-muted)]">
        <span>Progress</span>
        <span>
          {Math.min(current, total)} of {total}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--couples-ivory)] ring-1 ring-[var(--couples-border)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#5c2d6e] to-[var(--couples-gold)] transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function GameAnswerOption({
  label,
  selected,
  onSelect,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`w-full rounded-2xl px-4 py-4 text-left text-base font-semibold leading-snug transition motion-reduce:transition-none active:scale-[0.99] disabled:opacity-60 ${
        selected
          ? "bg-[var(--couples-midnight)] text-white ring-2 ring-[var(--couples-gold)]"
          : "bg-white text-[var(--couples-text)] ring-1 ring-[var(--couples-border)] hover:ring-[var(--couples-gold)]/40"
      }`}
    >
      {label}
    </button>
  );
}

export function GameDiscussionPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-2xl bg-[var(--couples-ivory)] px-4 py-4 ring-1 ring-[var(--couples-border)]">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--couples-muted)]">{title}</p>
      <div className="mt-2 text-sm leading-relaxed text-[var(--couples-text)]">{children}</div>
    </div>
  );
}

export function triviaAnswerLabel(answer: string) {
  const part = answer.split("—")[0]?.trim() ?? answer;
  return part.length > 72 ? `${part.slice(0, 69)}…` : part;
}

export function buildTriviaOptions(
  card: (typeof BIBLE_TRIVIA)[number],
  pool: (typeof BIBLE_TRIVIA)[number][],
) {
  const correct = triviaAnswerLabel(card.answer);
  const decoys = pool
    .filter((entry) => entry !== card)
    .map((entry) => triviaAnswerLabel(entry.answer))
    .filter((label) => label !== correct);
  const uniqueDecoys = [...new Set(decoys)].slice(0, 3);
  while (uniqueDecoys.length < 2) {
    uniqueDecoys.push(`Reflect on ${card.reference}`);
  }
  const options = shuffleDeck([correct, uniqueDecoys[0], uniqueDecoys[1]]);
  return { options, correct };
}
