import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getUserFromSession,
  recordActivity,
  SESSION_COOKIE,
} from "@/lib/auth-server";
import { canWriteDevotions } from "@/lib/devotion-access-server";
import { devotionGroupMatchHint } from "@/lib/devotion-writers-group";
import {
  createDevotion,
  deleteDevotion,
  getDevotionById,
  getDevotions,
  updateDevotion,
} from "@/lib/devotion-server";
import { notifyNewDevotion } from "@/lib/push-server";

const accessError = `Devotion writing is limited to members of ${devotionGroupMatchHint()}.`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeUnpublished = searchParams.get("all") === "1";

  if (includeUnpublished) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const user = await getUserFromSession(token);
    if (!(await canWriteDevotions(user))) {
      return NextResponse.json({ error: accessError }, { status: 403 });
    }
    const devotions = await getDevotions({ includeUnpublished: true });
    return NextResponse.json({ devotions, canManage: true });
  }

  const devotions = await getDevotions();
  return NextResponse.json({ devotions });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const body = await request.json();

  if (!(await canWriteDevotions(user))) {
    return NextResponse.json({ error: accessError }, { status: 403 });
  }

  const title = String(body.title ?? "").trim();
  const verse = String(body.verse ?? "").trim();
  const reference = String(body.reference ?? "").trim();
  const content = String(body.content ?? "").trim();
  const prayer = String(body.prayer ?? "").trim();

  if (!title || !verse || !reference || !content || !prayer) {
    return NextResponse.json(
      { error: "Title, verse, reference, content, and prayer are required." },
      { status: 400 },
    );
  }

  const devotion = await createDevotion(
    {
      title,
      verse,
      reference,
      content,
      prayer,
      date: body.date ? String(body.date).trim() : undefined,
      readingTime: body.readingTime ? String(body.readingTime).trim() : undefined,
      published: body.published !== false,
    },
    { id: user!.id, name: user!.name },
  );

  await recordActivity(user!.id, "devotion_published", `Published "${devotion.title}"`);

  if (devotion.published !== false) {
    await notifyNewDevotion({ title: devotion.title, authorId: user!.id });
  }

  return NextResponse.json({ devotion }, { status: 201 });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const body = await request.json();

  if (!(await canWriteDevotions(user))) {
    return NextResponse.json({ error: accessError }, { status: 403 });
  }

  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "Devotion id is required." }, { status: 400 });
  }

  const existing = await getDevotionById(id);
  if (!existing) {
    return NextResponse.json({ error: "Devotion not found." }, { status: 404 });
  }

  const devotion = await updateDevotion(id, {
    title: body.title ? String(body.title).trim() : undefined,
    verse: body.verse ? String(body.verse).trim() : undefined,
    reference: body.reference ? String(body.reference).trim() : undefined,
    content: body.content ? String(body.content).trim() : undefined,
    prayer: body.prayer ? String(body.prayer).trim() : undefined,
    date: body.date ? String(body.date).trim() : undefined,
    readingTime: body.readingTime ? String(body.readingTime).trim() : undefined,
    published:
      typeof body.published === "boolean" ? body.published : undefined,
  });

  if (devotion && devotion.published !== false) {
    await notifyNewDevotion({ title: devotion.title, authorId: user!.id });
  }

  return NextResponse.json({ devotion });
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const body = await request.json();

  if (!(await canWriteDevotions(user))) {
    return NextResponse.json({ error: accessError }, { status: 403 });
  }

  const id = String(body.id ?? "");
  const removed = await deleteDevotion(id);
  if (!removed) {
    return NextResponse.json({ error: "Devotion not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
