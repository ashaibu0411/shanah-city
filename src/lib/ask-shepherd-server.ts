import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { AskShepherdDepartmentDef } from "@/lib/ask-shepherd-departments";
import type { PublicMember } from "@/lib/auth-types";
import { getGroups } from "@/lib/group-server";
import { isGroupMember } from "@/lib/group-admin-utils";
import { buildLeaderHighlightsForUser } from "@/lib/temperament-shepherding-server";
import {
  callAskShepherdChat,
  isAskShepherdAiConfigured,
  type ChatMessage,
} from "@/lib/ask-shepherd-ai-server";
import { buildAskShepherdSystemPrompt } from "@/lib/ask-shepherd-prompt";
import { assessSafeguardingSignals, type SafeguardingLevel } from "@/lib/ask-shepherd-safeguarding";
import { criticalSafeguardingResponseWithoutAi } from "@/lib/ask-shepherd-safeguarding-static";
import {
  ASK_SHEPHERD_CLIENT_PROVIDER_FAILED,
  ASK_SHEPHERD_CLIENT_PROVIDER_NOT_CONFIGURED,
} from "@/lib/ask-shepherd-errors";
import type { TemperamentLeaderSharedHighlights } from "@/lib/temperament-shepherding-types";

const MAX_USER_MESSAGE_CHARS = 6000;
const MAX_CONVERSATION_MESSAGES_FOR_PROMPT = 24;

