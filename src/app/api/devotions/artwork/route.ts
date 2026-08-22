import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canWriteDevotions } from "@/lib/devotion-access-server";
import { devotionArtworkField, type ArtworkVariant } from "@/lib/devotion-artwork";
import { getDevotionById, updateDevotion } from "@/lib/devotion-server";
import { saveContentArtwork } from "@/lib/content-artwork-server";
import { devotionGroupMatchHint } from "@/lib/devotion-writers-group";

const accessError = `Devotion writing is limited to members of ${devotionGroupMatchHint()}.`;

function parseVariant(value: FormDataEntryValue | null): ArtworkVariant | null {
  if (value === "square" || value === "wide" || value === "banner") return value;
  return null;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!(await canWriteDevotions(user))) {
    return NextResponse.json({ error: accessError }, { status: 403 });
  }

  const formData = await request.formData();
  const devotionId = String(formData.get("devotionId") ?? "").trim();
  const variant = parseVariant(formData.get("variant"));
  const file = formData.get("file");

  if (!devotionId || !variant) {
    return NextResponse.json({ error: "Devotion id and artwork variant are required." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  }

  const devotion = await getDevotionById(devotionId);
  if (!devotion) {
    return NextResponse.json({ error: "Devotion not found." }, { status: 404 });
  }

  try {
    const url = await saveContentArtwork(file, "devotion", devotionId, variant);
    const field = devotionArtworkField(variant);
    await updateDevotion(devotionId, { [field]: url });
    revalidatePath("/");
    revalidatePath("/devotions");
    revalidatePath("/admin/devotions");
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
  if (!(await canWriteDevotions(user))) {
    return NextResponse.json({ error: accessError }, { status: 403 });
  }

  const body = await request.json();
  const devotionId = String(body.devotionId ?? "").trim();
  const variant = parseVariant(body.variant);

  if (!devotionId || !variant) {
    return NextResponse.json({ error: "Devotion id and artwork variant are required." }, { status: 400 });
  }

  const field = devotionArtworkField(variant);
  const devotion = await updateDevotion(devotionId, { [field]: null });
  if (!devotion) {
    return NextResponse.json({ error: "Devotion not found." }, { status: 404 });
  }

  revalidatePath("/");
  revalidatePath("/devotions");
  revalidatePath("/admin/devotions");
  return NextResponse.json({ ok: true });
}
