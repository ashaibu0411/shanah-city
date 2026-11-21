import { promises as fs } from "fs";
import path from "path";
import type {
  KidsAnnouncement,
  KidsLessonCompletion,
  KidsTeacherAssignment,
  KidsVolunteerProfile,
} from "@/lib/kids-workspace-types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, value: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(value, null, 2));
}

const ASSIGNMENTS = "kids-teacher-assignments.json";
const VOLUNTEERS = "kids-volunteer-profiles.json";
const COMPLETIONS = "kids-lesson-completions.json";
const ANNOUNCEMENTS = "kids-announcements.json";

export async function listKidsAssignments(options?: {
  serviceDate?: string;
  service?: string;
  userId?: string;
}) {
  let rows = await readJson<KidsTeacherAssignment[]>(ASSIGNMENTS, []);
  if (options?.serviceDate) rows = rows.filter((r) => r.serviceDate === options.serviceDate);
  if (options?.service) rows = rows.filter((r) => r.service === options.service);
  if (options?.userId) rows = rows.filter((r) => r.userId === options.userId);
  return rows.sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
}

export async function saveKidsAssignment(assignment: KidsTeacherAssignment) {
  const rows = await readJson<KidsTeacherAssignment[]>(ASSIGNMENTS, []);
  const index = rows.findIndex((r) => r.id === assignment.id);
  if (index === -1) rows.push(assignment);
  else rows[index] = assignment;
  await writeJson(ASSIGNMENTS, rows);
  return assignment;
}

export async function deleteKidsAssignment(id: string) {
  const rows = await readJson<KidsTeacherAssignment[]>(ASSIGNMENTS, []);
  await writeJson(ASSIGNMENTS, rows.filter((r) => r.id !== id));
}

export async function listKidsVolunteerProfiles() {
  return readJson<KidsVolunteerProfile[]>(VOLUNTEERS, []);
}

export async function saveKidsVolunteerProfile(profile: KidsVolunteerProfile) {
  const rows = await readJson<KidsVolunteerProfile[]>(VOLUNTEERS, []);
  const index = rows.findIndex((r) => r.userId === profile.userId);
  if (index === -1) rows.push(profile);
  else rows[index] = profile;
  await writeJson(VOLUNTEERS, rows);
  return profile;
}

export async function listKidsLessonCompletions(options?: { weekStarting?: string; service?: string }) {
  let rows = await readJson<KidsLessonCompletion[]>(COMPLETIONS, []);
  if (options?.weekStarting) rows = rows.filter((r) => r.weekStarting === options.weekStarting);
  if (options?.service) rows = rows.filter((r) => r.service === options.service);
  return rows;
}

export async function saveKidsLessonCompletion(completion: KidsLessonCompletion) {
  const rows = await readJson<KidsLessonCompletion[]>(COMPLETIONS, []);
  const index = rows.findIndex(
    (r) =>
      r.weekStarting === completion.weekStarting &&
      r.ageGroup === completion.ageGroup &&
      r.service === completion.service &&
      r.serviceDate === completion.serviceDate,
  );
  if (index === -1) rows.push(completion);
  else rows[index] = completion;
  await writeJson(COMPLETIONS, rows);
  return completion;
}

export async function listKidsAnnouncements(limit = 30) {
  const rows = await readJson<KidsAnnouncement[]>(ANNOUNCEMENTS, []);
  return rows
    .filter((r) => r.publishedAt)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, limit);
}

export async function saveKidsAnnouncement(announcement: KidsAnnouncement) {
  const rows = await readJson<KidsAnnouncement[]>(ANNOUNCEMENTS, []);
  const index = rows.findIndex((r) => r.id === announcement.id);
  if (index === -1) rows.push(announcement);
  else rows[index] = announcement;
  await writeJson(ANNOUNCEMENTS, rows);
  return announcement;
}