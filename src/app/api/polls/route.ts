import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getGroups } from "@/lib/group-server";
import {
  closePoll,
  createPollForUser,
  getPollsForViewer,
  voteOnPoll,
} from "@/lib/poll-server";
import { notifyPollCreated } from "@/lib/push-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId")?.trim() || undefined;
  const polls = await getPollsForViewer(user, groupId);
  return NextResponse.json({ polls });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in to use polls." }, { status: 401 });
  }

  const body = await request.json();
  const action = String(body.action ?? "create");

  try {
    if (action === "vote") {
      const poll = await voteOnPoll(user, String(body.pollId), body.optionIds ?? []);
      if (!poll) {
        return NextResponse.json({ error: "Poll not found." }, { status: 404 });
      }
      return NextResponse.json({ poll });
    }

    if (action === "close") {
      const poll = await closePoll(user, String(body.pollId));
      if (!poll) {
        return NextResponse.json({ error: "Poll not found." }, { status: 404 });
      }
      return NextResponse.json({ poll });
    }

    let targetGroupId = body.targetGroupId ? String(body.targetGroupId).trim() : undefined;
    let targetGroupName = body.targetGroupName ? String(body.targetGroupName).trim() : undefined;

    if (targetGroupId) {
      const groups = await getGroups();
      const group = groups.find((entry) => entry.id === targetGroupId);
      if (!group) {
        return NextResponse.json({ error: "Target group not found." }, { status: 404 });
      }
      targetGroupName = group.name;
    }

    const poll = await createPollForUser(user, {
      question: String(body.question ?? ""),
      description: body.description ? String(body.description) : undefined,
      options: Array.isArray(body.options) ? body.options.map(String) : [],
      allowMultiple: Boolean(body.allowMultiple),
      closesAt: body.closesAt ? String(body.closesAt) : undefined,
      targetGroupId,
      targetGroupName,
      campusId: body.campusId ? String(body.campusId) : undefined,
    });

    await notifyPollCreated({
      authorId: user.id,
      authorName: user.name,
      question: poll.question,
      targetGroupId: poll.targetGroupId,
      targetGroupName: poll.targetGroupName,
    });

    const polls = await getPollsForViewer(user, targetGroupId);
    const view = polls.find((entry) => entry.id === poll.id) ?? poll;
    return NextResponse.json({ poll: view }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    const status = message.includes("Only") || message.includes("cannot") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
