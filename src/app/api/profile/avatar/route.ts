import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getUserFromSession,
  recordActivity,
  SESSION_COOKIE,
  updateUserProfile,
  toPublicMember,
} from "@/lib/auth-server";
import {
  deleteUserAvatar,
  readAvatarFile,
  saveUserAvatar,
} from "@/lib/avatar-server";
import { getMemberAvatarApiUrl } from "@/lib/avatar-utils";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const viewer = await getUserFromSession(token);

  if (!viewer) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? viewer.id;

  const file = await readAvatarFile(userId);
  if (!file) {
    return NextResponse.json({ error: "No profile photo." }, { status: 404 });
  }

  return new NextResponse(file.buffer, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
    }

    const avatarUrl = await saveUserAvatar(user.id, file);
    const updated = await updateUserProfile(user.id, { avatarUrl });

    await recordActivity(user.id, "profile_update", "Updated profile photo");

    return NextResponse.json({
      user: updated ? toPublicMember(updated) : null,
      avatarSrc: getMemberAvatarApiUrl(user.id, avatarUrl),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  await deleteUserAvatar(user.id);
  const updated = await updateUserProfile(user.id, { avatarUrl: "" });

  await recordActivity(user.id, "profile_update", "Removed profile photo");

  return NextResponse.json({
    user: updated ? toPublicMember(updated) : null,
  });
}
