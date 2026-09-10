import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  getReadinessStatusForGroup,
  listGroupReadinessCompletionsForLeaders,
  submitMinistryReadiness,
} from "@/lib/ministry-readiness-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId")?.trim();
  if (!groupId) {
    return NextResponse.json({ error: "Group id is required." }, { status: 400 });
  }

  if (searchParams.get("list") === "1") {
    try {
      const completions = await listGroupReadinessCompletionsForLeaders(groupId, user.id);
      return NextResponse.json({ completions });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not load completions." },
        { status: 403 },
      );
    }
  }

  const pack = await getReadinessStatusForGroup(user.id, groupId);
  if (!pack) {
    return NextResponse.json({ required: false, pack: null });
  }

  return NextResponse.json({ required: pack.requiredForSelfJoin, pack });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const groupId = String(body.groupId ?? "").trim();
  const agreed = Boolean(body.agreed);
  const answers =
    body.answers && typeof body.answers === "object"
      ? (body.answers as Record<string, number>)
      : {};

  if (!groupId) {
    return NextResponse.json({ error: "Group id is required." }, { status: 400 });
  }

  try {
    const result = await submitMinistryReadiness({
      user,
      groupId,
      answers,
      agreed,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save readiness." },
      { status: 400 },
    );
  }
}
