import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, recordActivity, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getGroupDetail } from "@/lib/group-server";
import {
  isGroupIconRef,
  readGroupIcon,
  removeGroupIcon,
  saveGroupIcon,
} from "@/lib/group-icon-server";

export async function GET(request: Request) {
  const groupId = new URL(request.url).searchParams.get("groupId")?.trim();
  if (!groupId) {
    return NextResponse.json({ error: "groupId is required." }, { status: 400 });
  }

  const group = await getGroupDetail(groupId);
  if (!group?.iconUrl || !isGroupIconRef(group.iconUrl)) {
    return NextResponse.json({ error: "No custom group icon." }, { status: 404 });
  }

  const file = await readGroupIcon(groupId);
  if (!file) {
    return NextResponse.json({ error: "Group icon not found." }, { status: 404 });
  }

  return new NextResponse(file.buffer, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
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
    const groupId = String(formData.get("groupId") ?? "").trim();
    const file = formData.get("file");

    if (!groupId) {
      return NextResponse.json({ error: "Group id is required." }, { status: 400 });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    }

    const actorIsSiteAdmin = await canManageAsAdmin(user);
    const group = await saveGroupIcon(groupId, user.id, file, { actorIsSiteAdmin });

    await recordActivity(user.id, "profile_update", `Updated icon for group "${group.name}"`);

    return NextResponse.json({
      group: await getGroupDetail(groupId, user.id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const groupId = new URL(request.url).searchParams.get("groupId")?.trim();
  if (!groupId) {
    return NextResponse.json({ error: "groupId is required." }, { status: 400 });
  }

  try {
    const actorIsSiteAdmin = await canManageAsAdmin(user);
    const group = await removeGroupIcon(groupId, user.id, { actorIsSiteAdmin });

    await recordActivity(user.id, "profile_update", `Removed icon for group "${group.name}"`);

    return NextResponse.json({
      group: await getGroupDetail(groupId, user.id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not remove icon." },
      { status: 400 },
    );
  }
}
