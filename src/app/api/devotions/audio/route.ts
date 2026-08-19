import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canWriteDevotions } from "@/lib/devotion-access-server";
import { devotionGroupMatchHint } from "@/lib/devotion-writers-group";
import { saveDevotionAudioFile } from "@/lib/devotion-audio-server";

const accessError = `Devotion writing is limited to members of ${devotionGroupMatchHint()}.`;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!(await canWriteDevotions(user))) {
    return NextResponse.json({ error: accessError }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose an audio file to upload." }, { status: 400 });
    }

    const uploaded = await saveDevotionAudioFile(file);
    return NextResponse.json(
      { audioUrl: uploaded.url, audioName: uploaded.fileName },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
