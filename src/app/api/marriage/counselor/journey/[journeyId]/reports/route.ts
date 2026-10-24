import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import type { MarriagePastoralReportKind } from "@/lib/marriage-certificate-types";
import { buildPastoralReportText } from "@/lib/marriage-pastoral-reports-server";
import { counselorRouteErrorBody, counselorRouteErrorStatus } from "@/lib/marriage-counselor-api-security";

type Params = { params: Promise<{ journeyId: string }> };

const KINDS: MarriagePastoralReportKind[] = [
  "progress",
  "attendance",
  "homework",
  "supplementary",
  "outstanding",
  "completion",
];

export async function GET(request: Request, { params }: Params) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { journeyId } = await params;
  const kind = new URL(request.url).searchParams.get("kind")?.trim() as MarriagePastoralReportKind;
  if (!kind || !KINDS.includes(kind)) {
    return NextResponse.json({ error: "Valid kind required." }, { status: 400 });
  }

  try {
    const text = await buildPastoralReportText(user, journeyId, kind);
    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="marriage-prep-${kind}-report.txt"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}
