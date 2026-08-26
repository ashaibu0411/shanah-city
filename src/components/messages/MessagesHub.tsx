"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppShell } from "@/components/app/AppShellContext";
import { getCampus } from "@/lib/site";
import type { UserBlock, MessageReport } from "@/lib/block-types";
import type { DirectMessage, MemberDirectoryEntry } from "@/lib/member-types";
import { Button } from "@/components/ui";
import { ChatComposer, type PendingAttachment } from "@/components/chat/ChatComposer";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import type { ChatTypingUser } from "@/lib/chat-utils";
import {
  chatDateSeparatorLabel,
  chatInitials,
  formatBubbleTime,
  messageGroupMeta,
  shouldShowDateSeparator,
} from "@/lib/chat-ui-utils";
import { notifyNotificationsChanged } from "@/lib/use-notifications";

type ThreadSummary = {
  id: string;
  otherName: string;
  otherUserId?: string | null;
  lastMessage: string;
  lastMessageAt: string;
};

function initials(name: string) {
  return chatInitials(name);
}

function formatInboxTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 86_400_000) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  if (diffMs < 604_800_000) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDetailTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MemberAvatar({
  name,
  size = "md",
  ring = false,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  ring?: boolean;
}) {
  const sizeClass =
    size === "sm"
      ? "h-12 w-12 text-sm"
      : size === "lg"
        ? "h-28 w-28 text-3xl"
        : "h-14 w-14 text-base";
  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-[#dfe5e7] font-medium text-[#54656f] ${
        ring ? "ring-4 ring-white/90" : ""
      }`}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

function BackChevron({
  label,
  onClick,
  light = false,
}: {
  label: string;
  onClick: () => void;
  light?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
        light ? "text-white hover:bg-white/10" : "text-night-900 hover:bg-black/5"
      }`}
      aria-label={label}
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function WhatsAppChatHeader({
  title,
  subtitle,
  onBack,
  showBack,
  avatarName,
  menu,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  avatarName?: string;
  menu?: ReactNode;
}) {
  return (
    <header className="flex shrink-0 items-center gap-1 bg-[#008069] px-1 py-1.5 pt-[max(0.35rem,env(safe-area-inset-top))] text-white shadow-sm">
      {showBack && onBack ? <BackChevron label="Back to chats" onClick={onBack} light /> : null}
      <div className="flex min-w-0 flex-1 items-center gap-3 px-1">
        {avatarName ? <MemberAvatar name={avatarName} size="sm" /> : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold leading-tight">{title}</p>
          {subtitle ? (
            <p className="truncate text-[12px] text-white/85">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {menu ? <div className="relative shrink-0">{menu}</div> : null}
    </header>
  );
}

function parseUnreadByThread(items: Array<{ type?: string; href?: string; count?: number }>) {
  const map: Record<string, number> = {};
  for (const item of items) {
    if (item.type !== "direct_message" || !item.href) continue;
    const match = item.href.match(/thread=([^&]+)/);
    if (match?.[1]) {
      map[decodeURIComponent(match[1])] = item.count ?? 1;
    }
  }
  return map;
}

export function MessagesHub() {
  const { user, loading, permissions } = useAuth();
  const { isMobileApp, setMessagesImmersive } = useAppShell();
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadFromUrl = searchParams.get("thread");
  const memberFromUrl = searchParams.get("member");
  const memberNameFromUrl = searchParams.get("name");
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [members, setMembers] = useState<MemberDirectoryEntry[]>([]);
  const [blocks, setBlocks] = useState<UserBlock[]>([]);
  const [reports, setReports] = useState<MessageReport[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [newRecipientId, setNewRecipientId] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [inboxSearch, setInboxSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showSafety, setShowSafety] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [typingUsers, setTypingUsers] = useState<ChatTypingUser[]>([]);
  const [status, setStatus] = useState("");
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [unreadByThread, setUnreadByThread] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isStaff = permissions.canManageAdmin;

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  const activeOtherUserId = activeThread?.otherUserId ?? null;
  const isActiveBlocked = useMemo(
    () => blocks.some((block) => block.blockedUserId === activeOtherUserId),
    [blocks, activeOtherUserId],
  );

  const selectedRecipient = useMemo(
    () => members.find((member) => member.id === newRecipientId) ?? null,
    [members, newRecipientId],
  );

  const matchingMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    if (query.length < 1) return [];

    return members
      .filter((member) => member.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [members, memberSearch]);

  function selectRecipient(member: MemberDirectoryEntry) {
    setNewRecipientId(member.id);
    setMemberSearch(member.name);
  }

  function clearRecipient() {
    setNewRecipientId("");
    setMemberSearch("");
  }

  async function loadBlocks() {
    const response = await fetch("/api/messages/block");
    const data = await response.json();
    if (response.ok) {
      setBlocks(data.blocks ?? []);
      if (data.reports) {
        setReports(data.reports);
      }
    }
  }

  async function loadUnreadCounts() {
    const response = await fetch("/api/notifications");
    const data = await response.json();
    if (response.ok) {
      setUnreadByThread(parseUnreadByThread(data.items ?? []));
    }
  }

  async function loadInbox() {
    const response = await fetch("/api/messages");
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Could not load messages.");
      return;
    }
    setThreads(data.threads ?? []);
    setMembers(data.members ?? []);
    setStatus("");
    notifyNotificationsChanged();
    void loadUnreadCounts();
  }

  async function loadThread(threadId: string, options?: { replace?: boolean }) {
    setActiveThreadId(threadId);
    setShowNew(false);
    setShowReport(false);
    setShowChatMenu(false);
    const params = new URLSearchParams();
    params.set("thread", threadId);
    if (options?.replace) {
      router.replace(`/messages?${params.toString()}`);
    } else {
      router.push(`/messages?${params.toString()}`);
    }
    const response = await fetch(`/api/messages?threadId=${encodeURIComponent(threadId)}`);
    const data = await response.json();
    if (response.ok) {
      setMessages(data.messages ?? []);
      setTypingUsers(data.typingUsers ?? []);
      notifyNotificationsChanged();
    } else {
      setStatus(data.error ?? "Could not load conversation.");
      setMessages([]);
    }
  }

  useEffect(() => {
    if (user) {
      Promise.all([loadInbox(), loadBlocks()]).then(() => {
        if (threadFromUrl) {
          loadThread(threadFromUrl);
          return;
        }
        if (memberFromUrl && memberFromUrl !== user.id) {
          setNewRecipientId(memberFromUrl);
          setShowNew(true);
          setActiveThreadId(null);
          setMessages([]);
          if (memberNameFromUrl) {
            setMemberSearch(decodeURIComponent(memberNameFromUrl));
            setStatus(`Start a private message with ${decodeURIComponent(memberNameFromUrl)}.`);
          }
          return;
        }
        if (searchParams.get("new") === "1") {
          setShowNew(true);
          setActiveThreadId(null);
          setMessages([]);
        }
      });
    }
  }, [user, threadFromUrl, memberFromUrl, memberNameFromUrl, searchParams]);

  const showInbox = !activeThreadId && !showNew;
  const showChatPane = Boolean(activeThread || showNew);
  const immersive = isMobileApp && showChatPane;

  useEffect(() => {
    setMessagesImmersive(immersive);
    if (immersive) {
      document.body.dataset.messagesImmersive = "true";
    } else {
      delete document.body.dataset.messagesImmersive;
    }
    return () => {
      setMessagesImmersive(false);
      delete document.body.dataset.messagesImmersive;
    };
  }, [immersive, setMessagesImmersive]);

  const filteredThreads = useMemo(() => {
    const query = inboxSearch.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter(
      (thread) =>
        thread.otherName.toLowerCase().includes(query) ||
        thread.lastMessage.toLowerCase().includes(query),
    );
  }, [inboxSearch, threads]);

  useEffect(() => {
    if (!activeThreadId || showNew) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(
        `/api/messages?threadId=${encodeURIComponent(activeThreadId)}`,
      );
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages ?? []);
        setTypingUsers(data.typingUsers ?? []);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeThreadId, showNew]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  async function uploadAttachment(
    file: File,
    options?: { threadId?: string },
  ): Promise<PendingAttachment | null> {
    setAttachmentBusy(true);
    const formData = new FormData();
    formData.append("file", file);
    if (options?.threadId) {
      formData.append("threadId", options.threadId);
    }
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

  async function blockMember(userId: string, userName: string) {
    if (!window.confirm(`Block ${userName}? They will not be able to message you.`)) {
      return;
    }

    setBusy(true);
    setStatus("");
    const response = await fetch("/api/messages/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "block",
        userId,
        userName,
        threadId: activeThreadId ?? undefined,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not block member.");
      return;
    }

    setBlocks(data.block ? [...blocks.filter((b) => b.blockedUserId !== userId), data.block] : blocks);
    setStatus(`${userName} has been blocked.`);
    await loadInbox();
    if (activeThreadId) {
      await loadThread(activeThreadId);
    }
  }

  async function unblockMember(userId: string, userName: string) {
    setBusy(true);
    setStatus("");
    const response = await fetch("/api/messages/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "unblock",
        userId,
        userName,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not unblock member.");
      return;
    }

    setBlocks(data.blocks ?? []);
    setStatus(`${userName} has been unblocked.`);
    await loadInbox();
  }

  async function submitReport() {
    if (!activeOtherUserId || !activeThread) return;

    setBusy(true);
    setStatus("");
    const response = await fetch("/api/messages/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: activeOtherUserId,
        userName: activeThread.otherName,
        threadId: activeThreadId ?? undefined,
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

    setShowReport(false);
    setReportReason("");
    setStatus(
      "Report sent to church leaders. This member has been blocked from messaging you.",
    );
    await loadBlocks();
    await loadInbox();
    if (activeThreadId) {
      await loadThread(activeThreadId);
    }
  }

  async function sendMessage(
    options?: { recipientId?: string; recipientName?: string },
    attachment?: PendingAttachment,
  ) {
    if (!draft.trim() && !attachment) return;
    setBusy(true);
    setStatus("");

    const recipient = members.find((member) => member.id === (options?.recipientId ?? newRecipientId));
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: draft.trim(),
        threadId: activeThreadId ?? undefined,
        recipientId: options?.recipientId ?? recipient?.id ?? newRecipientId,
        recipientName: options?.recipientName ?? recipient?.name ?? "Member",
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
    setShowNew(false);
    setNewRecipientId("");
    setMemberSearch("");
    await loadInbox();
    await loadThread(data.thread.id);
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!activeThreadId) return;
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "react",
        threadId: activeThreadId,
        messageId,
        emoji,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessages((current) =>
        current.map((message) => (message.id === messageId ? data.message : message)),
      );
    }
  }

  async function sendTyping(isTyping: boolean) {
    if (!activeThreadId) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "typing",
        threadId: activeThreadId,
        isTyping,
      }),
    });
  }

  async function editMessage(messageId: string, content: string) {
    if (!activeThreadId) return;
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "edit",
        threadId: activeThreadId,
        messageId,
        content,
      }),
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
    if (!activeThreadId) return;
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        threadId: activeThreadId,
        messageId,
      }),
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

  function typingLabel(users: ChatTypingUser[]) {
    if (users.length === 0) return "";
    if (users.length === 1) return `${users[0].userName} is typing…`;
    return `${users[0].userName} is typing…`;
  }

  function closeChatView() {
    setActiveThreadId(null);
    setShowNew(false);
    setShowReport(false);
    setShowChatMenu(false);
    setMessages([]);
    setNewRecipientId("");
    setMemberSearch("");
    router.push("/messages");
  }

  function openNewMessage() {
    setShowNew(true);
    setActiveThreadId(null);
    setShowChatMenu(false);
    setMessages([]);
    setNewRecipientId("");
    setMemberSearch("");
    router.push("/messages?new=1");
  }

  const statusTone =
    status.includes("blocked") ||
    status.includes("Report") ||
    status.includes("unblocked")
      ? "success"
      : status
        ? "error"
        : null;

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-5rem)] items-center justify-center rounded-2xl border border-night-900/8 bg-white">
        <p className="text-sm text-night-500">Loading messages…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-night-900/8 bg-white px-6 py-10 text-center">
        <h2 className="font-display text-xl font-semibold text-night-900">
          Sign in to message members
        </h2>
        <p className="mt-2 text-sm text-night-600">
          Connect privately with other Shanah City members after you create an account.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button href="/sign-in">Sign in</Button>
          <Button href="/sign-up" variant="secondary">
            Create account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`messages-hub-root flex overflow-hidden bg-[#f0f2f5] ${
        immersive
          ? "h-[100dvh]"
          : isMobileApp
            ? "h-[calc(100dvh-3.5rem)]"
            : "h-[calc(100dvh-5rem)] rounded-2xl border border-night-900/8 shadow-sm md:h-[calc(100dvh-11rem)]"
      }`}
    >
      <aside
        className={`flex w-full shrink-0 flex-col border-[#d1d7db] bg-white lg:w-[min(100%,390px)] lg:border-r ${
          showInbox ? "flex" : "hidden lg:flex"
        }`}
      >
        <div className="bg-[#008069] px-4 pb-3 pt-[max(0.65rem,env(safe-area-inset-top))] text-white">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[22px] font-semibold tracking-tight">Chats</h2>
            <div className="flex items-center gap-1">
              {!isMobileApp ? (
                <button
                  type="button"
                  onClick={() => setShowSafety((value) => !value)}
                  className="rounded-full px-2 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
                >
                  Safety
                </button>
              ) : null}
              <button
                type="button"
                onClick={openNewMessage}
                className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-white hover:bg-white/10"
                aria-label="New message"
              >
                ✎
              </button>
            </div>
          </div>
          <div className="relative mt-3">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#54656f]">
              ⌕
            </span>
            <input
              type="search"
              value={inboxSearch}
              onChange={(event) => setInboxSearch(event.target.value)}
              placeholder="Search or start new chat"
              className="w-full rounded-lg bg-white py-2 pl-9 pr-3 text-sm text-[#111b21] outline-none placeholder:text-[#667781] focus:ring-2 focus:ring-[#00a884]/30"
            />
          </div>
        </div>

        {showSafety && (
          <div className="border-b border-night-900/8 bg-sand-50/80 px-4 py-3">
            <p className="text-[11px] text-night-500">
              Block someone to stop messages. Report harassment for church leaders to review.
            </p>
            {blocks.length === 0 ? (
              <p className="mt-2 text-xs text-night-600">No blocked members.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-night-900">
                        {block.blockedUserName}
                      </p>
                      <p className="text-[10px] text-night-500">
                        Blocked {formatDetailTime(block.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => unblockMember(block.blockedUserId, block.blockedUserName)}
                      disabled={busy}
                      className="shrink-0 text-xs font-semibold text-[#00a884]"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
            {isStaff && reports.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                  Open reports ({reports.length})
                </p>
                <div className="mt-1.5 space-y-1.5">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="text-[11px] text-amber-950">
                      <p className="font-semibold">
                        {report.reportedUserName} · {report.reporterName}
                      </p>
                      <p className="opacity-80">{report.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="text-sm font-medium text-night-900">No messages yet</p>
              <p className="mt-1 text-xs text-night-500">
                Tap the pencil to start a conversation.
              </p>
              <button
                type="button"
                onClick={openNewMessage}
                className="mt-4 rounded-full bg-[#00a884] px-4 py-2 text-xs font-semibold text-white"
              >
                New message
              </button>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const active = activeThreadId === thread.id;
              const unread = unreadByThread[thread.id] ?? 0;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => loadThread(thread.id)}
                  className={`flex w-full items-center gap-3 border-b border-[#e9edef] px-4 py-3 text-left transition hover:bg-[#f5f6f6] ${
                    active ? "bg-[#f0f2f5]" : "bg-white"
                  }`}
                >
                  <MemberAvatar name={thread.otherName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-[17px] text-[#111b21] ${
                          unread > 0 ? "font-semibold" : "font-normal"
                        }`}
                      >
                        {thread.otherName}
                      </p>
                      <span
                        className={`shrink-0 text-xs ${
                          unread > 0 ? "font-medium text-[#25d366]" : "text-[#667781]"
                        }`}
                      >
                        {formatInboxTime(thread.lastMessageAt)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p
                        className={`min-w-0 flex-1 truncate text-sm ${
                          unread > 0 ? "font-medium text-[#111b21]" : "font-normal text-[#667781]"
                        }`}
                      >
                        {thread.lastMessage}
                      </p>
                      {unread > 0 ? (
                        <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-[#25d366] px-1.5 text-[11px] font-semibold text-white">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section
        className={`min-w-0 flex-1 flex-col bg-[#efeae2] ${
          showChatPane ? "flex" : "hidden lg:flex"
        }`}
      >
        {showNew ? (
          <>
            <WhatsAppChatHeader
              title="New chat"
              subtitle="Search for a member to message"
              showBack={isMobileApp}
              onBack={closeChatView}
            />

            <div className="flex-1 overflow-y-auto bg-[#efeae2] px-4 py-3">
              <div className="relative">
                <label className="text-xs font-semibold uppercase tracking-wide text-night-500">
                  To:
                </label>
                <input
                  type="search"
                  value={memberSearch}
                  onChange={(event) => {
                    const value = event.target.value;
                    setMemberSearch(value);
                    if (
                      selectedRecipient &&
                      value.trim().toLowerCase() !== selectedRecipient.name.toLowerCase()
                    ) {
                      setNewRecipientId("");
                    }
                  }}
                  placeholder="Search members…"
                  className="mt-1 w-full border-b border-night-900/10 bg-transparent py-2 text-sm outline-none placeholder:text-night-400 focus:border-night-900/30"
                />

                {selectedRecipient && (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-sand-50 px-3 py-2">
                    <MemberAvatar name={selectedRecipient.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-night-900">
                        {selectedRecipient.name}
                      </p>
                      <p className="text-xs text-night-500">
                        {getCampus(selectedRecipient.campusId).city}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearRecipient}
                      className="text-xs font-semibold text-[#00a884]"
                    >
                      Change
                    </button>
                  </div>
                )}

                {memberSearch.trim() && !selectedRecipient && matchingMembers.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-night-900/10 bg-white py-1 shadow-xl">
                    {matchingMembers.map((member) => (
                      <li key={member.id}>
                        <button
                          type="button"
                          onClick={() => selectRecipient(member)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-sand-50"
                        >
                          <MemberAvatar name={member.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-night-900">
                              {member.name}
                            </p>
                            <p className="text-xs text-night-500">
                              {getCampus(member.campusId).city}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {memberSearch.trim() && !selectedRecipient && matchingMembers.length === 0 && (
                  <p className="mt-2 text-xs text-night-500">No members match that name.</p>
                )}
              </div>
            </div>

            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSend={(attachment) => sendMessage(undefined, attachment)}
              busy={busy}
              disabled={!newRecipientId}
              placeholder="Message"
              sendLabel="Send"
              allowAttachment={false}
              density="whatsapp"
            />
          </>
        ) : activeThread ? (
          <>
            <WhatsAppChatHeader
              title={activeThread.otherName}
              subtitle={
                typingLabel(typingUsers) ||
                (isActiveBlocked ? "Blocked" : "tap here for contact info")
              }
              avatarName={activeThread.otherName}
              showBack={isMobileApp}
              onBack={closeChatView}
              menu={
                activeOtherUserId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowChatMenu((value) => !value)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-white hover:bg-white/10"
                      aria-label="Conversation options"
                    >
                      ⋮
                    </button>
                    {showChatMenu && (
                      <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl bg-white py-1 text-[#111b21] shadow-xl">
                        {!isActiveBlocked ? (
                          <button
                            type="button"
                            onClick={() => {
                              setShowChatMenu(false);
                              blockMember(activeOtherUserId, activeThread.otherName);
                            }}
                            disabled={busy}
                            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-[#f0f2f5]"
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setShowChatMenu(false);
                              unblockMember(activeOtherUserId, activeThread.otherName);
                            }}
                            disabled={busy}
                            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-[#f0f2f5]"
                          >
                            Unblock
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setShowChatMenu(false);
                            setShowReport(true);
                          }}
                          disabled={busy}
                          className="block w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                        >
                          Report
                        </button>
                      </div>
                    )}
                  </>
                ) : null
              }
            />

            {showReport && (
              <div className="border-b border-red-100 bg-red-50/70 px-4 py-3">
                <p className="text-sm font-semibold text-red-900">Report harassment</p>
                <p className="mt-0.5 text-[11px] text-red-800/80">
                  Leaders will review this. The member will also be blocked.
                </p>
                <textarea
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  rows={2}
                  placeholder="What happened?"
                  className="mt-2 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={submitReport}
                    disabled={busy || reportReason.trim().length < 8}
                    className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {busy ? "Sending…" : "Send report"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReport(false);
                      setReportReason("");
                    }}
                    className="text-xs font-semibold text-night-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {isActiveBlocked && (
              <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-center text-xs text-red-800">
                You blocked this member. Unblock them to send messages again.
              </div>
            )}

            <div className="group-chat-wallpaper min-h-0 flex-1 overflow-y-auto py-2">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-8 text-center">
                  <MemberAvatar name={activeThread.otherName} size="lg" ring />
                  <p className="mt-4 text-lg font-semibold text-[#111b21]">
                    {activeThread.otherName}
                  </p>
                  <p className="mt-1 text-sm text-[#667781]">
                    Messages and calls are end-to-end visible to members of this church app.
                    Say hi to start the conversation.
                  </p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const group = messageGroupMeta(messages, index);
                  const mine = message.senderId === user.id;
                  const lastOutgoing =
                    mine &&
                    !messages.slice(index + 1).some((item) => item.senderId === user.id);
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
                          content={message.content}
                          createdAtLabel={formatBubbleTime(message.createdAt)}
                          reactions={message.reactions}
                          currentUserId={user.id}
                          onToggleReaction={(emoji) => toggleReaction(message.id, emoji)}
                          attachmentUrl={message.attachmentUrl}
                          editedAt={message.editedAt}
                          deletedAt={message.deletedAt}
                          readAt={message.readAt}
                          showReadReceipt={lastOutgoing && group.isLast}
                          showMeta={group.showMeta}
                          density="whatsapp"
                          canEdit={message.senderId === user.id}
                          canDelete={message.senderId === user.id}
                          onEdit={(content) => editMessage(message.id, content)}
                          onDelete={() => deleteMessage(message.id)}
                        />
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSend={(attachment) =>
                sendMessage({ recipientName: activeThread.otherName }, attachment)
              }
              busy={busy}
              disabled={isActiveBlocked}
              placeholder={isActiveBlocked ? "Unblock to message…" : "Message"}
              onTyping={sendTyping}
              onPickAttachment={(file) =>
                uploadAttachment(file, { threadId: activeThreadId ?? undefined })
              }
              attachmentBusy={attachmentBusy}
              density="whatsapp"
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-[#f8f9fa] px-8 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#008069]/10 text-4xl">
              💬
            </div>
            <p className="mt-4 text-2xl font-light text-[#41525d]">Shanah City Messages</p>
            <p className="mt-2 max-w-sm text-sm text-[#667781]">
              Send private messages and photos to other members. Select a chat or start a new one.
            </p>
            <button
              type="button"
              onClick={openNewMessage}
              className="mt-5 rounded-full bg-[#00a884] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              New chat
            </button>
          </div>
        )}

        {status && statusTone && (
          <div
            className={`border-t px-4 py-2 text-center text-xs ${
              statusTone === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {status}
          </div>
        )}
      </section>
    </div>
  );
}
