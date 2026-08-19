import { promises as fs } from "fs";
import path from "path";
import type { KidsIncident } from "@/lib/kids-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = "kids-incidents.json";

async function readIncidents() {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, FILE), "utf-8");
    return JSON.parse(raw) as KidsIncident[];
  } catch {
    return [];
  }
}

async function writeIncidents(incidents: KidsIncident[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, FILE), JSON.stringify(incidents, null, 2));
}

export async function listKidsIncidents(options?: { service?: string; limit?: number }) {
  let incidents = await readIncidents();
  if (options?.service) {
    incidents = incidents.filter((incident) => incident.service === options.service);
  }
  incidents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (options?.limit) {
    incidents = incidents.slice(0, options.limit);
  }
  return incidents;
}

export async function addKidsIncident(incident: KidsIncident) {
  const incidents = await readIncidents();
  incidents.unshift(incident);
  await writeIncidents(incidents);
  return incident;
}

export async function markKidsIncidentNotified(id: string) {
  const incidents = await readIncidents();
  const index = incidents.findIndex((incident) => incident.id === id);
  if (index === -1) return null;
  incidents[index] = {
    ...incidents[index],
    parentNotified: true,
    notifiedAt: new Date().toISOString(),
  };
  await writeIncidents(incidents);
  return incidents[index];
}
