"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppShell } from "@/components/app/AppShellContext";
import { getCampus } from "@/lib/site";
import type { UserBlock, MessageReport } from "@/lib/block-types";
import type { DirectMessage, MemberDirectoryEntry } from "@/lib/member-types";
import { Button } from "@/components/ui";
import { ChatComposer, type PendingAttachment } from "@/components/chat/ChatComposer";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import {
  IconChevronLeft,
  IconCompose,
  IconInfo,
  IconPaperPlane,
  IconSearch,
} from "@/components/chat/ChatIcons";
import type { ChatTypingUser } from "@/lib/chat-utils";
import { notifyNotificationsChanged } from "@/lib/use-notifications";

type ThreadSummary = {
  id: string;
  otherName: string;
  otherUserId?: string | null;
  lastMessage: string;
  lastMessageAt: string;
};

const AVATAR_COLORS = [
  "bg-slate-500",
  "bg-stone-500",
  "bg-zinc-500",
  "bg-neutral-500",
  "bg-slate-600",
  "bg-stone-600",
  "bg-zinc-600",
  "bg-neutral-600",
  "bg-slate-400",
  "bg-stone-400",
] as const;

function hashName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
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

function formatBubbleTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
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
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const color = AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
  const sizeClass =
    size === "sm"
      ? "h-9 w-9 text-xs"
      : size === "lg"
        ? "h-14 w-14 text-base"
        : "h-11 w-11 text-sm";

  return (
    <div
      className={`${sizeClass} ${color} flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-1 ring-black/5`}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

export function MessagesHub() {
  const { user, loading, permissions } = useAuth();
  const { isMobileApp } = useAppShell();
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

  const filteredThreads = useMemo(() => {
    const query = inboxSearch.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter(
      (thread) =>
        thread.otherName.toLowerCase().includes(query) ||
        thread.lastMessage.toLowerCase().includes(query),
    );
  }, [inboxSearch, threads]);

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
  }

  async function loadThread(threadId: string) {
    setActiveThreadId(threadId);
    setShowNew(false);
    setShowReport(false);
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
        }
      });
    }
  }, [user, threadFromUrl, memberFromUrl, memberNameFromUrl]);

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
  }

  function openNewMessage() {
    setShowNew(true);
    setActiveThreadId(null);
    setShowChatMenu(false);
    setMessages([]);
    setNewRecipientId("");
    setMemberSearch("");
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
      <div className="flex h-[calc(100dvh-5rem)] items-center justify-center rounded-2xl border border-[#dbdbdb] bg-white">
        <p className="text-sm text-[#8e8e8e]">Loading messages…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-[#dbdbdb] bg-white px-6 py-10 text-center">
        <h2 className="font-display text-xl font-semibold text-[#262626]">
          Sign in to message members
        </h2>
        <p className="mt-2 text-sm text-[#8e8e8e]">
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

  const showInbox = !activeThreadId && !showNew;
  const showChatPane = Boolean(activeThread || showNew);

  return (
    <div
      className={`flex overflow-hidden bg-white ${
        isMobileApp
          ? "h-[calc(100dvh-3.5rem)]"
          : "h-[calc(100dvh-5rem)] rounded-2xl border border-[#dbdbdb] shadow-sm md:h-[calc(100dvh-11rem)]"
      }`}
    >
      <aside
        className={`flex w-full shrink-0 flex-col border-[#efefef] lg:w-[min(100%,380px)] lg:border-r ${
          showInbox ? "flex" : "hidden lg:flex"
        }`}
      >
        <div className={`border-b border-[#efefef] ${isMobileApp ? "px-3 py-2.5" : "px-4 py-3"}`}>
          <div className="flex items-center justify-between gap-2">
            <h2
              className={`font-semibold tracking-tight text-[#262626] ${
                isMobileApp ? "text-[16px]" : "text-[20px]"
              }`}
            >
              {isMobileApp ? "Messages" : user.name?.split(" ")[0] ?? "Messages"}
            </h2>
            <div className="flex items-center gap-0.5">
              {!isMobileApp ? (
                <button
                  type="button"
                  onClick={() => setShowSafety((value) => !value)}
                  className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#8e8e8e] hover:bg-[#fafafa]"
                >
                  Safety
                </button>
              ) : null}
              <button
                type="button"
                onClick={openNewMessage}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#262626] hover:bg-[#fafafa]"
                aria-label="New message"
              >
                <IconCompose className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative mt-2.5">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8e8e]">
              <IconSearch className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={inboxSearch}
              onChange={(event) => setInboxSearch(event.target.value)}
              placeholder="Search"
              className="w-full rounded-xl bg-[#efefef] py-2 pl-9 pr-3 text-sm text-[#262626] outline-none placeholder:text-[#8e8e8e]"
            />
          </div>
        </div>

        {showSafety && (
          <div className="border-b border-[#efefef] bg-[#fafafa] px-4 py-3">
            <p className="text-[11px] text-[#8e8e8e]">
              Block someone to stop messages. Report harassment for church leaders to review.
            </p>
            {blocks.length === 0 ? (
              <p className="mt-2 text-xs text-[#8e8e8e]">No blocked members.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#262626]">
                        {block.blockedUserName}
                      </p>
                      <p className="text-[10px] text-[#8e8e8e]">
                        Blocked {formatDetailTime(block.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => unblockMember(block.blockedUserId, block.blockedUserName)}
                      disabled={busy}
                      className="shrink-0 text-xs font-semibold text-[#0095f6]"
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
              <IconPaperPlane className="h-14 w-14 text-[#262626]" />
              <p className="mt-4 text-sm font-semibold text-[#262626]">Your messages</p>
              <p className="mt-1 text-xs text-[#8e8e8e]">
                Send a message to start a conversation.
              </p>
              <button
                type="button"
                onClick={openNewMessage}
                className="mt-4 rounded-lg bg-[#0095f6] px-4 py-2 text-xs font-semibold text-white"
              >
                Send message
              </button>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const active = activeThreadId === thread.id;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => loadThread(thread.id)}
                  className={`flex w-full items-center gap-3 text-left transition hover:bg-[#fafafa] ${
                    isMobileApp ? "px-3 py-2.5" : "px-4 py-3"
                  } ${active ? "bg-[#fafafa]" : ""}`}
                >
                  <MemberAvatar
                    name={thread.otherName}
                    size={isMobileApp ? "md" : "lg"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-semibold text-[14px] text-[#262626]">
                        {thread.otherName}
                      </p>
                      <span className="shrink-0 text-[12px] text-[#8e8e8e]">
                        {formatInboxTime(thread.lastMessageAt)}
                      </span>
                    </div>
                    <p className="truncate text-[13px] text-[#8e8e8e]">{thread.lastMessage}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section
        className={`min-w-0 flex-1 flex-col bg-white ${
          showChatPane ? "flex" : "hidden lg:flex"
        }`}
      >
        {showNew ? (
          <>
            <header className="flex items-center gap-2 border-b border-[#efefef] px-2 py-2.5">
              <button
                type="button"
                onClick={closeChatView}
                className="rounded-full p-1.5 text-[#262626] hover:bg-[#fafafa] lg:hidden"
                aria-label="Back to inbox"
              >
                <IconChevronLeft className="h-6 w-6" />
              </button>
              <h2 className="flex-1 text-sm font-semibold text-[#262626]">New message</h2>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="relative">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#8e8e8e]">
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
                  className="mt-1 w-full border-b border-[#dbdbdb] bg-transparent py-2 text-sm outline-none placeholder:text-[#8e8e8e] focus:border-[#262626]/40"
                />

                {selectedRecipient && (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#fafafa] px-3 py-2">
                    <MemberAvatar name={selectedRecipient.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#262626]">
                        {selectedRecipient.name}
                      </p>
                      <p className="text-xs text-[#8e8e8e]">
                        {getCampus(selectedRecipient.campusId).city}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearRecipient}
                      className="text-xs font-semibold text-[#0095f6]"
                    >
                      Change
                    </button>
                  </div>
                )}

                {memberSearch.trim() && !selectedRecipient && matchingMembers.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-[#dbdbdb] bg-white py-1 shadow-xl">
                    {matchingMembers.map((member) => (
                      <li key={member.id}>
                        <button
                          type="button"
                          onClick={() => selectRecipient(member)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#fafafa]"
                        >
                          <MemberAvatar name={member.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#262626]">
                              {member.name}
                            </p>
                            <p className="text-xs text-[#8e8e8e]">
                              {getCampus(member.campusId).city}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {memberSearch.trim() && !selectedRecipient && matchingMembers.length === 0 && (
                  <p className="mt-2 text-xs text-[#8e8e8e]">No members match that name.</p>
                )}
              </div>
            </div>

            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSend={(attachment) => sendMessage(undefined, attachment)}
              busy={busy}
              disabled={!newRecipientId}
              placeholder="Message…"
              sendLabel="Send"
              allowAttachment={false}
              density="compact"
            />
          </>
        ) : activeThread ? (
          <>
            <header className="relative flex items-center gap-2 border-b border-[#efefef] px-2 py-2">
              <button
                type="button"
                onClick={closeChatView}
                className="rounded-full p-1.5 text-[#262626] hover:bg-[#fafafa] lg:hidden"
                aria-label="Back to inbox"
              >
                <IconChevronLeft className="h-6 w-6" />
              </button>
              <MemberAvatar name={activeThread.otherName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#262626]">
                  {activeThread.otherName}
                </p>
                <p className="truncate text-[11px] text-[#8e8e8e]">
                  {typingLabel(typingUsers) ||
                    (isActiveBlocked ? "Blocked" : "Active now")}
                </p>
              </div>
              {activeOtherUserId && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowChatMenu((value) => !value)}
                    className="rounded-full p-2 text-[#262626] hover:bg-[#fafafa]"
                    aria-label="Conversation options"
                  >
                    <IconInfo className="h-6 w-6" />
                  </button>
                  {showChatMenu && (
                    <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-[#dbdbdb] bg-white py-1 shadow-xl">
                      {!isActiveBlocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowChatMenu(false);
                            blockMember(activeOtherUserId, activeThread.otherName);
                          }}
                          disabled={busy}
                          className="block w-full px-4 py-2 text-left text-sm text-[#262626] hover:bg-[#fafafa]"
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
                          className="block w-full px-4 py-2 text-left text-sm text-[#262626] hover:bg-[#fafafa]"
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
                        className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                      >
                        Report
                      </button>
                    </div>
                  )}
                </div>
              )}
            </header>

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
                    className="text-xs font-semibold text-[#8e8e8e]"
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

            <div className="flex-1 space-y-1 overflow-y-auto bg-white py-2">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <MemberAvatar name={activeThread.otherName} size="lg" />
                  <p className="mt-3 text-sm font-semibold text-[#262626]">
                    {activeThread.otherName}
                  </p>
                  <p className="mt-1 text-xs text-[#8e8e8e]">
                    Say hi — this is the start of your conversation.
                  </p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isLastOwn =
                    message.senderId === user.id &&
                    messages.slice(index + 1).every((m) => m.senderId !== user.id);
                  return (
                    <ChatMessageBubble
                      key={message.id}
                      mine={message.senderId === user.id}
                      content={message.content}
                      createdAtLabel={formatBubbleTime(message.createdAt)}
                      reactions={message.reactions}
                      currentUserId={user.id}
                      onToggleReaction={(emoji) => toggleReaction(message.id, emoji)}
                      attachmentUrl={message.attachmentUrl}
                      editedAt={message.editedAt}
                      deletedAt={message.deletedAt}
                      readAt={message.readAt}
                      showReadReceipt={isLastOwn}
                      density="compact"
                      canEdit={message.senderId === user.id}
                      canDelete={message.senderId === user.id}
                      onEdit={(content) => editMessage(message.id, content)}
                      onDelete={() => deleteMessage(message.id)}
                    />
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
              placeholder={isActiveBlocked ? "Unblock to message…" : "Message…"}
              onTyping={sendTyping}
              onPickAttachment={(file) =>
                uploadAttachment(file, { threadId: activeThreadId ?? undefined })
              }
              attachmentBusy={attachmentBusy}
              density="compact"
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <IconPaperPlane className="h-24 w-24 text-[#262626]" />
            <p className="mt-4 text-[20px] font-light text-[#262626]">Your messages</p>
            <p className="mt-1 max-w-xs text-sm text-[#8e8e8e]">
              Send private photos and messages to a friend or group.
            </p>
            <button
              type="button"
              onClick={openNewMessage}
              className="mt-5 rounded-lg bg-[#0095f6] px-4 py-2 text-sm font-semibold text-white"
            >
              Send message
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
