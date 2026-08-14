"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCampus } from "@/lib/site";
import type { UserBlock, MessageReport } from "@/lib/block-types";
import type { DirectMessage, MemberDirectoryEntry } from "@/lib/member-types";
import { Button, Card } from "@/components/ui";

type ThreadSummary = {
  id: string;
  otherName: string;
  otherUserId?: string | null;
  lastMessage: string;
  lastMessageAt: string;
};

export function MessagesHub() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const threadFromUrl = searchParams.get("thread");
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [members, setMembers] = useState<MemberDirectoryEntry[]>([]);
  const [blocks, setBlocks] = useState<UserBlock[]>([]);
  const [reports, setReports] = useState<MessageReport[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [newRecipientId, setNewRecipientId] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showSafety, setShowSafety] = useState(false);
  const [canStartMessages, setCanStartMessages] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const isStaff = user?.role === "leader" || user?.role === "team";

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  const activeOtherUserId = activeThread?.otherUserId ?? null;
  const isActiveBlocked = useMemo(
    () => blocks.some((block) => block.blockedUserId === activeOtherUserId),
    [blocks, activeOtherUserId],
  );

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
    setCanStartMessages(Boolean(data.canStartMessages));
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
        }
      });
    }
  }, [user, threadFromUrl]);

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

  async function sendMessage(options?: { recipientId?: string; recipientName?: string }) {
    if (!draft.trim()) return;
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
    await loadInbox();
    await loadThread(data.thread.id);
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
          {canStartMessages && (
            <button
              type="button"
              onClick={() => {
                setShowNew(true);
                setActiveThreadId(null);
                setMessages([]);
              }}
              className="rounded-full bg-night-900 px-3 py-1.5 text-xs font-semibold text-sand-50"
            >
              New
            </button>
          )}
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
              {canStartMessages
                ? "Choose a member from the admin member directory."
                : "Only Admin Group members can start new conversations. You can still reply in existing threads."}
            </p>
            {canStartMessages ? (
              <>
                <select
                  value={newRecipientId}
                  onChange={(event) => setNewRecipientId(event.target.value)}
                  className="mt-4 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                >
                  <option value="">Select a member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} · {getCampus(member.campusId).city}
                    </option>
                  ))}
                </select>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={4}
                  placeholder="Write your message..."
                  className="mt-4 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                />
                <Button
                  className="mt-4"
                  onClick={() => sendMessage()}
                  disabled={busy || !newRecipientId}
                >
                  {busy ? "Sending..." : "Send message"}
                </Button>
              </>
            ) : null}
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
              {messages.map((message) => {
                const mine = message.senderId === user.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        mine
                          ? "bg-night-900 text-sand-50"
                          : "bg-sand-100 text-night-800"
                      }`}
                    >
                      {!mine && (
                        <p className="mb-1 text-xs font-semibold opacity-70">
                          {message.senderName}
                        </p>
                      )}
                      <p>{message.content}</p>
                      <p className="mt-2 text-[10px] opacity-60">
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="text-sm text-night-500">Start the conversation below.</p>
              )}
            </div>

            <div className="border-t border-night-900/5 pt-4">
              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={
                    isActiveBlocked
                      ? "Unblock to send messages..."
                      : "Type a message..."
                  }
                  disabled={isActiveBlocked}
                  className="flex-1 rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 disabled:opacity-50"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && !isActiveBlocked) {
                      event.preventDefault();
                      sendMessage({
                        recipientName: activeThread.otherName,
                      });
                    }
                  }}
                />
                <Button
                  onClick={() =>
                    sendMessage({
                      recipientName: activeThread.otherName,
                    })
                  }
                  disabled={busy || isActiveBlocked}
                >
                  Send
                </Button>
              </div>
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
