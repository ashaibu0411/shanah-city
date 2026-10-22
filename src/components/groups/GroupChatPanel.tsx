"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatComposer, type PendingAttachment } from "@/components/chat/ChatComposer";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import { ChatParticipantsSheet } from "@/components/chat/ChatParticipantsSheet";
import { groupsPremium } from "@/components/groups/groups-premium";
import type { ChatParticipantEntry } from "@/lib/chat-participants-utils";
import { privateMessageHref } from "@/lib/chat-participants-utils";
import type { UserBlock } from "@/lib/block-types";
import type { GroupCategory, GroupChatMessage } from "@/lib/group-types";
import type { ChatReplyDraft } from "@/lib/chat-reply-types";
import { mergeChatMessagesById, type ChatTypingUser } from "@/lib/chat-utils";
import {
  chatDateSeparatorLabelInstagram,
  formatBubbleTime,
  messageGroupMeta,
  senderAccentColor,
  shouldShowDateSeparator,
} from "@/lib/chat-ui-utils";
import { getGroupArtwork } from "@/lib/group-artwork";
import { chatPremium } from "@/components/chat/chat-premium";
import { ChatThreadHeader } from "@/components/chat/ChatThreadHeader";
import { ChatGroupSubnav } from "@/components/chat/ChatGroupSubnav";
import { messagingUi } from "@/lib/messaging-ui";
import { ChatPrivacySheet } from "@/components/chat/ChatPrivacySheet";
import {
  disappearingBannerText,
  type ChatDisappearingSeconds,
} from "@/lib/chat-disappearing";
import { notifyNotificationsChanged } from "@/lib/use-notifications";

function typingLabel(users: ChatTypingUser[]) {
  if (users.length === 0) return "";
  if (users.length === 1) return `${users[0].userName} is typing…`;
  if (users.length === 2) return `${users[0].userName} and ${users[1].userName} are typing…`;
  return `${users[0].userName} and ${users.length - 1} others are typing…`;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M11.78 4.22a.75.75 0 0 1 0 1.06L8.06 9l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M10 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
      />
    </svg>
  );
}

type GroupChatPanelProps = {
  groupId: string;
  groupName: string;
  groupCategory: GroupCategory;
  groupIconUrl?: string;
  groupUpdatedAt?: string;
  userId: string;
  memberCount: number;
  participants: ChatParticipantEntry[];
  onBack?: () => void;
};

