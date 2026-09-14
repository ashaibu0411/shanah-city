import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getTrainingHandoutsForUser } from "@/lib/training-handouts-server";
import { trainingHandoutAppPath } from "@/lib/training-handouts";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to view training." }, { status: 401 });
  }

  const handouts = await getTrainingHandoutsForUser(user);

  return NextResponse.json({
    handouts: handouts.map((handout) => ({
      slug: handout.slug,
      title: handout.title,
      description: handout.description,
      href: trainingHandoutAppPath(handout.slug),
    })),
  });
}
