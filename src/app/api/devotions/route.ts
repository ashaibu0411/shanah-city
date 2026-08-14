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
import {
  estimateReadingTime,
  resolveDevotionPublishFields,
  shouldNotifyDevotionPublish,
  type DevotionPublishMode,
} from "@/lib/devotion-utils";
import { notifyNewDevotion } from "@/lib/push-server";
import { markDevotionNotified } from "@/lib/devotion-server";

const accessError = `Devotion writing is limited to members of ${devotionGroupMatchHint()}.`;

function parseScheduleBody(body: Record<string, unknown>) {
  return resolveDevotionPublishFields({
    publishMode: body.publishMode as DevotionPublishMode | undefined,
    scheduleDate: body.scheduleDate ? String(body.scheduleDate) : undefined,
    scheduleTime: body.scheduleTime ? String(body.scheduleTime) : undefined,
  });
}

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

  const schedule = parseScheduleBody(body);
  const readingTime = estimateReadingTime({ verse, content, prayer });

  const devotion = await createDevotion(
    {
      title,
      verse,
      reference,
      content,
      prayer,
      date: schedule.date,
      readingTime,
      published: schedule.published,
      publishAt: schedule.publishAt,
    },
    { id: user!.id, name: user!.name },
  );

  await recordActivity(
    user!.id,
    "devotion_published",
    schedule.published
      ? `Saved "${devotion.title}" (${schedule.publishAt ? "scheduled" : "published"})`
      : `Saved draft "${devotion.title}"`,
  );

  if (shouldNotifyDevotionPublish(devotion)) {
    await notifyNewDevotion({ title: devotion.title, authorId: user!.id });
    await markDevotionNotified(devotion.id);
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

  const schedule = parseScheduleBody(body);
  const verse = body.verse ? String(body.verse).trim() : existing.verse;
  const content = body.content ? String(body.content).trim() : existing.content;
  const prayer = body.prayer ? String(body.prayer).trim() : existing.prayer;

  const devotion = await updateDevotion(id, {
    title: body.title ? String(body.title).trim() : undefined,
    verse: body.verse ? String(body.verse).trim() : undefined,
    reference: body.reference ? String(body.reference).trim() : undefined,
    content: body.content ? String(body.content).trim() : undefined,
    prayer: body.prayer ? String(body.prayer).trim() : undefined,
    date: schedule.date,
    readingTime: estimateReadingTime({ verse, content, prayer }),
    published: schedule.published,
    publishAt: schedule.publishAt,
  });

  if (devotion && shouldNotifyDevotionPublish(devotion)) {
    await notifyNewDevotion({ title: devotion.title, authorId: user!.id });
    await markDevotionNotified(devotion.id);
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
