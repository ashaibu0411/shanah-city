"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { GroupChatMessage } from "@/lib/group-types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type GroupChatPanelProps = {
  groupId: string;
  groupName: string;
  userId: string;
};

export function GroupChatPanel({ groupId, groupName, userId }: GroupChatPanelProps) {
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

    setMessages((current) => {
      if (options?.after && current.length > 0) {
        const seen = new Set(current.map((message) => message.id));
        const appended = (data.messages ?? []).filter(
          (message: GroupChatMessage) => !seen.has(message.id),
        );
        return appended.length > 0 ? [...current, ...appended] : current;
      }
      return data.messages ?? [];
    });
    setStatus("");
  }

  useEffect(() => {
    loadMessages();
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const last = messages[messages.length - 1];
      loadMessages({ after: last?.createdAt, quiet: true });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [groupId, messages]);

  async function sendMessage() {
    if (!draft.trim()) return;
    setBusy(true);
    setStatus("");
    const response = await fetch("/api/groups/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, content: draft.trim() }),
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

  return (
    <div className="mt-6 rounded-2xl border border-night-900/5 bg-white">
      <div className="border-b border-night-900/5 px-4 py-3">
        <h3 className="font-display text-lg font-semibold text-night-900">Group chat</h3>
        <p className="mt-1 text-sm text-night-600">
          Messages here are visible to all members of {groupName}. Be kind and stay on topic.
        </p>
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-sm text-night-500">Loading chat…</p>
        ) : (
          <>
            {messages.map((message) => {
              const mine = message.senderId === userId;
              return (
                <div
                  key={message.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      mine ? "bg-night-900 text-sand-50" : "bg-sand-100 text-night-800"
                    }`}
                  >
                    {!mine && (
                      <p className="mb-1 text-xs font-semibold opacity-70">{message.senderName}</p>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="mt-2 text-[10px] opacity-60">{formatTime(message.createdAt)}</p>
                  </div>
                </div>
              );
            })}
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
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Message the group…"
            className="flex-1 rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button onClick={sendMessage} disabled={busy || !draft.trim()}>
            Send
          </Button>
        </div>
        {status && <p className="mt-2 text-sm text-red-600">{status}</p>}
      </div>
    </div>
  );
}
