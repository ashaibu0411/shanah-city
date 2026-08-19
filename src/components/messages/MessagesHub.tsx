"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCampus } from "@/lib/site";
import type { UserBlock, MessageReport } from "@/lib/block-types";
import type { DirectMessage, MemberDirectoryEntry } from "@/lib/member-types";
import { Button, Card } from "@/components/ui";
import { ChatComposer, type PendingAttachment } from "@/components/chat/ChatComposer";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import type { ChatTypingUser } from "@/lib/chat-utils";

type ThreadSummary = {
  id: string;
  otherName: string;
  otherUserId?: string | null;
  lastMessage: string;
  lastMessageAt: string;
};

export function MessagesHub() {
  const { user, loading, permissions } = useAuth();
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
  const [showNew, setShowNew] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showSafety, setShowSafety] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [typingUsers, setTypingUsers] = useState<ChatTypingUser[]>([]);
  const [status, setStatus] = useState("");

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

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (loading) {
    return <Card>Loading account...</Card>;
  }

  if (!user) {
    return (
      <Card>
        <h2 className="font-display text-xl font-semibold text-night-900">
          Sign in to message members
        </h2>
        <p className="mt-2 text-sm text-night-600">
          Connect privately with other Shanah City members after you create an account.
        </p>
        <div className="mt-4 flex gap-3">
          <Button href="/sign-in">Sign in</Button>
          <Button href="/sign-up" variant="secondary">
            Create account
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className={`${activeThreadId || showNew ? "hidden lg:block" : ""}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-night-900">Inbox</h2>
          <button
            type="button"
            onClick={() => {
              setShowNew(true);
              setActiveThreadId(null);
              setMessages([]);
              setNewRecipientId("");
              setMemberSearch("");
            }}
            className="rounded-full bg-night-900 px-3 py-1.5 text-xs font-semibold text-sand-50"
          >
            New
          </button>
        </div>

        <div className="space-y-2">
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => loadThread(thread.id)}
              className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                activeThreadId === thread.id
                  ? "bg-night-900 text-sand-50"
                  : "bg-sand-50 hover:bg-sand-100"
              }`}
            >
              <p className="font-semibold">{thread.otherName}</p>
              <p className="mt-1 line-clamp-1 text-sm opacity-80">{thread.lastMessage}</p>
              <p className="mt-1 text-[11px] opacity-60">{formatTime(thread.lastMessageAt)}</p>
            </button>
          ))}
          {threads.length === 0 && (
            <p className="rounded-2xl bg-sand-50 px-3 py-4 text-sm text-night-600">
              No conversations yet. Tap <strong>New</strong> to message a member.
            </p>
          )}
        </div>

        <div className="mt-6 border-t border-night-900/5 pt-4">
          <button
            type="button"
            onClick={() => setShowSafety((value) => !value)}
            className="flex w-full items-center justify-between text-left text-sm font-semibold text-night-700"
          >
            Safety & blocked members
            <span className="text-xs text-night-400">{showSafety ? "Hide" : "Show"}</span>
          </button>

          {showSafety && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-night-500">
                Block someone to stop them from messaging you. Report harassment so church
                leaders can follow up.
              </p>
              {blocks.length === 0 ? (
                <p className="rounded-xl bg-sand-50 px-3 py-2 text-xs text-night-600">
                  No blocked members.
                </p>
              ) : (
                blocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between rounded-xl bg-sand-50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-night-900">
                        {block.blockedUserName}
                      </p>
                      <p className="text-[11px] text-night-500">
                        Blocked {formatTime(block.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => unblockMember(block.blockedUserId, block.blockedUserName)}
                      disabled={busy}
                      className="text-xs font-semibold text-night-700 underline"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}

              {isStaff && reports.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                    Open reports ({reports.length})
                  </p>
                  <div className="mt-2 space-y-2">
                    {reports.slice(0, 5).map((report) => (
                      <div key={report.id} className="text-xs text-amber-950">
                        <p className="font-semibold">
                          {report.reportedUserName} · reported by {report.reporterName}
                        </p>
                        <p className="mt-0.5 opacity-80">{report.reason}</p>
                        <p className="mt-0.5 opacity-60">{formatTime(report.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className={`${!activeThreadId && !showNew ? "hidden lg:block" : ""}`}>
        {(activeThread || showNew) && (
          <button
            type="button"
            onClick={() => {
              setActiveThreadId(null);
              setShowNew(false);
              setShowReport(false);
              setMessages([]);
              setNewRecipientId("");
              setMemberSearch("");
            }}
            className="mb-4 text-sm font-semibold text-night-600 lg:hidden"
          >
            ← Back to inbox
          </button>
        )}

        {showNew ? (
          <div>
            <h2 className="font-display text-lg font-semibold text-night-900">New message</h2>
            <p className="mt-1 text-sm text-night-600">
              Search for a member by name to start a private conversation.
            </p>
            <div className="relative mt-4">
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
                placeholder="Search by name..."
                className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
              />

              {selectedRecipient && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-sand-50 px-3 py-2.5 text-sm">
                  <div>
                    <p className="font-semibold text-night-900">{selectedRecipient.name}</p>
                    <p className="text-night-500">{getCampus(selectedRecipient.campusId).city}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearRecipient}
                    className="text-xs font-semibold text-night-600 underline"
                  >
                    Change
                  </button>
                </div>
              )}

              {memberSearch.trim() && !selectedRecipient && matchingMembers.length > 0 && (
                <ul className="absolute z-10 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-night-900/10 bg-white py-1 shadow-lg">
                  {matchingMembers.map((member) => (
                    <li key={member.id}>
                      <button
                        type="button"
                        onClick={() => selectRecipient(member)}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-sand-50"
                      >
                        <span className="font-medium text-night-900">{member.name}</span>
                        <span className="text-night-500">{getCampus(member.campusId).city}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {memberSearch.trim() && !selectedRecipient && matchingMembers.length === 0 && (
                <p className="mt-2 text-sm text-night-500">No members match that name.</p>
              )}
            </div>
            <div className="mt-4">
              <ChatComposer
                value={draft}
                onChange={setDraft}
                onSend={(attachment) => sendMessage(undefined, attachment)}
                busy={busy}
                disabled={!newRecipientId}
                placeholder="Write your message..."
                sendLabel="Send message"
                allowAttachment={false}
              />
            </div>
          </div>
        ) : activeThread ? (
          <div className="flex h-full min-h-[420px] flex-col">
            <div className="border-b border-night-900/5 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-night-900">
                    {activeThread.otherName}
                  </h2>
                  <p className="text-sm text-night-500">Private member conversation</p>
                  {typingLabel(typingUsers) && (
                    <p className="mt-1 text-xs font-medium text-violet-700">
                      {typingLabel(typingUsers)}
                    </p>
                  )}
                  {isActiveBlocked && (
                    <p className="mt-1 text-xs font-medium text-red-700">
                      You blocked this member. Unblock them to send messages again.
                    </p>
                  )}
                </div>
                {activeOtherUserId && (
                  <div className="flex flex-wrap gap-2">
                    {!isActiveBlocked ? (
                      <button
                        type="button"
                        onClick={() =>
                          blockMember(activeOtherUserId, activeThread.otherName)
                        }
                        disabled={busy}
                        className="rounded-full border border-night-900/10 px-3 py-1.5 text-xs font-semibold text-night-700"
                      >
                        Block
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          unblockMember(activeOtherUserId, activeThread.otherName)
                        }
                        disabled={busy}
                        className="rounded-full border border-night-900/10 px-3 py-1.5 text-xs font-semibold text-night-700"
                      >
                        Unblock
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowReport((value) => !value)}
                      disabled={busy}
                      className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800"
                    >
                      Report
                    </button>
                  </div>
                )}
              </div>

              {showReport && (
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/60 p-4">
                  <p className="text-sm font-semibold text-red-900">Report harassment</p>
                  <p className="mt-1 text-xs text-red-800/80">
                    Leaders will review this report. The member will also be blocked from
                    messaging you.
                  </p>
                  <textarea
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    rows={3}
                    placeholder="Describe what happened (required)..."
                    className="mt-3 w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none"
                  />
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={submitReport}
                      disabled={busy || reportReason.trim().length < 8}
                    >
                      {busy ? "Sending..." : "Send report & block"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReport(false);
                        setReportReason("");
                      }}
                      className="text-sm font-semibold text-night-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto py-4">
              {messages.map((message) => (
                <ChatMessageBubble
                  key={message.id}
                  mine={message.senderId === user.id}
                  senderName={message.senderName}
                  content={message.content}
                  createdAtLabel={formatTime(message.createdAt)}
                  reactions={message.reactions}
                  currentUserId={user.id}
                  onToggleReaction={(emoji) => toggleReaction(message.id, emoji)}
                  attachmentUrl={message.attachmentUrl}
                  editedAt={message.editedAt}
                  deletedAt={message.deletedAt}
                  readAt={message.readAt}
                  showReadReceipt
                  canEdit={message.senderId === user.id}
                  canDelete={message.senderId === user.id}
                  onEdit={(content) => editMessage(message.id, content)}
                  onDelete={() => deleteMessage(message.id)}
                />
              ))}
              {messages.length === 0 && (
                <p className="text-sm text-night-500">Start the conversation below.</p>
              )}
            </div>

            <div className="border-t border-night-900/5 pt-4">
              <ChatComposer
                value={draft}
                onChange={setDraft}
                onSend={(attachment) =>
                  sendMessage(
                    {
                      recipientName: activeThread.otherName,
                    },
                    attachment,
                  )
                }
                busy={busy}
                disabled={isActiveBlocked}
                placeholder={
                  isActiveBlocked ? "Unblock to send messages..." : "Type a message..."
                }
                onTyping={sendTyping}
                onPickAttachment={(file) =>
                  uploadAttachment(file, { threadId: activeThreadId ?? undefined })
                }
                attachmentBusy={attachmentBusy}
              />
            </div>
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
            <p className="font-display text-xl font-semibold text-night-900">
              Member messaging
            </p>
            <p className="mt-2 max-w-sm text-sm text-night-600">
              Select a conversation or start a new message to connect with other Shanah City
              members. You can block or report anyone who harasses you.
            </p>
          </div>
        )}

        {status && (
          <p
            className={`mt-4 rounded-xl px-3 py-2 text-sm ${
              status.includes("blocked") || status.includes("Report")
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {status}
          </p>
        )}
      </Card>
    </div>
  );
}
