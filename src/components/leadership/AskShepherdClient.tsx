"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ASK_SHEPHERD_BUILTIN_RESOURCES } from "@/lib/ask-shepherd-resources-data";

const DEPT = "worship";

type SessionPayload = {
  department: { key: string; label: string; groupId: string };
  access: { accessReason: string; isPastoralOversight: boolean };
  categories: { id: string; label: string }[];
  aiConfigured: boolean;
};

type ConvSummary = {
  id: string;
  title: string;
  category: string;
  savedToLibrary: boolean;
  updatedAt: string;
};

function AssistantMessage({ content }: { content: string }) {
  const parts = content.split(/(\*\*.+?\*\*)/g);
  return (
    <div className="whitespace-pre-wrap break-words text-night-800">
      {parts.map((part, i) => {
        const m = part.match(/^\*\*(.+)\*\*$/);
        if (m) return <strong key={i}>{m[1]}</strong>;
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

export function AskShepherdClient() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConvSummary[]>([]);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  /** Set only when continuing a **saved** thread (messages persist server-side). */
  const [conversationId, setConversationId] = useState<string | null>(null);
  /** Server-signed state: ephemeral thread used consented team context — save must stay disabled. */
  const [teamContextSaveLocked, setTeamContextSaveLocked] = useState(false);
  const [category, setCategory] = useState("general");
  const [teamMemberUserId, setTeamMemberUserId] = useState("");
  const [memberOptions, setMemberOptions] = useState<{ id: string; name: string; hasSharedTemperamentSummary: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const base = `/api/leadership/ask-shepherd/${DEPT}`;

  const refreshSession = useCallback(async () => {
    setLoadError(null);
    const res = await fetch(`${base}/session`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoadError(String(data.error ?? "Could not load Ask Shepherd."));
      return;
    }
    setSession(data as SessionPayload);
  }, [base]);

  const refreshConversations = useCallback(async () => {
    const res = await fetch(`${base}/conversations`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { conversations?: ConvSummary[] };
    if (res.ok && data.conversations) setConversations(data.conversations);
  }, [base]);

  const refreshMembers = useCallback(async () => {
    const res = await fetch(`${base}/members`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as {
      members?: { id: string; name: string; hasSharedTemperamentSummary: boolean }[];
    };
    if (res.ok && data.members) setMemberOptions(data.members);
  }, [base]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!session) return;
    void refreshConversations();
    void refreshMembers();
  }, [session, refreshConversations, refreshMembers]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const eligibleMembers = memberOptions.filter((m) => m.hasSharedTemperamentSummary);

  async function send() {
    const msg = input.trim();
    if (!msg || busy) return;
    if (conversationId && teamMemberUserId.trim()) {
      setError("Clear team context or start a new chat before continuing a saved conversation.");
      return;
    }
    setBusy(true);
    setError(null);
    const historyBefore = messages;
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setInput("");
    try {
      const res = await fetch(`${base}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: msg,
          category,
          conversationId,
          teamMemberUserId: teamMemberUserId.trim() || null,
          ephemeralHistory: historyBefore,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        assistantMessage?: string;
        conversationId?: string | null;
        ephemeralTeamContextLocked?: boolean;
      };
      if (data.ephemeralTeamContextLocked === true) {
        setTeamContextSaveLocked(true);
      }
      if (!res.ok) {
        throw new Error(String(data.error ?? "Request failed"));
      }
      if (data.conversationId !== null && data.conversationId !== undefined) {
        setConversationId(String(data.conversationId));
      }
      setMessages((m) => [...m, { role: "assistant", content: String(data.assistantMessage) }]);
      void refreshConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setMessages(historyBefore);
    } finally {
      setBusy(false);
    }
  }

  async function loadConversation(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${base}/conversations/${id}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        conversation?: {
          id: string;
          messages: { role: string; content: string }[];
        };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not load conversation");
      const conv = data.conversation!;
      setConversationId(conv.id);
      setTeamContextSaveLocked(false);
      setMessages(
        conv.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function newChat() {
    await fetch(`${base}/session/clear-ephemeral-team-context`, {
      method: "POST",
      credentials: "include",
    });
    setConversationId(null);
    setMessages([]);
    setTeamMemberUserId("");
    setTeamContextSaveLocked(false);
    setError(null);
  }

  async function saveToLibrary() {
    if (messages.length === 0) return;
    if (teamContextSaveLocked) {
      setError(
        "This thread used consented team context and cannot be saved. Copy what you need, tap New chat (starts a new server session), then continue without team context if you need to save.",
      );
      return;
    }
    if (conversationId) {
      setError("This is already a saved thread. Use Delete in Saved guidance to remove it.");
      return;
    }
    const title =
      window.prompt("Title for saved guidance", messages.find((m) => m.role === "user")?.content.slice(0, 60) ?? "Saved guidance") ??
      "";
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${base}/save`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          category,
          messages,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      if (!res.ok) throw new Error(String(data.error ?? "Save failed"));
      void newChat();
      void refreshConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeConversation(id: string) {
    if (!confirm("Delete this saved conversation?")) return;
    const res = await fetch(`${base}/conversations/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (conversationId === id) void newChat();
      void refreshConversations();
    }
  }

  async function copyLast() {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last?.content || !navigator.clipboard) return;
    await navigator.clipboard.writeText(last.content);
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        {loadError}
      </div>
    );
  }

  if (!session) {
    return <div className="text-sm text-night-600">Loading…</div>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-24">
      <nav className="flex flex-wrap gap-2 text-xs font-medium text-night-600">
        <a href="#ask" className="rounded-full bg-night-100 px-3 py-1 hover:bg-night-200">
          Ask Shepherd
        </a>
        <a href="#communication" className="rounded-full bg-night-100 px-3 py-1 hover:bg-night-200">
          Communication
        </a>
        <a href="#team" className="rounded-full bg-night-100 px-3 py-1 hover:bg-night-200">
          Team challenges
        </a>
        <a href="#development" className="rounded-full bg-night-100 px-3 py-1 hover:bg-night-200">
          Leadership development
        </a>
        <a href="#saved" className="rounded-full bg-night-100 px-3 py-1 hover:bg-night-200">
          Saved guidance
        </a>
        <a href="#resources" className="rounded-full bg-night-100 px-3 py-1 hover:bg-night-200">
          Ministry resources
        </a>
      </nav>

      {!session.aiConfigured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          AI responses are not configured on this deployment. Add server-side credentials (for example{" "}
          <code className="rounded bg-amber-100 px-1">ASK_SHEPHERD_AI_API_KEY</code>) and feature flags — the assistant
          stays disabled until then.
        </div>
      )}

      <section id="ask" className="scroll-mt-24 rounded-2xl border border-night-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-night-900">Ask Shepherd</h2>
        <p className="mt-1 text-sm text-night-600">
          Private leadership support for {session.department.label}. This does not replace pastoral judgment or licensed
          counseling.
        </p>
        <p className="mt-2 text-xs text-night-500">
          Access: {session.access.accessReason.replace(/_/g, " ")}
          {session.access.isPastoralOversight ? " · Pastoral oversight" : ""}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-night-700">
            Topic
            <select
              className="mt-1 w-full rounded-xl border border-night-200 px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {session.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-night-700">
            Optional: consented team context
            <select
              className="mt-1 w-full rounded-xl border border-night-200 px-3 py-2 text-sm"
              value={teamMemberUserId}
              onChange={(e) => setTeamMemberUserId(e.target.value)}
            >
              <option value="">General guidance (no member profile)</option>
              {eligibleMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — shared temperament summary
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-night-500">
          Only members who completed the temperament reflection and chose to share a summary with leaders appear here.
          Temperament highlights are used only for this request — they are not written into saved library notes (saving is
          blocked while team context is on).
        </p>
        <p className="mt-2 text-xs text-amber-800">
          Unsaved chats stay in this browser session only — nothing is written to the server until you tap{" "}
          <strong>Save to library</strong>. Critical safeguarding topics never store your message text on the server.
        </p>

        <div className="mt-4 min-h-[220px] max-h-[55vh] overflow-y-auto rounded-xl bg-night-50 p-3">
          {messages.length === 0 && (
            <p className="text-sm text-night-500">
              Ask about correction, conflict, volunteers, or team communication. Follow up as needed.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={`mb-3 rounded-xl px-3 py-2 text-sm ${
                m.role === "user" ? "ml-8 bg-brand-100 text-night-900" : "mr-4 bg-white text-night-800 shadow-sm"
              }`}
            >
              {m.role === "assistant" ? <AssistantMessage content={m.content} /> : m.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            className="min-h-[88px] flex-1 rounded-xl border border-night-200 px-3 py-2 text-sm"
            placeholder="Describe the situation. What have you already tried?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl bg-night-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={() => void send()}
              disabled={busy || !input.trim()}
            >
              {busy ? "Thinking…" : "Send"}
            </button>
            <button
              type="button"
              className="rounded-xl border border-night-300 px-3 py-2 text-sm"
              onClick={() => void copyLast()}
              disabled={messages.length === 0}
            >
              Copy last
            </button>
            <button type="button" className="rounded-xl border border-night-300 px-3 py-2 text-sm" onClick={() => void newChat()}>
              New chat
            </button>
            {!conversationId && messages.length > 0 && (
              <button
                type="button"
                className="rounded-xl border border-brand-600 px-3 py-2 text-sm font-medium text-brand-900"
                onClick={() => void saveToLibrary()}
                disabled={busy || teamContextSaveLocked}
              >
                Save to library
              </button>
            )}
          </div>
        </div>
      </section>

      <section id="communication" className="scroll-mt-24 rounded-2xl border border-night-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Communication guidance</h2>
        <p className="mt-1 text-sm text-night-600">
          For tone, clarity, and hard conversations — combine with prayer and your team’s real context. Try the prompt:
          “How do I address recurring lateness without shaming?”
        </p>
      </section>

      <section id="team" className="scroll-mt-24 rounded-2xl border border-night-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Team challenges</h2>
        <p className="mt-1 text-sm text-night-600">
          Use Ask Shepherd above for conflict between volunteers, unclear roles, or discouragement. Escalate safeguarding
          or abuse concerns to human leaders immediately.
        </p>
      </section>

      <section id="development" className="scroll-mt-24 rounded-2xl border border-night-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Leadership development</h2>
        <p className="mt-1 text-sm text-night-600">
          Ask about mentoring emerging leaders, delegation, and building trust — always paired with your pastoral
          oversight and local culture.
        </p>
      </section>

      <section id="saved" className="scroll-mt-24 rounded-2xl border border-night-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Saved guidance</h2>
        <p className="mt-1 text-sm text-night-600">
          Use <strong>Save to library</strong> after reviewing an unsaved chat. Opening a saved thread continues on the
          server; delete when you are done.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {conversations.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-night-50 px-3 py-2">
                <button type="button" className="text-left font-medium text-night-900" onClick={() => void loadConversation(c.id)}>
                  {c.title}
                </button>
                <span className="text-xs text-night-500">{new Date(c.updatedAt).toLocaleString()}</span>
                <div className="flex gap-2">
                  <button type="button" className="text-xs text-rose-700" onClick={() => void removeConversation(c.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          {conversations.length === 0 && <li className="text-night-500">No saved conversations yet.</li>}
        </ul>
      </section>

      <section id="resources" className="scroll-mt-24 rounded-2xl border border-night-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Ministry resources</h2>
        <p className="mt-1 text-sm text-night-600">
          Curated themes — not a substitute for your church’s formal policies. Approved internal documents can be added
          by pastoral staff in the database when ready.
        </p>
        <ul className="mt-3 space-y-3">
          {ASK_SHEPHERD_BUILTIN_RESOURCES.map((r) => (
            <li key={r.slug} className="rounded-xl border border-night-100 bg-night-50/80 p-3 text-sm">
              <p className="font-medium text-night-900">{r.title}</p>
              <p className="text-xs uppercase tracking-wide text-night-500">{r.category}</p>
              <p className="mt-1 text-night-700">{r.summary}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-night-500">
          Temperament hub:{" "}
          <Link href="/worship/shepherding" className="text-brand-800 underline">
            Shepherding hub
          </Link>
        </p>
      </section>
    </div>
  );
}
