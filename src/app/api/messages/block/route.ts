import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getUserFromSession,
  isLeader,
  recordActivity,
  SESSION_COOKIE,
} from "@/lib/auth-server";
import {
  blockUser,
  getBlocksForUser,
  unblockUser,
  getOpenReportsForLeaders,
} from "@/lib/block-server";
import { getMessagesForThread, getOtherParticipant } from "@/lib/message-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const blocks = await getBlocksForUser(user.id);
  const payload: { blocks: typeof blocks; reports?: Awaited<ReturnType<typeof getOpenReportsForLeaders>> } = {
    blocks,
  };

  if (isLeader(user) || user.role === "team") {
    payload.reports = await getOpenReportsForLeaders();
  }

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const action = String(body.action ?? "block");
  let blockedUserId = String(body.userId ?? "");
  let blockedUserName = String(body.userName ?? "Member").trim();
  const threadId = body.threadId ? String(body.threadId) : undefined;

  if (!blockedUserId) {
    return NextResponse.json({ error: "Member id is required." }, { status: 400 });
  }

  try {
    if (action === "unblock") {
      const blocks = await unblockUser(user.id, blockedUserId);
      await recordActivity(user.id, "profile_update", `Unblocked ${blockedUserName}`);
      return NextResponse.json({ blocks });
    }

    if (threadId) {
      const threadData = await getMessagesForThread(threadId, user.id);
      if (threadData) {
        blockedUserName = getOtherParticipant(threadData.thread, user.id);
        const otherId = threadData.thread.participantIds.find((id) => id !== user.id);
        if (otherId) {
          blockedUserId = otherId;
        }
      }
    }

    const block = await blockUser({
      blockerId: user.id,
      blockedUserId,
      blockedUserName,
    });

    await recordActivity(user.id, "profile_update", `Blocked ${blockedUserName} from messages`);

    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Block action failed." },
      { status: 400 },
    );
  }
}
