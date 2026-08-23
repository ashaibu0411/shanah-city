import { prisma } from "@/lib/db";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

function mapAlert(record: {
  id: string;
  title: string;
  message: string;
  href: string | null;
  ctaLabel: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  artworkSquareUrl: string | null;
  artworkWideUrl: string | null;
  artworkBannerUrl: string | null;
  active: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}): UrgentAlert {
  return {
    id: record.id,
    title: record.title,
    message: record.message,
    href: record.href ?? undefined,
    ctaLabel: record.ctaLabel ?? undefined,
    imageUrl: record.imageUrl ?? undefined,
    videoUrl: record.videoUrl ?? undefined,
    artworkSquareUrl: record.artworkSquareUrl ?? undefined,
    artworkWideUrl: record.artworkWideUrl ?? undefined,
    artworkBannerUrl: record.artworkBannerUrl ?? undefined,
    active: record.active,
    startsAt: record.startsAt?.toISOString(),
    expiresAt: record.expiresAt?.toISOString(),
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function isCurrentlyVisible(alert: UrgentAlert, now = new Date()) {
  if (!alert.active) return false;
  if (alert.startsAt && new Date(alert.startsAt) > now) return false;
  if (alert.expiresAt && new Date(alert.expiresAt) <= now) return false;
  return true;
}

export async function listUrgentAlerts() {
  const records = await prisma.urgentAlert.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return records.map(mapAlert);
}

export async function getActiveUrgentAlert() {
  const now = new Date();
  const records = await prisma.urgentAlert.findMany({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });

  for (const record of records) {
    const alert = mapAlert(record);
    if (isCurrentlyVisible(alert, now)) {
      return alert;
    }
  }

  return null;
}

export async function getUrgentAlertById(id: string) {
  const record = await prisma.urgentAlert.findUnique({ where: { id } });
  return record ? mapAlert(record) : null;
}

export async function saveUrgentAlert(
  input: Omit<UrgentAlert, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const now = new Date();
  const id = input.id ?? `urgent-${Date.now()}`;

  if (input.active) {
    await prisma.urgentAlert.updateMany({
      where: { active: true, NOT: { id } },
      data: { active: false, updatedAt: now },
    });
  }

  const record = await prisma.urgentAlert.upsert({
    where: { id },
    create: {
      id,
      title: input.title.trim(),
      message: input.message.trim(),
      href: input.href?.trim() || null,
      ctaLabel: input.ctaLabel?.trim() || null,
      imageUrl: input.imageUrl?.trim() || null,
      videoUrl: input.videoUrl?.trim() || null,
      artworkSquareUrl: input.artworkSquareUrl?.trim() || null,
      artworkWideUrl: input.artworkWideUrl?.trim() || null,
      artworkBannerUrl: input.artworkBannerUrl?.trim() || null,
      active: input.active,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      createdBy: input.createdBy,
      createdByName: input.createdByName,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      title: input.title.trim(),
      message: input.message.trim(),
      href: input.href?.trim() || null,
      ctaLabel: input.ctaLabel?.trim() || null,
      imageUrl: input.imageUrl?.trim() || null,
      videoUrl: input.videoUrl?.trim() || null,
      artworkSquareUrl: input.artworkSquareUrl?.trim() || null,
      artworkWideUrl: input.artworkWideUrl?.trim() || null,
      artworkBannerUrl: input.artworkBannerUrl?.trim() || null,
      active: input.active,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      updatedAt: now,
    },
  });

  return mapAlert(record);
}

export async function clearActiveUrgentAlert() {
  const result = await prisma.urgentAlert.updateMany({
    where: { active: true },
    data: { active: false, updatedAt: new Date() },
  });
  return result.count > 0;
}
