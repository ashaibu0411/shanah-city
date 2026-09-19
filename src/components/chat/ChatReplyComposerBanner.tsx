"use client";

import type { ChatReplyDraft } from "@/lib/chat-reply-types";

type ChatReplyComposerBannerProps = {
  reply: ChatReplyDraft;
  onClear: () => void;
};

export function ChatReplyComposerBanner({ reply, onClear }: ChatReplyComposerBannerProps) {
  return (
    <div className="mb-2 flex items-start gap-2 rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2 dark:border-white/10 dark:bg-[var(--color-bg-muted)]">
      <div className="min-w-0 flex-1 border-l-2 border-violet-500 pl-2">
        <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
          Replying to {reply.senderName}
        </p>
        <p className="line-clamp-2 text-xs text-night-600 dark:text-sand-300">{reply.excerpt}</p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-night-500 hover:bg-white dark:text-sand-400 dark:hover:bg-white/5"
        aria-label="Cancel reply"
      >
        ✕
      </button>
    </div>
  );
}
