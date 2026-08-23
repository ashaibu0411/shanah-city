import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  canManageChurchEvents,
  canManageGroupEvents,
} from "@/lib/group-permissions-server";
import { artworkField, type ArtworkVariant } from "@/lib/content-artwork";
import { getEventById, updateEvent } from "@/lib/event-server";
import { saveContentArtwork } from "@/lib/content-artwork-server";

function parseVariant(value: FormDataEntryValue | null): ArtworkVariant | null {
  if (value === "square" || value === "wide" || value === "banner") return value;
  return null;
}

async function assertCanManageEvent(
  user: Awaited<ReturnType<typeof getUserFromSession>>,
  groupId?: string | null,
) {
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (groupId) {
    if (!(await canManageGroupEvents(user, groupId))) {
      return NextResponse.json(
        { error: "Group admin or Admin Group access required." },
        { status: 403 },
      );
    }
    return null;
  }

  if (!(await canManageChurchEvents(user))) {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  return null;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  const formData = await request.formData();
  const eventId = String(formData.get("eventId") ?? "").trim();
  const variant = parseVariant(formData.get("variant"));
  const file = formData.get("file");

  if (!eventId || !variant) {
    return NextResponse.json({ error: "Event id and artwork variant are required." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  }

  const event = await getEventById(eventId);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const denied = await assertCanManageEvent(user, event.groupId ?? null);
  if (denied) return denied;

  try {
    const url = await saveContentArtwork(file, "event", eventId, variant);
    const field = artworkField(variant);
    await updateEvent(eventId, { [field]: url });
    revalidatePath("/calendar");
    revalidatePath("/");
    return NextResponse.json({ url, variant });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload artwork.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  const body = await request.json();
  const eventId = String(body.eventId ?? "").trim();
  const variant = parseVariant(body.variant);

  if (!eventId || !variant) {
    return NextResponse.json({ error: "Event id and artwork variant are required." }, { status: 400 });
  }

  const event = await getEventById(eventId);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const denied = await assertCanManageEvent(user, event.groupId ?? null);
  if (denied) return denied;

  const field = artworkField(variant);
  const updated = await updateEvent(eventId, { [field]: null });
  if (!updated) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
