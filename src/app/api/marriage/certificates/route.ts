import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { buildCoupleCertificatesGallery } from "@/lib/marriage-certificate-server";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const journey = await marriageStore().getActiveJourneyForUser(user.id);
  if (!journey || journey.programType !== "premarital") {
    return NextResponse.json({ error: "No premarital journey." }, { status: 404 });
  }

  try {
    const gallery = await buildCoupleCertificatesGallery(user, journey);
    return NextResponse.json({ gallery, journeyId: journey.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 403 },
    );
  }
}
