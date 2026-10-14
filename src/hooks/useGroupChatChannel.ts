"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PendingAttachment } from "@/components/chat/ChatComposer";
import type { GroupChatMessage } from "@/lib/group-types";
import type { ChatReplyDraft } from "@/lib/chat-reply-types";
import { mergeChatMessagesById, type ChatTypingUser } from "@/lib/chat-utils";
import { notifyNotificationsChanged } from "@/lib/use-notifications";

export type UseGroupChatChannelOptions = {
  groupId: string;
  /** Max messages on initial load (omit for full history window). */
  initialLimit?: number;
  /** When false, GET requests do not mark the thread read (homepage embed). */
  markReadOnFetch?: boolean;
  pollIntervalMs?: number;
  enabled?: boolean;
};

export function useGroupChatChannel({
  groupId,
  initialLimit = 100,
  markReadOnFetch = true,
  pollIntervalMs = 5000,
  enabled = true,
}: UseGroupChatChannelOptions) {
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<ChatTypingUser[]>([]);
  const [disappearingSeconds, setDisappearingSeconds] = useState(0);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [replyDraft, setReplyDraft] = useState<ChatReplyDraft | null>(null);
  const [connected, setConnected] = useState(true);

  const messagesRef = useRef<GroupChatMessage[]>([]);
  const sendingRef = useRef(false);

  const fetchParams = useCallback(
    (options?: { after?: string; quiet?: boolean; limit?: number }) => {
      const params = new URLSearchParams({ groupId });
      if (options?.after) params.set("after", options.after);
      if (options?.limit) params.set("limit", String(options.limit));
      if (!markReadOnFetch) params.set("markRead", "0");
      return params;
    },
    [groupId, markReadOnFetch],
  );

  const loadMessages = useCallback(
    async (options?: { after?: string; quiet?: boolean; limit?: number }) => {
      if (!enabled) return;
      if (!options?.quiet) setLoading(true);
      try {
        const response = await fetch(`/api/groups/chat?${fetchParams(options).toString()}`, {
          credentials: "include",
        });
        const data = await response.json();
        if (!options?.quiet) setLoading(false);

        if (response.status === 403) {
          setPermissionDenied(true);
          setStatus("You don't currently have access to this conversation.");
          setConnected(false);
          return;
        }

        if (!response.ok) {
          setStatus(data.error ?? "Unable to load the team conversation.");
          setConnected(false);
          return;
        }

        setPermissionDenied(false);
        setConnected(typeof navigator !== "undefined" ? navigator.onLine : true);
        setTypingUsers(data.typingUsers ?? []);
        setDisappearingSeconds(data.disappearingSeconds ?? 0);
        setMessages((current) => {
          const incoming = (data.messages ?? []) as GroupChatMessage[];
          let next: GroupChatMessage[];
          if (options?.after && current.length > 0) {
            next = mergeChatMessagesById(current, incoming);
          } else {
            next = incoming;
          }
          if (initialLimit > 0 && initialLimit < 100) {
            return next.slice(-initialLimit);
          }
          return next;
        });
        setStatus("");
        notifyNotificationsChanged();
      } catch {
        if (!options?.quiet) setLoading(false);
        setStatus("Unable to load the team conversation.");
        setConnected(false);
      }
    },
    [enabled, fetchParams],
  );

  useEffect(() => {
    if (!enabled) return;
    void loadMessages({ limit: initialLimit });
  }, [enabled, groupId, initialLimit, loadMessages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!enabled || pollIntervalMs <= 0) return;
    const timer = window.setInterval(() => {
      const list = messagesRef.current;
      const last = list[list.length - 1];
      void loadMessages({ after: last?.createdAt, quiet: true });
    }, pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, groupId, loadMessages, pollIntervalMs]);

  useEffect(() => {
    function onOnline() {
      setConnected(true);
    }
    function onOffline() {
      setConnected(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const markRead = useCallback(async () => {
    await fetch("/api/groups/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "markRead", groupId }),
    });
    notifyNotificationsChanged();
  }, [groupId]);

  async function uploadAttachment(file: File): Promise<PendingAttachment | null> {
    setAttachmentBusy(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("groupId", groupId);
    const response = await fetch("/api/chat/attachment", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const data = await response.json();
    setAttachmentBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not upload attachment.");
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
        credentials: "include",
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
        setStatus(data.error ?? "Message couldn't be sent. Try again.");
        return;
      }

      setDraft("");
      setReplyDraft(null);
      setMessages((current) => mergeChatMessagesById(current, [data.message]));
      notifyNotificationsChanged();
      if (!markReadOnFetch) {
        await markRead();
      }
    } finally {
      sendingRef.current = false;
      setBusy(false);
    }
  }

  async function sendTyping(isTyping: boolean) {
    await fetch("/api/groups/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "typing", groupId, isTyping }),
    });
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const response = await fetch("/api/groups/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "react", groupId, messageId, emoji }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessages((current) =>
        current.map((message) => (message.id === messageId ? data.message : message)),
      );
    }
  }

  const displayMessages = useMemo(() => messages, [messages]);

  return {
    messages: displayMessages,
    typingUsers,
    disappearingSeconds,
    draft,
    setDraft,
    busy,
    attachmentBusy,
    status,
    setStatus,
    loading,
    permissionDenied,
    replyDraft,
    setReplyDraft,
    connected,
    loadMessages,
    uploadAttachment,
    sendMessage,
    sendTyping,
    toggleReaction,
    markRead,
  };
}
