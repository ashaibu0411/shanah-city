"use client";

import type { ChatReplyDraft } from "@/lib/chat-reply-types";
import { chatPremium } from "@/components/chat/chat-premium";

type ChatReplyComposerBannerProps = {
  reply: ChatReplyDraft;
  onClear: () => void;
};

export function ChatReplyComposerBanner({ reply, onClear }: ChatReplyComposerBannerProps) {
  return (
    <div className={`${chatPremium.replyBanner} mb-2 flex items-start gap-2`}>
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
