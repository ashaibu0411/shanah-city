import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  generateSessionCertificatePdfForCounselor,
  generateSessionCertificatePdfForViewer,
} from "@/lib/marriage-certificate-server";
type Params = { params: Promise<{ sessionKey: string }> };

export async function GET(request: Request, { params }: Params) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const journeyId = new URL(request.url).searchParams.get("journeyId")?.trim();
  if (!journeyId) return NextResponse.json({ error: "journeyId required." }, { status: 400 });

  const { sessionKey } = await params;
  try {
    let pdf: Uint8Array;
    try {
      pdf = await generateSessionCertificatePdfForViewer(user, journeyId, sessionKey);
    } catch {
      pdf = await generateSessionCertificatePdfForCounselor(user, journeyId, sessionKey);
    }
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="session-${sessionKey}-certificate.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Download failed." },
      { status: 403 },
    );
  }
}
