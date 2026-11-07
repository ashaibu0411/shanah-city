import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { isAskShepherdEnabledServer } from "@/lib/ask-shepherd-feature";
import { useDatabase } from "@/lib/use-database";

export async function requireAskShepherdApiRequest() {
  if (!isAskShepherdEnabledServer()) {
    return { error: NextResponse.json({ error: "Ask Shepherd is not enabled.", code: "disabled" }, { status: 404 }) };
  }
  if (!useDatabase()) {
    return {
      error: NextResponse.json({ error: "Ask Shepherd requires a database.", code: "no_database" }, { status: 503 }),
    };
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }
  return { user };
}
