import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { listRecurringGivingForUser } from "@/lib/giving-billing-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to view recurring giving." }, { status: 401 });
  }

  const result = await listRecurringGivingForUser({
    userId: user.id,
    email: user.email,
  });

  return NextResponse.json(result);
}
