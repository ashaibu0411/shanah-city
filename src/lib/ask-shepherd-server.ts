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
import {
  SAFEGUARDING_CRITICAL_NOTICE,
  assessSafeguardingSignals,
  type SafeguardingLevel,
} from "@/lib/ask-shepherd-safeguarding";
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
    where: { userId, departmentKey },
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

export async function createConversation(input: {
  userId: string;
  department: AskShepherdDepartmentDef;
  title: string;
  category: string;
}) {
  const row = await prisma.askShepherdConversation.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      departmentKey: input.department.key,
      title: input.title.slice(0, 200),
      category: input.category.slice(0, 80),
      savedToLibrary: false,
    },
  });
  return row;
}

export async function getConversationForUser(conversationId: string, userId: string) {
  return prisma.askShepherdConversation.findFirst({
    where: { id: conversationId, userId },
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
  conversationId: string | null;
  message: string;
  category: string;
  /** When set, load consented temperament summary (verified each request). */
  teamMemberUserId: string | null;
};

export type ChatTurnResult =
  | {
      ok: true;
      conversationId: string;
      assistantMessage: string;
      safeguarding: SafeguardingLevel;
      aiConfigured: boolean;
    }
  | { ok: false; error: string; status: number; retryAfterSeconds?: number };

function clampUserMessage(text: string) {
  const t = text.trim();
  if (!t) throw new Error("Message is required.");
  if (t.length > MAX_USER_MESSAGE_CHARS) {
    throw new Error(`Message is too long (max ${MAX_USER_MESSAGE_CHARS} characters).`);
  }
  return t;
}

export async function runAskShepherdChatTurn(input: ChatTurnInput): Promise<ChatTurnResult> {
  const userMsg = clampUserMessage(input.message);
  const { level: sgLevel } = assessSafeguardingSignals(userMsg);

  let conv =
    input.conversationId ?
      await getConversationForUser(input.conversationId, input.user.id)
    : null;

  if (input.conversationId && !conv) {
    return { ok: false, error: "Conversation not found.", status: 404 };
  }

  if (conv && conv.departmentKey !== input.department.key) {
    return { ok: false, error: "Department mismatch.", status: 400 };
  }

  if (!conv) {
    const row = await createConversation({
      userId: input.user.id,
      department: input.department,
      title: userMsg.slice(0, 80) || "Leadership question",
      category: input.category.slice(0, 80),
    });
    await appendAskShepherdAudit({
      departmentKey: input.department.key,
      actorUserId: input.user.id,
      action: "conversation_started",
      summary: "Started Ask Shepherd conversation",
      meta: { category: input.category },
    });
    conv = await getConversationForUser(row.id, input.user.id);
  }
  if (!conv) {
    return { ok: false, error: "Could not load conversation.", status: 500 };
  }

  let memberHighlights: TemperamentLeaderSharedHighlights | null = null;
  if (input.teamMemberUserId) {
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

  const priorRows = await prisma.askShepherdMessage.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "desc" },
    take: MAX_CONVERSATION_MESSAGES_FOR_PROMPT,
  });
  priorRows.reverse();
  const prior = priorRows.filter((m) => m.role === "user" || m.role === "assistant");

  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }];
  for (const m of prior) {
    messages.push({ role: m.role as "user" | "assistant", content: m.content });
  }
  messages.push({ role: "user", content: userMsg });

  if (!isAskShepherdAiConfigured()) {
    await appendAskShepherdAudit({
      departmentKey: input.department.key,
      actorUserId: input.user.id,
      action: "chat_ai_unconfigured",
      summary: "AI provider not configured",
      meta: { conversationId: conv.id },
    });
    return {
      ok: false,
      error:
        "AI guidance is not configured on the server. Set ASK_SHEPHERD_AI_API_KEY (or OPENAI_API_KEY) and related options.",
      status: 503,
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

  await prisma.askShepherdMessage.create({
    data: {
      id: randomUUID(),
      conversationId: conv.id,
      role: "user",
      content: userMsg.slice(0, MAX_USER_MESSAGE_CHARS),
    },
  });

  const ai = await callAskShepherdChat(messages);
  if (!ai.ok) {
    await appendAskShepherdAudit({
      departmentKey: input.department.key,
      actorUserId: input.user.id,
      action: "chat_ai_error",
      summary: ai.message.slice(0, 200),
      meta: { conversationId: conv.id, code: ai.code },
    });
    return { ok: false, error: ai.message, status: ai.code === "not_configured" ? 503 : 502 };
  }

  let assistantText = ai.text;
  if (sgLevel === "critical") {
    assistantText = `${SAFEGUARDING_CRITICAL_NOTICE}\n\n---\n\n${assistantText}`;
  } else if (sgLevel === "caution") {
    assistantText =
      `**Note:** This topic may involve serious harm or safeguarding concerns. Involve designated church leaders and follow proper reporting pathways when appropriate.\n\n---\n\n${assistantText}`;
  }

  await prisma.askShepherdMessage.create({
    data: {
      id: randomUUID(),
      conversationId: conv.id,
      role: "assistant",
      content: assistantText.slice(0, 48_000),
    },
  });

  await prisma.askShepherdConversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date(), title: conv.title || userMsg.slice(0, 80) },
  });

  await appendAskShepherdAudit({
    departmentKey: input.department.key,
    actorUserId: input.user.id,
    action: "chat_completed",
    targetUserId: input.teamMemberUserId ?? undefined,
    summary: "Ask Shepherd reply generated",
    meta: {
      conversationId: conv.id,
      safeguarding: sgLevel,
      model: ai.model,
      usedTeamContext: Boolean(memberHighlights),
    },
  });

  return {
    ok: true,
    conversationId: conv.id,
    assistantMessage: assistantText,
    safeguarding: sgLevel,
    aiConfigured: true,
  };
}
