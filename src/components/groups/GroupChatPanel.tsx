"use client";

import { useEffect, useRef, useState } from "react";
import { ChatComposer, type PendingAttachment } from "@/components/chat/ChatComposer";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import type { UserBlock } from "@/lib/block-types";
import type { GroupCategory, GroupChatMessage } from "@/lib/group-types";
import type { ChatTypingUser } from "@/lib/chat-utils";
import {
  chatDateSeparatorLabel,
  formatBubbleTime,
  messageGroupMeta,
  senderAccentColor,
  shouldShowDateSeparator,
} from "@/lib/chat-ui-utils";
import { getGroupArtwork } from "@/lib/group-artwork";
import { notifyNotificationsChanged } from "@/lib/use-notifications";

function typingLabel(users: ChatTypingUser[]) {
  if (users.length === 0) return "";
  if (users.length === 1) return `${users[0].userName} is typing…`;
  if (users.length === 2) return `${users[0].userName} and ${users[1].userName} are typing…`;
  return `${users[0].userName} and ${users.length - 1} others are typing…`;
}

function BackChevron({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10"
      aria-label={label}
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

type GroupChatPanelProps = {
  groupId: string;
  groupName: string;
  groupCategory: GroupCategory;
  userId: string;
  memberCount: number;
  onBack?: () => void;
};

export function GroupChatPanel({
  groupId,
  groupName,
  groupCategory,
  userId,
  memberCount,
  onBack,
}: GroupChatPanelProps) {
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<ChatTypingUser[]>([]);
  const [blocks, setBlocks] = useState<UserBlock[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [reportTarget, setReportTarget] = useState<GroupChatMessage | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const artworkUrl = getGroupArtwork(
    { id: groupId, name: groupName, category: groupCategory },
    "square",
  );

  async function loadBlocks() {
    const response = await fetch("/api/messages/block");
    const data = await response.json();
    if (response.ok) {
      setBlocks(data.blocks ?? []);
    }
  }

  async function loadMessages(options?: { after?: string; quiet?: boolean }) {
    if (!options?.quiet) setLoading(true);
    const params = new URLSearchParams({ groupId });
    if (options?.after) params.set("after", options.after);
    const response = await fetch(`/api/groups/chat?${params.toString()}`);
    const data = await response.json();
    if (!options?.quiet) setLoading(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not load group chat.");
      return;
    }

    setTypingUsers(data.typingUsers ?? []);
    setMessages((current) => {
      if (options?.after && current.length > 0) {
        const seen = new Set(current.map((message) => message.id));
        const appended = (data.messages ?? []).filter(
          (message: GroupChatMessage) => !seen.has(message.id),
        );
        if (appended.length === 0) {
          return current.map((message) => {
            const fresh = (data.messages ?? []).find(
              (entry: GroupChatMessage) => entry.id === message.id,
            );
            return fresh ?? message;
          });
        }
        return [...current, ...appended];
      }
      return data.messages ?? [];
    });
    setStatus("");
    notifyNotificationsChanged();
  }

  useEffect(() => {
    loadMessages();
    loadBlocks();
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const last = messages[messages.length - 1];
      loadMessages({ after: last?.createdAt, quiet: true });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [groupId, messages]);

  async function uploadAttachment(file: File): Promise<PendingAttachment | null> {
    setAttachmentBusy(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("groupId", groupId);
    const response = await fetch("/api/chat/attachment", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setAttachmentBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not upload image.");
      return null;
    }

    return {
      attachmentUrl: data.attachmentUrl,
      attachmentType: data.attachmentType,
      attachmentName: data.attachmentName,
      previewUrl: `/api/chat/attachment?id=${encodeURIComponent(data.attachmentUrl.slice("chat:".length))}`,
    };
  }

  async function sendMessage(attachment?: PendingAttachment) {
    if (!draft.trim() && !attachment) return;
    setBusy(true);
    setStatus("");
    const response = await fetch("/api/groups/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId,
        content: draft.trim(),
        attachmentUrl: attachment?.attachmentUrl,
        attachmentType: attachment?.attachmentType,
        attachmentName: attachment?.attachmentName,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not send message.");
      return;
    }

    setDraft("");
    setMessages((current) => [...current, data.message]);
  }

  async function sendTyping(isTyping: boolean) {
    await fetch("/api/groups/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "typing", groupId, isTyping }),
    });
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const response = await fetch("/api/groups/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "react", groupId, messageId, emoji }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessages((current) =>
        current.map((message) => (message.id === messageId ? data.message : message)),
      );
    }
  }

  async function editMessage(messageId: string, content: string) {
    const response = await fetch("/api/groups/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit", groupId, messageId, content }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Could not edit message.");
      return;
    }
    setMessages((current) =>
      current.map((message) => (message.id === messageId ? data.message : message)),
    );
  }

  async function deleteMessage(messageId: string) {
    const response = await fetch("/api/groups/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", groupId, messageId }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Could not delete message.");
      return;
    }
    setMessages((current) =>
      current.map((message) => (message.id === messageId ? data.message : message)),
    );
  }

  async function blockMember(target: GroupChatMessage) {
    if (
      !window.confirm(
        `Block ${target.senderName}? Their group messages will be hidden and they cannot message you privately.`,
      )
    ) {
      return;
    }

    const response = await fetch("/api/messages/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "block",
        userId: target.senderId,
        userName: target.senderName,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Could not block member.");
      return;
    }
    setBlocks(
      data.block
        ? [...blocks.filter((b) => b.blockedUserId !== target.senderId), data.block]
        : blocks,
    );
    setStatus(`${target.senderName} has been blocked.`);
    await loadMessages({ quiet: true });
  }

  async function submitReport() {
    if (!reportTarget) return;
    setBusy(true);
    const response = await fetch("/api/messages/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: reportTarget.senderId,
        userName: reportTarget.senderName,
        groupId,
        messageId: reportTarget.id,
        reason: reportReason.trim(),
        alsoBlock: true,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not submit report.");
      return;
    }

    setReportTarget(null);
    setReportReason("");
    setStatus(`Report sent. ${reportTarget.senderName} has been blocked.`);
    await loadBlocks();
    await loadMessages({ quiet: true });
  }

  const blockedIds = new Set(blocks.map((block) => block.blockedUserId));
  const typingText = typingLabel(typingUsers);
  const subtitle = typingText || `${memberCount} participant${memberCount === 1 ? "" : "s"}`;

  return (
    <div className="group-chat-whatsapp fixed inset-0 z-50 flex min-w-0 flex-col bg-[#efeae2] lg:relative lg:inset-auto lg:z-auto lg:min-h-[min(720px,calc(100dvh-10rem))] lg:overflow-hidden lg:rounded-2xl lg:shadow-app-lg">
      <header className="flex shrink-0 items-center gap-1 bg-[#008069] px-1 py-1.5 pt-[max(0.35rem,env(safe-area-inset-top))] text-white shadow-sm">
        {onBack ? <BackChevron label="Back to group" onClick={onBack} /> : null}
        <div className="flex min-w-0 flex-1 items-center gap-3 px-1">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={artworkUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[16px] font-semibold leading-tight">{groupName}</h1>
            <p className="truncate text-[12px] text-white/85">{subtitle}</p>
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowMenu((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl hover:bg-white/10"
            aria-label="Group chat options"
          >
            ⋮
          </button>
          {showMenu ? (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl bg-white py-1 text-[#111b21] shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setReportTarget(null);
                  setReportReason("");
                  setStatus("Tap ••• on a message to report or block a member.");
                }}
                className="block w-full px-4 py-2.5 text-left text-sm hover:bg-[#f0f2f5]"
              >
                Safety tips
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {reportTarget ? (
        <div className="shrink-0 border-b border-red-100 bg-red-50/90 px-4 py-3">
          <p className="text-sm font-semibold text-red-900">Report {reportTarget.senderName}</p>
          <textarea
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            rows={2}
            placeholder="Describe what happened (required)..."
            className="mt-2 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={busy || reportReason.trim().length < 8}
              onClick={submitReport}
              className="rounded-full bg-red-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Send report & block
            </button>
            <button
              type="button"
              onClick={() => {
                setReportTarget(null);
                setReportReason("");
              }}
              className="text-sm font-semibold text-[#667781]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {status ? (
        <div className="shrink-0 bg-[#d1f4cc] px-4 py-2 text-center text-xs text-[#111b21]">
          {status}
        </div>
      ) : null}

      <div className="group-chat-wallpaper min-h-0 flex-1 overflow-y-auto py-2">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-[#667781]">Loading messages…</p>
        ) : messages.length === 0 ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#008069] text-2xl font-semibold text-white ring-4 ring-white/80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={artworkUrl} alt="" className="h-full w-full object-cover" />
            </div>
            <p className="mt-4 text-lg font-semibold text-[#111b21]">{groupName}</p>
            <p className="mt-1 text-sm text-[#667781]">
              Messages and calls are end-to-end visible to group members. Say hello to start the
              conversation.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const mine = message.senderId === userId;
            const group = messageGroupMeta(messages, index);
            const previous = messages[index - 1];
            const showDate = shouldShowDateSeparator(previous?.createdAt, message.createdAt);

            return (
              <div key={message.id}>
                {showDate ? (
                  <div className="my-3 flex justify-center px-4">
                    <span className="rounded-lg bg-[#ffffffd9] px-3 py-1 text-[12px] font-medium text-[#54656f] shadow-sm">
                      {chatDateSeparatorLabel(message.createdAt)}
                    </span>
                  </div>
                ) : null}
                <div className={group.isFirst ? "pt-1" : "pt-0.5"}>
                  <ChatMessageBubble
                    mine={mine}
                    senderName={!mine && group.isFirst ? message.senderName : undefined}
                    senderAccent={senderAccentColor(message.senderName)}
                    content={message.content}
                    createdAtLabel={formatBubbleTime(message.createdAt)}
                    reactions={message.reactions}
                    currentUserId={userId}
                    onToggleReaction={(emoji) => toggleReaction(message.id, emoji)}
                    attachmentUrl={message.attachmentUrl}
                    editedAt={message.editedAt}
                    deletedAt={message.deletedAt}
                    seenCount={message.seenCount}
                    showSeenCount={mine && group.isLast}
                    showMeta={group.showMeta}
                    density="whatsapp"
                    canEdit={message.senderId === userId}
                    canDelete={message.senderId === userId}
                    canReport={message.senderId !== userId}
                    canBlock={message.senderId !== userId}
                    isBlocked={blockedIds.has(message.senderId)}
                    onEdit={(content) => editMessage(message.id, content)}
                    onDelete={() => deleteMessage(message.id)}
                    onReport={() => setReportTarget(message)}
                    onBlock={() => blockMember(message)}
                  />
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0">
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={sendMessage}
          busy={busy}
          placeholder="Message"
          onTyping={sendTyping}
          onPickAttachment={uploadAttachment}
          attachmentBusy={attachmentBusy}
          density="whatsapp"
        />
      </div>
    </div>
  );
}
