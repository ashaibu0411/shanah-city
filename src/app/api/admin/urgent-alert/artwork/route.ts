import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { artworkField, type ArtworkVariant } from "@/lib/content-artwork";
import { saveContentArtwork } from "@/lib/content-artwork-server";
import { getUrgentAlertById, saveUrgentAlert } from "@/lib/urgent-alert-server";

function parseVariant(value: FormDataEntryValue | null): ArtworkVariant | null {
  if (value === "square" || value === "wide" || value === "banner") return value;
  return null;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const formData = await request.formData();
  const alertId = String(formData.get("alertId") ?? "").trim();
  const variant = parseVariant(formData.get("variant"));
  const file = formData.get("file");

  if (!alertId || !variant) {
    return NextResponse.json({ error: "Alert id and artwork variant are required." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  }

  const alert = await getUrgentAlertById(alertId);
  if (!alert) {
    return NextResponse.json({ error: "Alert not found." }, { status: 404 });
  }

  try {
    const url = await saveContentArtwork(file, "urgent-alert", alertId, variant);
    const field = artworkField(variant);
    await saveUrgentAlert({
      ...alert,
      [field]: url,
      createdBy: alert.createdBy,
      createdByName: alert.createdByName,
    });
    revalidatePath("/");
    revalidatePath("/admin/urgent-alert");
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

  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json();
  const alertId = String(body.alertId ?? "").trim();
  const variant = parseVariant(body.variant);

  if (!alertId || !variant) {
    return NextResponse.json({ error: "Alert id and artwork variant are required." }, { status: 400 });
  }

  const alert = await getUrgentAlertById(alertId);
  if (!alert) {
    return NextResponse.json({ error: "Alert not found." }, { status: 404 });
  }

  const field = artworkField(variant);
  await saveUrgentAlert({
    ...alert,
    [field]: undefined,
    createdBy: alert.createdBy,
    createdByName: alert.createdByName,
  });

  revalidatePath("/");
  revalidatePath("/admin/urgent-alert");
  return NextResponse.json({ ok: true });
}
