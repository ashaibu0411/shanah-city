import { promises as fs } from "fs";
import path from "path";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

const FILE = path.join(process.cwd(), "data", "urgent-alerts.json");

async function readAlerts() {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as UrgentAlert[];
  } catch {
    return [];
  }
}

async function writeAlerts(alerts: UrgentAlert[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(alerts, null, 2));
}

function isCurrentlyVisible(alert: UrgentAlert, now = new Date()) {
  if (!alert.active) return false;
  if (alert.startsAt && new Date(alert.startsAt) > now) return false;
  if (alert.expiresAt && new Date(alert.expiresAt) <= now) return false;
  return true;
}

export async function listUrgentAlerts() {
  const alerts = await readAlerts();
  return alerts.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getActiveUrgentAlert() {
  const alerts = await listUrgentAlerts();
  return alerts.find((alert) => isCurrentlyVisible(alert)) ?? null;
}

export async function saveUrgentAlert(
  input: Omit<UrgentAlert, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const alerts = await readAlerts();
  const now = new Date().toISOString();
  const id = input.id ?? `urgent-${Date.now()}`;

  if (input.active) {
    for (let index = 0; index < alerts.length; index += 1) {
      if (alerts[index].id !== id && alerts[index].active) {
        alerts[index] = { ...alerts[index], active: false, updatedAt: now };
      }
    }
  }

  const existingIndex = alerts.findIndex((alert) => alert.id === id);
  const record: UrgentAlert = {
    id,
    title: input.title.trim(),
    message: input.message.trim(),
    href: input.href?.trim() || undefined,
    ctaLabel: input.ctaLabel?.trim() || undefined,
    imageUrl: input.imageUrl?.trim() || undefined,
    videoUrl: input.videoUrl?.trim() || undefined,
    active: input.active,
    startsAt: input.startsAt,
    expiresAt: input.expiresAt,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    createdAt: existingIndex === -1 ? now : alerts[existingIndex].createdAt,
    updatedAt: now,
  };

  if (existingIndex === -1) {
    alerts.unshift(record);
  } else {
    alerts[existingIndex] = record;
  }

  await writeAlerts(alerts);
  return record;
}

export async function clearActiveUrgentAlert() {
  const alerts = await readAlerts();
  const now = new Date().toISOString();
  let changed = false;

  for (let index = 0; index < alerts.length; index += 1) {
    if (alerts[index].active) {
      alerts[index] = { ...alerts[index], active: false, updatedAt: now };
      changed = true;
    }
  }

  if (changed) {
    await writeAlerts(alerts);
  }

  return changed;
}