export function GroupChatPanel({
  groupId,
  groupName,
  groupCategory,
  groupIconUrl,
  groupUpdatedAt,
  userId,
  memberCount,
  participants,
  onBack,
}: GroupChatPanelProps) {
  const router = useRouter();
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
  const [showParticipants, setShowParticipants] = useState(false);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [disappearingSeconds, setDisappearingSeconds] = useState(0);
  const [replyDraft, setReplyDraft] = useState<ChatReplyDraft | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<GroupChatMessage[]>([]);
  const sendingRef = useRef(false);
  /** When false, the member is reading older messages — do not jump to the latest on poll/updates. */
  const stickToBottomRef = useRef(true);

  const SCROLL_STICK_THRESHOLD_PX = 120;

  function readStickToBottom() {
    const el = scrollContainerRef.current;
    if (!el) return true;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceFromBottom <= SCROLL_STICK_THRESHOLD_PX;
  }

  function syncStickToBottomFromScroll() {
    stickToBottomRef.current = readStickToBottom();
  }

  function scrollMessagesToBottom(behavior: ScrollBehavior = "smooth") {
    const el = scrollContainerRef.current;
    if (!el) {
      bottomRef.current?.scrollIntoView({ behavior });
      return;
    }
    el.scrollTo({ top: el.scrollHeight, behavior });
  }
  const mentionMembers = useMemo(
    () =>
      participants
        .filter((participant) => participant.id !== userId)
        .map((participant) => ({ id: participant.id, name: participant.name })),
    [participants, userId],
  );
  const artworkUrl = getGroupArtwork(
    {
      id: groupId,
      name: groupName,
      category: groupCategory,
      iconUrl: groupIconUrl,
      updatedAt: groupUpdatedAt,
    },
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
    setDisappearingSeconds(data.disappearingSeconds ?? 0);
    setMessages((current) => {
      const incoming = (data.messages ?? []) as GroupChatMessage[];
      if (options?.after && current.length > 0) {
        return mergeChatMessagesById(current, incoming);
      }
      return incoming;
    });
    setStatus("");
    notifyNotificationsChanged();
  }

  useEffect(() => {
    stickToBottomRef.current = true;
    loadMessages();
    loadBlocks();
  }, [groupId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    scrollMessagesToBottom(loading ? "auto" : "smooth");
  }, [messages, typingUsers, loading]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const list = messagesRef.current;
      const last = list[list.length - 1];
      void loadMessages({ after: last?.createdAt, quiet: true });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [groupId]);

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
    if (sendingRef.current || busy) return;
    if (!draft.trim() && !attachment) return;
    sendingRef.current = true;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/groups/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          content: draft.trim(),
          attachmentUrl: attachment?.attachmentUrl,
          attachmentType: attachment?.attachmentType,
          attachmentName: attachment?.attachmentName,
          replyToMessageId: replyDraft?.messageId,
          replyExcerpt: replyDraft?.excerpt,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error ?? "Could not send message.");
        return;
      }

      setDraft("");
      setReplyDraft(null);
      stickToBottomRef.current = true;
      setMessages((current) => mergeChatMessagesById(current, [data.message]));
      notifyNotificationsChanged();
    } finally {
      sendingRef.current = false;
      setBusy(false);
    }
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

  async function applyDisappearing(seconds: ChatDisappearingSeconds) {
    setPrivacyBusy(true);
    setStatus("");
    const response = await fetch("/api/groups/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setDisappearing", groupId, disappearingSeconds: seconds }),
    });
    const data = await response.json();
    setPrivacyBusy(false);
    if (!response.ok) {
      setStatus(data.error ?? "Could not update timer.");
      return;
    }
    setDisappearingSeconds(data.disappearingSeconds ?? seconds);
  }

  async function clearGroupChatHistory() {
    setPrivacyBusy(true);
    setStatus("");
    const response = await fetch("/api/groups/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clearChat", groupId }),
    });
    const data = await response.json();
    setPrivacyBusy(false);
    if (!response.ok) {
      setStatus(data.error ?? "Could not clear chat.");
      return;
    }
    setMessages([]);
    setReplyDraft(null);
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
    <div className={`${messagingUi.shell} ${groupsPremium.chatPanel} flex min-h-0 flex-1 flex-col`}>
      <ChatThreadHeader
        title={groupName}
        subtitle={subtitle}
        onBack={onBack}
        onAvatarClick={() => setShowParticipants(true)}
        avatar={
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={artworkUrl} alt="" className="h-full w-full object-cover" />
          </>
        }
        menu={
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((value) => !value)}
              className={messagingUi.threadHeaderAction}
              aria-label="Group chat options"
            >
              <MenuIcon />
            </button>
            {showMenu ? (
              <div className={`${groupsPremium.chatMenu} right-0 top-full mt-1`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowPrivacySheet(true);
                  }}
                  className={groupsPremium.chatMenuItem}
                >
                  Chat settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowParticipants(true);
                  }}
                  className={groupsPremium.chatMenuItem}
                >
                  View participants
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setReportTarget(null);
                    setReportReason("");
                    setStatus("Long-press a message for report, block, or delete.");
                  }}
                  className={groupsPremium.chatMenuItem}
                >
                  Safety tips
                </button>
              </div>
            ) : null}
          </div>
        }
      />
      <ChatGroupSubnav
        groupId={groupId}
        active="chat"
        onMembers={() => setShowParticipants(true)}
      />

      {reportTarget ? (
        <div className="shrink-0 border-b border-red-100 bg-red-50/90 px-4 py-3">
          <p className="text-sm font-semibold text-red-900">Report {reportTarget.senderName}</p>
          <textarea
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            rows={2}
            placeholder="Describe what happened (required)..."
            className="mt-2 w-full rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
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
              className="text-sm font-semibold text-night-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {status ? <div className={groupsPremium.chatStatusBanner}>{status}</div> : null}

      {disappearingBannerText(disappearingSeconds) ? (
        <p className="messages-hub-system-notice shrink-0 border-b border-black/5 px-4 py-3 dark:border-white/10">
          {disappearingBannerText(disappearingSeconds)}
        </p>
      ) : null}

      <div
        ref={scrollContainerRef}
        className={messagingUi.wallpaper}
        onScroll={syncStickToBottomFromScroll}
      >
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-night-500">Loading messages…</p>
        ) : messages.length === 0 ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center">
            <div className={chatPremium.emptyCard}>
              <span className={`${groupsPremium.iconTile} mx-auto h-16 w-16 rounded-2xl`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artworkUrl} alt="" className={groupsPremium.iconTileImage} />
              </span>
              <p className={`${groupsPremium.cardTitle} mt-4`}>{groupName}</p>
              <p className={`${groupsPremium.cardMeta} mt-2`}>
                Messages are visible to group members. Say hello to start the conversation.
              </p>
            </div>
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
                  <div className="my-4 flex justify-center px-4">
                    <span className="messages-hub-date-stamp">
                      {chatDateSeparatorLabelInstagram(message.createdAt)}
                    </span>
                  </div>
                ) : null}
                <div className={group.isFirst ? "pt-1" : "pt-0.5"}>
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
                    onToggleReaction={(emoji) => toggleReaction(message.id, emoji)}
                    onStartReply={setReplyDraft}
                    attachmentUrl={message.attachmentUrl}
                    attachmentType={message.attachmentType}
                    attachmentName={message.attachmentName}
                    editedAt={message.editedAt}
                    deletedAt={message.deletedAt}
                    seenCount={message.seenCount}
                    showSeenCount={mine && group.isLast}
                    showMeta={group.showMeta}
                    density="messaging"
                    canEdit={message.senderId === userId}
                    canDelete={message.senderId === userId}
                    canReport={message.senderId !== userId}
                    canBlock={message.senderId !== userId}
                    isBlocked={blockedIds.has(message.senderId)}
                    onEdit={(content) => editMessage(message.id, content)}
                    onDelete={() => deleteMessage(message.id)}
                    onReport={() => setReportTarget(message)}
                    onBlock={() => blockMember(message)}
                    canMessagePrivately={!mine && message.senderId !== userId}
                    groupId={groupId}
                    onMessagePrivately={() =>
                      router.push(privateMessageHref(message.senderId, message.senderName))
                    }
                  />
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className={messagingUi.composerBar}>
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={sendMessage}
          busy={busy}
          placeholder={
            replyDraft
              ? "Write a reply…"
              : disappearingSeconds > 0
                ? "Disappearing message…"
                : "Message"
          }
          onTyping={sendTyping}
          onPickAttachment={uploadAttachment}
          attachmentBusy={attachmentBusy}
          density="messaging"
          vanishMode={disappearingSeconds > 0}
          replyDraft={replyDraft}
          onClearReply={() => setReplyDraft(null)}
          mentionMembers={mentionMembers}
          mentionAllowAll
        />
      </div>

      <ChatParticipantsSheet
        open={showParticipants}
        onClose={() => setShowParticipants(false)}
        title={groupName}
        participants={participants}
        currentUserId={userId}
      />

      <ChatPrivacySheet
        open={showPrivacySheet}
        onClose={() => setShowPrivacySheet(false)}
        title={groupName}
        disappearingSeconds={disappearingSeconds}
        onSetDisappearing={applyDisappearing}
        onClearChat={clearGroupChatHistory}
        busy={privacyBusy}
      />
    </div>
  );
}
