"use client";

import {
  CHAT_DISAPPEARING_OPTIONS,
  disappearingBannerText,
  disappearingTimerLabel,
  type ChatDisappearingSeconds,
} from "@/lib/chat-disappearing";
import { chatPremium } from "@/components/chat/chat-premium";

type ChatPrivacySheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  disappearingSeconds: number;
  onSetDisappearing: (seconds: ChatDisappearingSeconds) => void | Promise<void>;
  onClearChat: () => void | Promise<void>;
  busy?: boolean;
};

export function ChatPrivacySheet({
  open,
  onClose,
  title,
  disappearingSeconds,
  onSetDisappearing,
  onClearChat,
  busy = false,
}: ChatPrivacySheetProps) {
  if (!open) return null;

  const banner = disappearingBannerText(disappearingSeconds);

  async function handleClear() {
    if (
      !window.confirm(
        "Clear all messages in this chat for everyone? This cannot be undone.",
      )
    ) {
      return;
    }
    await onClearChat();
    onClose();
  }

  return (
    <>
      <button
        type="button"
        className={chatPremium.sheetBackdrop}
        aria-label="Close chat settings"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="chat-privacy-title"
        className={`${chatPremium.sheetPanel} max-h-[min(85dvh,520px)]`}
      >
        <div className={chatPremium.sheetHeader}>
          <div className="min-w-0 flex-1">
            <p id="chat-privacy-title" className="font-display text-base font-semibold text-night-950 dark:text-sand-50">
              Chat settings
            </p>
            <p className="truncate text-xs text-night-500 dark:text-sand-400">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={chatPremium.headerIconButton}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-night-500 dark:text-sand-400">
            Disappearing messages
          </p>
          <p className="mt-1 text-xs leading-relaxed text-night-600 dark:text-sand-400">
            Applies to new messages only. Older messages are removed when their timer runs out.
          </p>
          {banner ? (
            <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              {banner}
            </p>
          ) : null}

          <ul className="mt-3 space-y-1">
            {CHAT_DISAPPEARING_OPTIONS.map((option) => {
              const active = disappearingSeconds === option.value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSetDisappearing(option.value)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                      active
                        ? "bg-night-950 text-white dark:bg-[var(--color-surface)] dark:ring-1 dark:ring-white/15"
                        : "text-night-800 hover:bg-sand-50 dark:text-sand-100 dark:hover:bg-[var(--color-bg-muted)]"
                    }`}
                  >
                    {option.label}
                    {active ? (
                      <span className="text-xs opacity-80">
                        {option.value === 0 ? "Default" : disappearingTimerLabel(option.value)}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 border-t border-night-900/8 pt-5 dark:border-white/10">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-night-500 dark:text-sand-400">
              Clear chat
            </p>
            <p className="mt-1 text-xs text-night-600 dark:text-sand-400">
              Remove every message in this conversation for all participants.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={handleClear}
              className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
            >
              {busy ? "Working…" : "Clear all messages"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
