import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getUserFromSession,
  recordActivity,
  SESSION_COOKIE,
} from "@/lib/auth-server";
import { blockUser, reportMember } from "@/lib/block-server";
import { getMessagesForThread, getOtherParticipant } from "@/lib/message-server";
import { site } from "@/lib/site";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const reportedUserId = String(body.userId ?? "");
  let reportedUserName = String(body.userName ?? "Member").trim();
  const threadId = body.threadId ? String(body.threadId) : undefined;
  const reason = String(body.reason ?? "").trim();
  const alsoBlock = body.alsoBlock !== false;

  if (!reportedUserId) {
    return NextResponse.json({ error: "Member id is required." }, { status: 400 });
  }

  try {
    if (threadId) {
      const threadData = await getMessagesForThread(threadId, user.id);
      if (threadData) {
        reportedUserName = getOtherParticipant(threadData.thread, user.id);
      }
    }

    const report = await reportMember({
      reporterId: user.id,
      reporterName: user.name,
      reportedUserId,
      reportedUserName,
      threadId,
      reason:
        reason ||
        `Member reported ${reportedUserName} for inappropriate messages. Church office: ${site.email}`,
    });

    if (alsoBlock) {
      await blockUser({
        blockerId: user.id,
        blockedUserId: reportedUserId,
        blockedUserName: reportedUserName,
      });
    }

    await recordActivity(
      user.id,
      "profile_update",
      `Reported ${reportedUserName} to church leaders`,
    );

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report failed." },
      { status: 400 },
    );
  }
}
