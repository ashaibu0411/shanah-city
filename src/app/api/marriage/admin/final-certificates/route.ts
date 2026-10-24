import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  buildFinalCertificateManagementView,
  issueFinalCertificate,
  previewFinalCertificatePdf,
  replaceFinalCertificate,
  revokeFinalCertificate,
} from "@/lib/marriage-certificate-server";
import { counselorRouteErrorBody, counselorRouteErrorStatus } from "@/lib/marriage-counselor-api-security";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const journeyId = new URL(request.url).searchParams.get("journeyId")?.trim();
  if (!journeyId) return NextResponse.json({ error: "journeyId required." }, { status: 400 });
  const preview = new URL(request.url).searchParams.get("preview") === "1";

  try {
    if (preview) {
      const pdf = await previewFinalCertificatePdf(user, journeyId);
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'inline; filename="final-certificate-preview.pdf"',
          "Cache-Control": "no-store",
        },
      });
    }
    const view = await buildFinalCertificateManagementView(user, journeyId);
    return NextResponse.json({ management: view });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const action = String(body.action ?? "");

  try {
    if (action === "issue") {
      const cert = await issueFinalCertificate(user, String(body.journeyId ?? ""), {
        completionDate: body.completionDate ? String(body.completionDate) : null,
      });
      return NextResponse.json({ ok: true, certificate: cert });
    }
    if (action === "revoke") {
      const cert = await revokeFinalCertificate(
        user,
        String(body.certificateId ?? ""),
        String(body.reason ?? ""),
      );
      return NextResponse.json({ ok: true, certificate: cert });
    }
    if (action === "replace") {
      const cert = await replaceFinalCertificate(
        user,
        String(body.certificateId ?? ""),
        String(body.reason ?? ""),
      );
      return NextResponse.json({ ok: true, certificate: cert });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}
