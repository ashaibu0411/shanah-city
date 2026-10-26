import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getMarriageHubSummary } from "@/lib/marriage-counseling-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  try {
    const summary = await getMarriageHubSummary(user);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[api/marriage/hub] GET failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load Marriage Prep. Try again in a moment.",
      },
      { status: 500 },
    );
  }
}
