"use client";

import { useEffect, useRef, useState } from "react";
import { ChatComposer, type PendingAttachment } from "@/components/chat/ChatComposer";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import type { UserBlock } from "@/lib/block-types";
import type { GroupChatMessage } from "@/lib/group-types";
import type { ChatTypingUser } from "@/lib/chat-utils";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function typingLabel(users: ChatTypingUser[]) {
  if (users.length === 0) return "";
  if (users.length === 1) return `${users[0].userName} is typing…`;
  if (users.length === 2) return `${users[0].userName} and ${users[1].userName} are typing…`;
  return `${users[0].userName} and ${users.length - 1} others are typing…`;
}

type GroupChatPanelProps = {
  groupId: string;
  groupName: string;
  userId: string;
  memberCount: number;
};

export function GroupChatPanel({
  groupId,
  groupName,
  userId,
  memberCount,
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
  const bottomRef = useRef<HTMLDivElement | null>(null);

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
    setBlocks(data.block ? [...blocks.filter((b) => b.blockedUserId !== target.senderId), data.block] : blocks);
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

  return (
    <div className="mt-6 rounded-2xl border border-night-900/5 bg-white">
      <div className="border-b border-night-900/5 px-4 py-3">
        <h3 className="font-display text-lg font-semibold text-night-900">Group chat</h3>
        <p className="mt-1 text-sm text-night-600">
          Messages here are visible to all {memberCount} members of {groupName}. You can react,
          send photos, edit or delete your messages, and report or block anyone who harasses you.
        </p>
        {typingText && (
          <p className="mt-2 text-xs font-medium text-violet-700">{typingText}</p>
        )}
      </div>

      {reportTarget && (
        <div className="border-b border-red-100 bg-red-50/60 px-4 py-4">
          <p className="text-sm font-semibold text-red-900">
            Report {reportTarget.senderName}
          </p>
          <textarea
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            rows={3}
            placeholder="Describe what happened (required)..."
            className="mt-3 w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none"
          />
          <div className="mt-3 flex gap-2">
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
      )}

      <div className="max-h-[420px] space-y-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-sm text-night-500">Loading chat…</p>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                mine={message.senderId === userId}
                senderName={message.senderName}
                content={message.content}
                createdAtLabel={formatTime(message.createdAt)}
                reactions={message.reactions}
                currentUserId={userId}
                onToggleReaction={(emoji) => toggleReaction(message.id, emoji)}
                attachmentUrl={message.attachmentUrl}
                editedAt={message.editedAt}
                deletedAt={message.deletedAt}
                seenCount={message.seenCount}
                showSeenCount
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
            ))}
            {messages.length === 0 && (
              <p className="text-sm text-night-500">
                No messages yet. Say hello to the group below.
              </p>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <div className="border-t border-night-900/5 px-4 py-4">
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={sendMessage}
          busy={busy}
          placeholder="Message the group…"
          onTyping={sendTyping}
          onPickAttachment={uploadAttachment}
          attachmentBusy={attachmentBusy}
        />
        {status && (
          <p
            className={`mt-2 text-sm ${
              status.includes("blocked") || status.includes("Report")
                ? "text-emerald-700"
                : "text-red-600"
            }`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
