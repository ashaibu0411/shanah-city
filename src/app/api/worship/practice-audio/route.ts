import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { saveWorshipPracticeStemFile } from "@/lib/worship-audio-server";
import {
  canAccessWorshipPlanner,
  canManageWorshipPlan,
} from "@/lib/worship-access-server";
import { attachMemberPracticeStem } from "@/lib/worship-member-actions-server";
import { getWorshipPlan } from "@/lib/worship-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!(await canAccessWorshipPlanner(user))) {
    return NextResponse.json({ error: "Join Shanah Worship (Choir) under Groups." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const serviceDate = String(formData.get("serviceDate") ?? "").trim();
  const serviceTime = String(formData.get("serviceTime") ?? "").trim();
  const songId = String(formData.get("songId") ?? "").trim();
  const partRole = String(formData.get("partRole") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an audio file to upload." }, { status: 400 });
  }

  const isManager = await canManageWorshipPlan(user);

  try {
    const uploaded = await saveWorshipPracticeStemFile(file);
    const stemMeta = {
      audioUrl: uploaded.url,
      fileName: uploaded.fileName,
      uploadedAt: new Date().toISOString(),
    };

    if (serviceDate && serviceTime && songId && partRole) {
      const plan = await getWorshipPlan(serviceDate, serviceTime);
      if (!plan) {
        return NextResponse.json({ error: "Service plan not found." }, { status: 404 });
      }

      const updated = await attachMemberPracticeStem({
        serviceDate,
        serviceTime,
        songId,
        userId: user.id,
        userName: user.name,
        partRole,
        stem: stemMeta,
        isManager,
      });

      return NextResponse.json({
        url: stemMeta.audioUrl,
        fileName: stemMeta.fileName,
        uploadedAt: stemMeta.uploadedAt,
        status: isManager ? "approved" : "pending",
        plan: updated,
      });
    }

    if (!isManager) {
      return NextResponse.json(
        { error: "Include service date, time, song, and part when uploading your recording." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      url: stemMeta.audioUrl,
      fileName: stemMeta.fileName,
      uploadedAt: stemMeta.uploadedAt,
      status: "approved",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not upload practice track." },
      { status: 400 },
    );
  }
}
