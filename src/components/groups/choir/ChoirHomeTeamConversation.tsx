"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import type { ChoirHomeChatContext } from "@/lib/choir-dashboard-types";
import { useGroupChatChannel } from "@/hooks/useGroupChatChannel";
import {
  formatBubbleTime,
  messageGroupMeta,
  senderAccentColor,
} from "@/lib/chat-ui-utils";

const HOME_MESSAGE_LIMIT = 10;
const MESSAGE_AREA_MAX_HEIGHT_PX = 320;

type ChoirHomeTeamConversationProps = {
  chatContext: ChoirHomeChatContext;
  fullConversationHref: string;
  unreadCount: number;
};

function LiveDot({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="choir-home-chat-live" aria-label="Live connection">
      <span className="choir-home-chat-live-dot" aria-hidden />
      Live
    </span>
  );
}

export function ChoirHomeTeamConversation({
  chatContext,
  fullConversationHref,
  unreadCount,
}: ChoirHomeTeamConversationProps) {
  const { groupId, userId, participants } = chatContext;

  const channel = useGroupChatChannel({
    groupId,
    initialLimit: HOME_MESSAGE_LIMIT,
    markReadOnFetch: false,
    pollIntervalMs: 5000,
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const mentionMembers = useMemo(
    () =>
      participants
        .filter((participant) => participant.id !== userId)
        .map((participant) => ({ id: participant.id, name: participant.name })),
    [participants, userId],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || channel.loading) return;
    el.scrollTop = el.scrollHeight;
  }, [channel.messages, channel.loading]);

  const titleSuffix =
    unreadCount > 0 ? (
      <span className="choir-home-chat-unread" aria-label={`${unreadCount} unread messages`}>
        {unreadCount}
      </span>
    ) : null;

  if (channel.permissionDenied) {
    return (
      <section className="choir-home-chat-card choir-card" aria-labelledby="choir-home-chat-heading">
        <h2 id="choir-home-chat-heading" className="choir-section-heading text-base">
          Team conversation
        </h2>
        <p className="mt-3 text-sm text-[var(--choir-muted)]">{channel.status}</p>
      </section>
    );
  }

  return (
    <section className="choir-home-chat-card choir-card overflow-hidden" aria-labelledby="choir-home-chat-heading">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--choir-border)] px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="choir-home-chat-heading" className="choir-section-heading text-base">
              Team conversation
            </h2>
            {titleSuffix}
            <LiveDot active={channel.connected && !channel.loading && !channel.status} />
          </div>
          <p className="mt-0.5 text-xs text-[var(--choir-muted)]">Connect with your worship family.</p>
        </div>
        <Link
          href={fullConversationHref}
          onClick={() => void channel.markRead()}
          className="inline-flex min-h-[44px] shrink-0 items-center text-xs font-bold text-[var(--choir-gold-dark)]"
        >
          Open full conversation →
        </Link>
      </div>

      {channel.status ? (
        <p className="border-b border-[var(--choir-border)] bg-[var(--choir-surface-soft)] px-4 py-2 text-xs text-red-700">
          {channel.status}
          {!channel.loading ? (
            <button
              type="button"
              className="ml-2 font-bold underline"
              onClick={() => void channel.loadMessages({ limit: HOME_MESSAGE_LIMIT })}
            >
              Retry
            </button>
          ) : null}
        </p>
      ) : null}

      <div
        ref={scrollRef}
        className="choir-home-chat-messages px-2 py-2"
        style={{ maxHeight: MESSAGE_AREA_MAX_HEIGHT_PX }}
        aria-live="polite"
        aria-busy={channel.loading}
      >
        {channel.loading ? (
          <p className="px-2 py-6 text-center text-sm text-[var(--choir-muted)]">Loading team conversation…</p>
        ) : channel.messages.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-[var(--choir-muted)]">
            No messages yet. Start the conversation!
          </p>
        ) : (
          channel.messages.map((message, index) => {
            const mine = message.senderId === userId;
            const group = messageGroupMeta(channel.messages, index);

            return (
              <div key={message.id} className={group.isFirst ? "pt-1" : "pt-0.5"}>
                <ChatMessageBubble
                  messageId={message.id}
                  messageSenderId={message.senderId}
                  messageSenderName={message.senderName}
                  mine={mine}
                  senderName={!mine && group.isFirst ? message.senderName : undefined}
                  senderAccent={senderAccentColor(message.senderName)}
                  content={message.content}
                  createdAtLabel={formatBubbleTime(message.createdAt)}
                  reactions={message.reactions}
                  reply={message.reply}
                  currentUserId={userId}
                  onToggleReaction={(emoji) => void channel.toggleReaction(message.id, emoji)}
                  onStartReply={channel.setReplyDraft}
                  attachmentUrl={message.attachmentUrl}
                  attachmentType={message.attachmentType}
                  attachmentName={message.attachmentName}
                  editedAt={message.editedAt}
                  deletedAt={message.deletedAt}
                  seenCount={message.seenCount}
                  showSeenCount={false}
                  showMeta={group.showMeta}
                  density="compact"
                  canEdit={false}
                  canDelete={false}
                  canReport={false}
                  canBlock={false}
                  groupId={groupId}
                />
              </div>
            );
          })
        )}
      </div>

      {channel.messages.length >= HOME_MESSAGE_LIMIT ? (
        <div className="border-t border-[var(--choir-border)] px-4 py-2 text-center">
          <Link
            href={fullConversationHref}
            onClick={() => void channel.markRead()}
            className="text-xs font-bold text-[var(--choir-gold-dark)]"
          >
            View earlier messages in Team Connect →
          </Link>
        </div>
      ) : null}

      <div className="choir-home-chat-composer border-t border-[var(--choir-border)] bg-[var(--choir-surface)] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
        <ChatComposer
          value={channel.draft}
          onChange={channel.setDraft}
          onSend={channel.sendMessage}
          busy={channel.busy}
          placeholder={
            channel.replyDraft ? "Write a reply…" : "Write a message to the team…"
          }
          onTyping={channel.sendTyping}
          onPickAttachment={channel.uploadAttachment}
          attachmentBusy={channel.attachmentBusy}
          density="compact"
          vanishMode={channel.disappearingSeconds > 0}
          replyDraft={channel.replyDraft}
          onClearReply={() => channel.setReplyDraft(null)}
          mentionMembers={mentionMembers}
          mentionAllowAll
        />
      </div>
    </section>
  );
}
