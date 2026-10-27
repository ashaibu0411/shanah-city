import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  recordMarriageConsent,
  startMarriageJourney,
} from "@/lib/marriage-counseling-server";
import { parseCounselingDeliveryMode, setCoupleCounselingDeliveryMode } from "@/lib/marriage-self-paced-server";
import type { MarriageProgramType } from "@/lib/marriage-counseling-types";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const action = String(body.action ?? "start");

  try {
    if (action === "start") {
      const programType = String(body.programType ?? "premarital") as MarriageProgramType;
      if (!["premarital", "enrichment", "guided"].includes(programType)) {
        return NextResponse.json({ error: "Invalid program." }, { status: 400 });
      }
      const journey = await startMarriageJourney(user, programType);
      return NextResponse.json({ ok: true, journey });
    }
    if (action === "consent") {
      await recordMarriageConsent(user, String(body.journeyId ?? ""));
      return NextResponse.json({ ok: true });
    }
    if (action === "set_counseling_mode") {
      const journeyId = String(body.journeyId ?? "").trim();
      const mode = parseCounselingDeliveryMode(body.mode);
      if (!journeyId || !mode) {
        return NextResponse.json({ error: "journeyId and mode required." }, { status: 400 });
      }
      const journey = await setCoupleCounselingDeliveryMode(user, journeyId, mode);
      return NextResponse.json({ ok: true, counselingDeliveryMode: journey.counselingDeliveryMode ?? mode });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong." },
      { status: 400 },
    );
  }
}
