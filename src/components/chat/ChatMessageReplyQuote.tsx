"use client";

import { scrollToChatMessage } from "@/lib/chat-reply-utils";
import type { ChatMessageReply } from "@/lib/chat-reply-types";
import { chatPremium } from "@/components/chat/chat-premium";

type ChatMessageReplyQuoteProps = {
  reply: ChatMessageReply;
  mine?: boolean;
  compact?: boolean;
};

export function ChatMessageReplyQuote({ reply, mine = false, compact = false }: ChatMessageReplyQuoteProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        scrollToChatMessage(reply.messageId);
      }}
      className={`mb-2 block w-full text-left transition hover:opacity-90 ${
        compact
          ? mine
            ? chatPremium.replyQuoteOut
            : chatPremium.replyQuoteIn
          : `rounded-lg border-l-[3px] px-2.5 py-1.5 ${
              mine
                ? "border-sand-200/80 bg-white/10 text-sand-100"
                : "border-night-400 bg-night-900/5 text-night-700 dark:border-sand-400 dark:bg-white/5 dark:text-sand-200"
            }`
      }`}
    >
      <p className="truncate text-[11px] font-semibold opacity-80">{reply.senderName}</p>
      <p className="line-clamp-3 text-[12px] leading-snug opacity-90">{reply.excerpt}</p>
    </button>
  );
}
