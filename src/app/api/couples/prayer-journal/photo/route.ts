import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { assertActiveCoupleWorkspace } from "@/lib/couple-workspace-access-server";
import { readCouplePrayerPhoto, saveCouplePrayerPhoto } from "@/lib/couple-prayer-photo-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim();
  if (!key) {
    return NextResponse.json({ error: "Photo key required." }, { status: 400 });
  }

  try {
    const link = await assertActiveCoupleWorkspace(user);
    const file = await readCouplePrayerPhoto(link.id, key);
    if (!file) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }
    return new NextResponse(file.buffer, {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Not allowed." },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const link = await assertActiveCoupleWorkspace(user);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    }
    const photoKey = await saveCouplePrayerPhoto(link.id, file);
    return NextResponse.json({ photoKey });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
