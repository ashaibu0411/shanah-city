import { prisma } from "@/lib/db";

const MAX_CO_HOSTS = 3;

export async function assertLiveStatusActive(statusId: string) {
  const status = await prisma.communityStatus.findUnique({
    where: { id: statusId },
  });
  if (!status || status.mediaType !== "live" || status.expiresAt <= new Date()) {
    throw new Error("This live has ended.");
  }
  return status;
}

export async function isLiveCoHost(statusId: string, userId: string) {
  const row = await prisma.communityLiveCoHost.findUnique({
    where: { statusId_userId: { statusId, userId } },
  });
  return Boolean(row);
}

export async function getLiveSessionMeta(statusId: string, viewerUserId: string) {
  const status = await assertLiveStatusActive(statusId);
  const isHost = status.authorId === viewerUserId;

  const [coHostRow, joinRequest, coHostRows] = await Promise.all([
    prisma.communityLiveCoHost.findUnique({
      where: { statusId_userId: { statusId, userId: viewerUserId } },
    }),
    prisma.communityLiveJoinRequest.findUnique({
      where: { statusId_userId: { statusId, userId: viewerUserId } },
    }),
    prisma.communityLiveCoHost.findMany({
      where: { statusId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    statusId,
    hostUserId: status.authorId,
    hostName: status.authorName,
    isHost,
    isCoHost: Boolean(coHostRow),
    joinRequestState: (joinRequest?.state ?? "none") as "none" | "pending" | "approved" | "rejected",
    coHostCount: coHostRows.length,
    maxCoHosts: MAX_CO_HOSTS,
    coHosts: coHostRows.map((row) => ({
      userId: row.userId,
      userName: row.userName,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function listPendingLiveJoinRequests(statusId: string, hostUserId: string) {
  const status = await assertLiveStatusActive(statusId);
  if (status.authorId !== hostUserId) {
    throw new Error("Only the host can view join requests.");
  }
  return prisma.communityLiveJoinRequest.findMany({
    where: { statusId, state: "pending" },
    orderBy: { createdAt: "asc" },
  });
}

export async function createLiveJoinRequest(input: {
  statusId: string;
  userId: string;
  userName: string;
}) {
  const status = await assertLiveStatusActive(input.statusId);
  if (status.authorId === input.userId) {
    throw new Error("You are already hosting this live.");
  }

  const existingCoHost = await prisma.communityLiveCoHost.findUnique({
    where: { statusId_userId: { statusId: input.statusId, userId: input.userId } },
  });
  if (existingCoHost) {
    throw new Error("You are already a co-host on this live.");
  }

  const coHostCount = await prisma.communityLiveCoHost.count({
    where: { statusId: input.statusId },
  });
  if (coHostCount >= MAX_CO_HOSTS) {
    throw new Error("This live already has the maximum number of co-hosts.");
  }

  await prisma.communityLiveJoinRequest.upsert({
    where: {
      statusId_userId: { statusId: input.statusId, userId: input.userId },
    },
    create: {
      id: `livejr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      statusId: input.statusId,
      userId: input.userId,
      userName: input.userName,
      state: "pending",
    },
    update: {
      userName: input.userName,
      state: "pending",
    },
  });

  return { state: "pending" as const };
}

export async function approveLiveJoinRequest(input: {
  statusId: string;
  hostUserId: string;
  guestUserId: string;
}) {
  const status = await assertLiveStatusActive(input.statusId);
  if (status.authorId !== input.hostUserId) {
    throw new Error("Only the host can approve co-hosts.");
  }
  if (input.guestUserId === input.hostUserId) {
    throw new Error("The host is already on camera.");
  }

  const coHostCount = await prisma.communityLiveCoHost.count({
    where: { statusId: input.statusId },
  });
  if (coHostCount >= MAX_CO_HOSTS) {
    throw new Error("Maximum co-hosts reached.");
  }

  const request = await prisma.communityLiveJoinRequest.findUnique({
    where: {
      statusId_userId: { statusId: input.statusId, userId: input.guestUserId },
    },
  });
  if (!request || request.state !== "pending") {
    throw new Error("No pending request from this member.");
  }

  await prisma.$transaction([
    prisma.communityLiveCoHost.create({
      data: {
        id: `livech-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        statusId: input.statusId,
        userId: request.userId,
        userName: request.userName,
      },
    }),
    prisma.communityLiveJoinRequest.update({
      where: { id: request.id },
      data: { state: "approved" },
    }),
  ]);
}

export async function rejectLiveJoinRequest(input: {
  statusId: string;
  hostUserId: string;
  guestUserId: string;
}) {
  const status = await assertLiveStatusActive(input.statusId);
  if (status.authorId !== input.hostUserId) {
    throw new Error("Only the host can decline requests.");
  }

  await prisma.communityLiveJoinRequest.updateMany({
    where: {
      statusId: input.statusId,
      userId: input.guestUserId,
      state: "pending",
    },
    data: { state: "rejected" },
  });
}

export async function removeLiveCoHost(input: {
  statusId: string;
  hostUserId: string;
  guestUserId: string;
}) {
  const status = await assertLiveStatusActive(input.statusId);
  if (status.authorId !== input.hostUserId) {
    throw new Error("Only the host can remove co-hosts.");
  }

  await prisma.$transaction([
    prisma.communityLiveCoHost.deleteMany({
      where: { statusId: input.statusId, userId: input.guestUserId },
    }),
    prisma.communityLiveJoinRequest.updateMany({
      where: { statusId: input.statusId, userId: input.guestUserId },
      data: { state: "rejected" },
    }),
  ]);
}

export async function leaveLiveCoHost(input: { statusId: string; userId: string }) {
  await assertLiveStatusActive(input.statusId);
  await prisma.communityLiveCoHost.deleteMany({
    where: { statusId: input.statusId, userId: input.userId },
  });
  await prisma.communityLiveJoinRequest.updateMany({
    where: { statusId: input.statusId, userId: input.userId },
    data: { state: "rejected" },
  });
  return { left: true };
}

export async function listLiveComments(statusId: string, since?: string) {
  await assertLiveStatusActive(statusId);

  const sinceDate = since ? new Date(since) : null;
  const where =
    sinceDate && !Number.isNaN(sinceDate.getTime())
      ? { statusId, createdAt: { gt: sinceDate } }
      : { statusId };

  const rows = await prisma.communityStatusReply.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: sinceDate ? 80 : 120,
  });

  return rows.map((row) => ({
    id: row.id,
    authorId: row.authorId,
    authorName: row.authorName,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function addLiveComment(input: {
  statusId: string;
  authorId: string;
  authorName: string;
  content: string;
}) {
  await assertLiveStatusActive(input.statusId);

  const content = input.content.trim();
  if (!content) {
    throw new Error("Write a comment.");
  }

  const reply = await prisma.communityStatusReply.create({
    data: {
      id: `livec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      statusId: input.statusId,
      authorId: input.authorId,
      authorName: input.authorName,
      content: content.slice(0, 280),
    },
  });

  return {
    id: reply.id,
    authorId: reply.authorId,
    authorName: reply.authorName,
    content: reply.content,
    createdAt: reply.createdAt.toISOString(),
  };
}

export async function clearLiveSocialData(statusId: string) {
  await prisma.$transaction([
    prisma.communityLiveJoinRequest.deleteMany({ where: { statusId } }),
    prisma.communityLiveCoHost.deleteMany({ where: { statusId } }),
    prisma.communityStatusReply.deleteMany({ where: { statusId } }),
  ]);
}
