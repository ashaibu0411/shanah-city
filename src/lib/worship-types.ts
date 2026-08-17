import { CALENDAR_GROUP_TABS } from "@/lib/church-groups";

export const WORSHIP_GROUP_ID = CALENDAR_GROUP_TABS.choir;

export const WORSHIP_SERVICE_TIMES = [
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:30", label: "11:30 AM" },
  { value: "19:00", label: "7:00 PM" },
] as const;

export const WORSHIP_ROLES = [
  { value: "worship-leader", label: "Worship leader" },
  { value: "singer", label: "Singer" },
  { value: "musician", label: "Musician" },
  { value: "tech", label: "Tech / media" },
  { value: "other", label: "Other" },
] as const;

export type WorshipServiceTime = (typeof WORSHIP_SERVICE_TIMES)[number]["value"];
export type WorshipRole = (typeof WORSHIP_ROLES)[number]["value"];

export type WorshipSong = {
  id: string;
  title: string;
  key: string;
  bpm?: number;
  notes?: string;
  preparedBy: string[];
};

export type WorshipTeamMember = {
  userId: string;
  name: string;
  role: WorshipRole;
  ready: boolean;
};

export type WorshipServicePlan = {
  id: string;
  serviceDate: string;
  serviceTime: WorshipServiceTime | string;
  title?: string | null;
  status: "draft" | "published";
  songs: WorshipSong[];
  team: WorshipTeamMember[];
  rehearsalNotes?: string | null;
  publishedAt?: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type WorshipTeamReadiness = {
  readyCount: number;
  totalCount: number;
  members: Array<
    WorshipTeamMember & {
      songsPrepared: number;
      songsTotal: number;
    }
  >;
};

export function worshipRoleLabel(role: string) {
  return WORSHIP_ROLES.find((entry) => entry.value === role)?.label ?? role;
}

export function worshipTimeLabel(time: string) {
  return WORSHIP_SERVICE_TIMES.find((entry) => entry.value === time)?.label ?? time;
}

export function createSongId() {
  return `song-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyWorshipSong(title = ""): WorshipSong {
  return {
    id: createSongId(),
    title,
    key: "C",
    preparedBy: [],
  };
}

export function normalizeSongs(songs: WorshipSong[] | undefined) {
  return (songs ?? []).map((song) => ({
    id: song.id || createSongId(),
    title: song.title?.trim() ?? "",
    key: song.key?.trim() || "C",
    bpm: song.bpm,
    notes: song.notes?.trim() || undefined,
    preparedBy: Array.isArray(song.preparedBy) ? [...new Set(song.preparedBy)] : [],
  }));
}

export function normalizeTeam(team: WorshipTeamMember[] | undefined) {
  return (team ?? []).map((member) => ({
    userId: member.userId,
    name: member.name.trim(),
    role: member.role,
    ready: Boolean(member.ready),
  }));
}

export function countSongsPrepared(userId: string, songs: WorshipSong[]) {
  return songs.filter((song) => song.preparedBy.includes(userId)).length;
}

export function buildTeamReadiness(plan: Pick<WorshipServicePlan, "team" | "songs">): WorshipTeamReadiness {
  const songsTotal = plan.songs.length;
  const members = plan.team.map((member) => ({
    ...member,
    songsPrepared: countSongsPrepared(member.userId, plan.songs),
    songsTotal,
  }));

  return {
    readyCount: members.filter((member) => member.ready).length,
    totalCount: members.length,
    members,
  };
}

export function nextServiceSundayIso(reference = new Date()) {
  const date = new Date(reference);
  const day = date.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  date.setDate(date.getDate() + daysUntilSunday);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function serviceDateTimeLabel(serviceDate: string, serviceTime: string) {
  const date = new Date(`${serviceDate}T12:00:00`);
  const day = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  return `${day} · ${worshipTimeLabel(serviceTime)}`;
}
