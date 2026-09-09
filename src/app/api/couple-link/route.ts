import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  getCoupleLinkStatus,
  inviteCouplePartner,
  removeCoupleLink,
  respondToCoupleLink,
  saveCoupleAnniversary,
} from "@/lib/couple-link-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const status = await getCoupleLinkStatus(user);
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const action = String(body.action ?? "invite");

  try {
    if (action === "invite") {
      await inviteCouplePartner(user, String(body.email ?? ""));
      const status = await getCoupleLinkStatus(user);
      return NextResponse.json({ ok: true, ...status });
    }

    if (action === "accept" || action === "decline") {
      await respondToCoupleLink(user, String(body.linkId ?? ""), action);
      const status = await getCoupleLinkStatus(user);
      return NextResponse.json({ ok: true, ...status });
    }

    if (action === "remove") {
      await removeCoupleLink(user, String(body.linkId ?? ""));
      const status = await getCoupleLinkStatus(user);
      return NextResponse.json({ ok: true, ...status });
    }

    if (action === "save_anniversary") {
      await saveCoupleAnniversary(user, String(body.anniversaryDate ?? ""));
      const status = await getCoupleLinkStatus(user);
      return NextResponse.json({ ok: true, ...status });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong." },
      { status: 400 },
    );
  }
}