function utcDayString(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function dailyLimitFromEnv() {
  const n = Number(process.env.ASK_SHEPHERD_DAILY_LIMIT);
  if (Number.isFinite(n) && n > 0) return Math.min(500, n);
  return 40;
}

export async function appendAskShepherdAudit(input: {
  departmentKey: string;
  actorUserId: string;
  action: string;
  targetUserId?: string | null;
  summary: string;
  meta?: Record<string, unknown>;
}) {
  await prisma.askShepherdAudit.create({
    data: {
      id: randomUUID(),
      departmentKey: input.departmentKey,
      actorUserId: input.actorUserId,
      action: input.action,
      targetUserId: input.targetUserId ?? null,
      summary: input.summary,
      metaJson: input.meta ? JSON.stringify(input.meta) : null,
    },
  });
}

export async function enforceAskShepherdDailyLimit(userId: string, limitPerDay: number) {
  const day = utcDayString();
  const existing = await prisma.askShepherdUsageDaily.findUnique({
    where: { userId_dayUtc: { userId, dayUtc: day } },
  });
  if (existing && existing.chatCount >= limitPerDay) {
    return { allowed: false as const, retryAfterSeconds: secondsUntilUtcMidnight() };
  }
  await prisma.askShepherdUsageDaily.upsert({
    where: { userId_dayUtc: { userId, dayUtc: day } },
    create: { id: randomUUID(), userId, dayUtc: day, chatCount: 1 },
    update: { chatCount: { increment: 1 } },
  });
  return { allowed: true as const };
}

function secondsUntilUtcMidnight() {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(60, Math.ceil((tomorrow.getTime() - now.getTime()) / 1000));
}

export async function assertMemberInDepartment(groupId: string, memberId: string) {
  const groups = await getGroups();
  const group = groups.find((g) => g.id === groupId);
  if (!group || !isGroupMember(group, memberId)) {
    throw new Error("Member is not in this department's group.");
  }
}

export async function loadConsentedTemperamentContext(args: {
  subjectUserId: string;
  temperamentDepartmentKey: string;
}): Promise<TemperamentLeaderSharedHighlights | null> {
  return buildLeaderHighlightsForUser({
    subjectUserId: args.subjectUserId,
    departmentKey: args.temperamentDepartmentKey,
  });
}

export type SerializedConversation = {
  id: string;
  departmentKey: string;
  title: string;
  category: string;
  savedToLibrary: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listConversations(userId: string, departmentKey: string) {
  const rows = await prisma.askShepherdConversation.findMany({
    where: { userId, departmentKey, savedToLibrary: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      departmentKey: true,
      title: true,
      category: true,
      savedToLibrary: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    departmentKey: r.departmentKey,
    title: r.title,
    category: r.category,
    savedToLibrary: r.savedToLibrary,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function createSavedConversation(input: {
  userId: string;
  department: AskShepherdDepartmentDef;
  title: string;
  category: string;
  messages: { role: "user" | "assistant"; content: string }[];
}) {
  const conv = await prisma.askShepherdConversation.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      departmentKey: input.department.key,
      title: input.title.slice(0, 200),
      category: input.category.slice(0, 80),
      savedToLibrary: true,
    },
  });
  for (const m of input.messages) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    await prisma.askShepherdMessage.create({
      data: {
        id: randomUUID(),
        conversationId: conv.id,
        role: m.role,
        content: m.content.slice(0, 48_000),
      },
    });
  }
  return conv;
}

export async function getConversationForUser(conversationId: string, userId: string, options?: { savedOnly?: boolean }) {
  return prisma.askShepherdConversation.findFirst({
    where: {
      id: conversationId,
      userId,
      ...(options?.savedOnly ? { savedToLibrary: true } : {}),
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function deleteConversation(conversationId: string, userId: string) {
  await prisma.askShepherdConversation.deleteMany({ where: { id: conversationId, userId } });
}

export async function setConversationSaved(input: {
  conversationId: string;
  userId: string;
  savedToLibrary: boolean;
}) {
  await prisma.askShepherdConversation.updateMany({
    where: { id: input.conversationId, userId: input.userId },
    data: { savedToLibrary: input.savedToLibrary, updatedAt: new Date() },
  });
}

export type ChatTurnInput = {
  user: PublicMember;
  department: AskShepherdDepartmentDef;
  /** Set only for continuing a **saved** thread (persisted). */
  conversationId: string | null;
  message: string;
  category: string;
  /** When set, load consented temperament summary (verified each request) — never persisted. */
  teamMemberUserId: string | null;
  /**
   * Client-held history for **unsaved** chats (user/assistant pairs). Not stored server-side until explicit save.
   */
  ephemeralHistory: { role: "user" | "assistant"; content: string }[];
};

export type ChatTurnResult =
  | {
      ok: true;
      /** Null while the thread is still ephemeral (not saved). */
      conversationId: string | null;
      assistantMessage: string;
      safeguarding: SafeguardingLevel;
      aiConfigured: boolean;
      /** True when this response used the static critical safeguarding path without AI. */
      usedStaticSafeguarding?: boolean;
    }
  | { ok: false; error: string; status: number; retryAfterSeconds?: number; clientErrorCode?: string };

function clampUserMessage(text: string) {
  const t = text.trim();
  if (!t) throw new Error("Message is required.");
  if (t.length > MAX_USER_MESSAGE_CHARS) {
    throw new Error(`Message is too long (max ${MAX_USER_MESSAGE_CHARS} characters).`);
  }
  return t;
}

function normalizeEphemeralHistory(
  rows: { role: "user" | "assistant"; content: string }[],
): { role: "user" | "assistant"; content: string }[] {
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const r of rows) {
    if (r.role !== "user" && r.role !== "assistant") continue;
    const c = String(r.content ?? "").slice(0, MAX_USER_MESSAGE_CHARS);
    if (!c.trim()) continue;
    out.push({ role: r.role, content: c });
  }
  return out.slice(-MAX_CONVERSATION_MESSAGES_FOR_PROMPT);
}

export async function runAskShepherdChatTurn(input: ChatTurnInput): Promise<ChatTurnResult> {
  const userMsg = clampUserMessage(input.message);
  const { level: sgLevel } = assessSafeguardingSignals(userMsg);

  const savedConv = input.conversationId
    ? await getConversationForUser(input.conversationId, input.user.id, { savedOnly: true })
    : null;

  if (input.conversationId && !savedConv) {
    return { ok: false, error: "Conversation not found.", status: 404 };
  }
  if (savedConv && savedConv.departmentKey !== input.department.key) {
    return { ok: false, error: "Department mismatch.", status: 400 };
  }

  let memberHighlights: TemperamentLeaderSharedHighlights | null = null;
  if (input.teamMemberUserId) {
    if (savedConv) {
      return {
        ok: false,
        error: "Remove team context before continuing a saved conversation, or start a new unsaved chat.",
        status: 400,
        clientErrorCode: "team_context_saved_thread",
      };
    }
    await assertMemberInDepartment(input.department.groupId, input.teamMemberUserId);
    memberHighlights = await loadConsentedTemperamentContext({
      subjectUserId: input.teamMemberUserId,
      temperamentDepartmentKey: input.department.temperamentDepartmentKey,
    });
    if (!memberHighlights) {
      return {
        ok: false,
        error:
          "No consented temperament summary is available for this member, or they are not eligible.",
        status: 400,
      };
    }
  }

  const systemPrompt = buildAskShepherdSystemPrompt({
    departmentLabel: input.department.label,
    memberContext: memberHighlights,
  });

  /** Critical harm: immediate human-led guidance without calling the AI — never persist user allegations. */
  if (sgLevel === "critical") {
    const text = criticalSafeguardingResponseWithoutAi();
    await appendAskShepherdAudit({
      departmentKey: input.department.key,
      actorUserId: input.user.id,
      action: "chat_safeguarding_critical",
      summary: "Critical safeguarding guidance issued (static, not persisted)",
      meta: {
        mode: savedConv ? "saved_thread_open" : "ephemeral",
        safeguarding: sgLevel,
        aiInvoked: false,
        persisted: false,
      },
    });
    return {
      ok: true,
      conversationId: savedConv?.id ?? null,
      assistantMessage: text,
      safeguarding: sgLevel,
      aiConfigured: isAskShepherdAiConfigured(),
      usedStaticSafeguarding: true,
    };
  }

  const priorFromDb =
    savedConv ?
      savedConv.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
    : [];

  const priorEphemeral = savedConv ? [] : normalizeEphemeralHistory(input.ephemeralHistory);
  const prior = savedConv ? priorFromDb.slice(-MAX_CONVERSATION_MESSAGES_FOR_PROMPT) : priorEphemeral;

  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }];
  for (const m of prior) {
    messages.push({ role: m.role, content: m.content });
  }
  messages.push({ role: "user", content: userMsg });

  if (!isAskShepherdAiConfigured()) {
    await appendAskShepherdAudit({
      departmentKey: input.department.key,
      actorUserId: input.user.id,
      action: "chat_ai_unconfigured",
      summary: "AI provider not configured",
      meta: { mode: savedConv ? "saved" : "ephemeral", safeguarding: sgLevel },
    });
    return {
      ok: false,
      error: ASK_SHEPHERD_CLIENT_PROVIDER_NOT_CONFIGURED,
      status: 503,
      clientErrorCode: "ai_not_configured",
    };
  }

  const rl = await enforceAskShepherdDailyLimit(input.user.id, dailyLimitFromEnv());
  if (!rl.allowed) {
    return {
      ok: false,
      error: "Daily Ask Shepherd limit reached. Try again tomorrow.",
      status: 429,
      retryAfterSeconds: rl.retryAfterSeconds,
    };
  }

  const ai = await callAskShepherdChat(messages);
  if (!ai.ok) {
    await appendAskShepherdAudit({
      departmentKey: input.department.key,
      actorUserId: input.user.id,
      action: "chat_ai_error",
      summary: "Provider error",
      meta: {
        mode: savedConv ? "saved" : "ephemeral",
        code: ai.code,
        logHint: ai.logHint,
        httpStatus: ai.httpStatus,
      },
    });
    return {
      ok: false,
      error: ASK_SHEPHERD_CLIENT_PROVIDER_FAILED,
      status: ai.code === "not_configured" ? 503 : 502,
      clientErrorCode: ai.code,
    };
  }

  let assistantText = ai.text;
  if (sgLevel === "caution") {
    assistantText =
      `**Note:** This topic may involve serious harm or safeguarding concerns. Involve designated church leaders and follow proper reporting pathways when appropriate.\n\n---\n\n${assistantText}`;
  }

  if (savedConv) {
    await prisma.askShepherdMessage.create({
      data: {
        id: randomUUID(),
        conversationId: savedConv.id,
        role: "user",
        content: userMsg.slice(0, MAX_USER_MESSAGE_CHARS),
      },
    });
    await prisma.askShepherdMessage.create({
      data: {
        id: randomUUID(),
        conversationId: savedConv.id,
        role: "assistant",
        content: assistantText.slice(0, 48_000),
      },
    });
    await prisma.askShepherdConversation.update({
      where: { id: savedConv.id },
      data: { updatedAt: new Date(), title: savedConv.title || userMsg.slice(0, 80) },
    });
  }

  await appendAskShepherdAudit({
    departmentKey: input.department.key,
    actorUserId: input.user.id,
    action: "chat_completed",
    summary: "Ask Shepherd reply generated",
    meta: {
      conversationId: savedConv?.id ?? null,
      safeguarding: sgLevel,
      model: ai.model,
      teamContextUsed: Boolean(memberHighlights),
      mode: savedConv ? "saved" : "ephemeral",
      persisted: Boolean(savedConv),
    },
  });

  return {
    ok: true,
    conversationId: savedConv?.id ?? null,
    assistantMessage: assistantText,
    safeguarding: sgLevel,
    aiConfigured: true,
  };
}

export type SaveEphemeralInput = {
  user: PublicMember;
  department: AskShepherdDepartmentDef;
  title: string;
  category: string;
  messages: { role: "user" | "assistant"; content: string }[];
  /** Block save if any message was composed with team temperament context. */
  hadTeamContextInSession: boolean;
};

export async function saveEphemeralConversationToLibrary(input: SaveEphemeralInput): Promise<{ conversationId: string }> {
  if (input.hadTeamContextInSession) {
    throw new Error(
      "Cannot save a session that used consented team context. Copy guidance you need, then start a new chat without team context to save.",
    );
  }
  const msgs = normalizeEphemeralHistory(input.messages);
  if (msgs.length === 0) {
    throw new Error("Nothing to save.");
  }
  const conv = await createSavedConversation({
    userId: input.user.id,
    department: input.department,
    title: input.title.slice(0, 200) || "Saved guidance",
    category: input.category.slice(0, 80),
    messages: msgs,
  });
  await appendAskShepherdAudit({
    departmentKey: input.department.key,
    actorUserId: input.user.id,
    action: "conversation_saved",
    summary: "User saved Ask Shepherd guidance to library",
    meta: { conversationId: conv.id, messageCount: msgs.length },
  });
  return { conversationId: conv.id };
}
