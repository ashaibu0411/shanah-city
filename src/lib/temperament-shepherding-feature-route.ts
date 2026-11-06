import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  isTemperamentShepherdingHubEnabled,
} from "@/lib/temperament-shepherding-feature";
import { useDatabase } from "@/lib/use-database";

export async function requireTemperamentShepherdingRequest() {
  if (!isTemperamentShepherdingHubEnabled()) {
    return { error: NextResponse.json({ error: "Temperament hub is not enabled." }, { status: 404 }) };
  }
  if (!useDatabase()) {
    return {
      error: NextResponse.json(
        { error: "Temperament hub requires a database (DATABASE_URL)." },
        { status: 503 },
      ),
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
