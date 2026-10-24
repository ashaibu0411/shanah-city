import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  getCertificateSettingsView,
  removeCertificateSignature,
  uploadCertificateSignature,
} from "@/lib/marriage-certificate-settings-server";
import { counselorRouteErrorBody, counselorRouteErrorStatus } from "@/lib/marriage-counselor-api-security";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const settings = await getCertificateSettingsView(user);
    return NextResponse.json({ settings });
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

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const action = String(form.get("action") ?? "");
      if (action === "upload_signature") {
        const file = form.get("file");
        if (!(file instanceof File)) {
          return NextResponse.json({ error: "Signature file required." }, { status: 400 });
        }
        const settings = await uploadCertificateSignature(user, file);
        return NextResponse.json({ ok: true, settings });
      }
      if (action === "remove_signature") {
        const settings = await removeCertificateSignature(user, String(form.get("note") ?? ""));
        return NextResponse.json({ ok: true, settings });
      }
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    const body = await request.json();
    if (body.action === "remove_signature") {
      const settings = await removeCertificateSignature(user, body.note ? String(body.note) : undefined);
      return NextResponse.json({ ok: true, settings });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}
