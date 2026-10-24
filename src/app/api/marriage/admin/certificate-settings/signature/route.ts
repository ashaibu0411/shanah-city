import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { readAuthorizedSignatureBytes } from "@/lib/marriage-certificate-settings-server";
import { counselorRouteErrorBody, counselorRouteErrorStatus } from "@/lib/marriage-counselor-api-security";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const bytes = await readAuthorizedSignatureBytes(user);
    if (!bytes) return NextResponse.json({ error: "No signature configured." }, { status: 404 });
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}
