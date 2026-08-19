import { CALENDAR_GROUP_TABS } from "@/lib/church-groups";

export const WORSHIP_GROUP_ID = CALENDAR_GROUP_TABS.choir;

/** Lakewood-style multi-service schedule — edit times here as Shanah grows. */
export const WORSHIP_SERVICE_SCHEDULE = [
  { value: "09:00", label: "9:00 AM", serviceType: "sunday", kind: "Sunday service" },
  { value: "10:00", label: "10:00 AM", serviceType: "sunday", kind: "Sunday service" },
  { value: "11:30", label: "11:30 AM", serviceType: "sunday", kind: "Sunday service" },
  { value: "19:00", label: "7:00 PM", serviceType: "friday", kind: "Friday worship" },
] as const;

export const WORSHIP_SERVICE_TIMES = WORSHIP_SERVICE_SCHEDULE.map((slot) => ({
  value: slot.value,
  label: slot.label,
}));

export const WORSHIP_SONG_SEGMENTS = [
  { value: "opener", label: "Opener / intro" },
  { value: "worship", label: "Worship set" },
  { value: "response", label: "Response" },
  { value: "offering", label: "Offering" },
  { value: "communion", label: "Communion" },
  { value: "closing", label: "Closing" },
] as const;

export const WORSHIP_ROLES = [
  { value: "worship-leader", label: "Worship leader" },
  { value: "singer", label: "Singer" },
  { value: "musician", label: "Musician" },
  { value: "tech", label: "Tech / media" },
  { value: "other", label: "Other" },
] as const;

/** Vocal / instrument parts for choir workspace and “My part” view. */
export const WORSHIP_PART_ROLES = [
  { value: "soprano", label: "Soprano", kind: "vocal" as const },
  { value: "alto", label: "Alto", kind: "vocal" as const },
  { value: "tenor", label: "Tenor", kind: "vocal" as const },
  { value: "bass", label: "Bass", kind: "vocal" as const },
  { value: "drums", label: "Drums", kind: "instrument" as const },
  { value: "bass-guitar", label: "Bass guitar", kind: "instrument" as const },
  { value: "electric-guitar", label: "Electric guitar", kind: "instrument" as const },
  { value: "acoustic-guitar", label: "Acoustic guitar", kind: "instrument" as const },
  { value: "keys", label: "Keys / piano", kind: "instrument" as const },
  { value: "other", label: "Other", kind: "instrument" as const },
] as const;

/** Practice / stem tracks leaders upload so each part can listen in isolation. */
export const WORSHIP_PRACTICE_REFERENCE_STEMS = [
  { value: "full", label: "Full mix" },
  { value: "vocals", label: "All vocals / choir" },
  { value: "instrumental", label: "Instrumental (minus vocals)" },
] as const;

export type WorshipPracticeStemRole =
  | WorshipPartRole
  | (typeof WORSHIP_PRACTICE_REFERENCE_STEMS)[number]["value"];

export type WorshipServiceTime = (typeof WORSHIP_SERVICE_SCHEDULE)[number]["value"];
export type WorshipServiceType = "sunday" | "friday" | "special";
export type WorshipRole = (typeof WORSHIP_ROLES)[number]["value"];
export type WorshipPartRole = (typeof WORSHIP_PART_ROLES)[number]["value"];
export type WorshipSongSegment = (typeof WORSHIP_SONG_SEGMENTS)[number]["value"];

export type WorshipSongPart = {
  role: WorshipPartRole | string;
  notes: string;
};

export type WorshipPracticeStem = {
  role: WorshipPracticeStemRole | string;
  audioUrl: string;
  fileName: string;
  uploadedAt?: string;
};

export type WorshipSong = {
  id: string;
  librarySongId?: string;
  title: string;
  key: string;
  originalKey?: string;
  bpm?: number;
  notes?: string;
  lyrics?: string;
  parts?: WorshipSongPart[];
  practiceStems?: WorshipPracticeStem[];
  youtubeVideoId?: string;
  youtubeUrl?: string;
  chartUrl?: string;
  chartFileName?: string;
  leaderUserId?: string;
  leaderName?: string;
  segment?: WorshipSongSegment;
  order?: number;
  preparedBy: string[];
};

export type WorshipTeamMember = {
  userId: string;
  name: string;
  role: WorshipRole;
  partRole?: WorshipPartRole | string;
  ready: boolean;
};

export type WorshipRehearsalRecording = {
  id: string;
  serviceDate: string;
  serviceTime: string;
  title: string;
  audioUrl: string;
  fileName: string;
  durationSeconds?: number;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
};

export type WorshipServicePlan = {
  id: string;
  serviceDate: string;
  serviceTime: WorshipServiceTime | string;
  serviceType: WorshipServiceType;
  title?: string | null;
  status: "draft" | "published";
  songs: WorshipSong[];
  team: WorshipTeamMember[];
  rehearsalNotes?: string | null;
  rehearsalDate?: string | null;
  rehearsalTime?: string | null;
  calendarEventId?: string | null;
  reminderSentAt?: string | null;
  publishedAt?: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type WorshipLibrarySong = {
  id: string;
  title: string;
  artist?: string | null;
  defaultKey: string;
  bpm?: number | null;
  ccliNumber?: string | null;
  youtubeVideoId?: string | null;
  youtubeUrl?: string | null;
  chartUrl?: string | null;
  chartFileName?: string | null;
  notes?: string | null;
  tags?: string[];
  useCount: number;
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

export function worshipPartLabel(role: string) {
  return WORSHIP_PART_ROLES.find((entry) => entry.value === role)?.label ?? role;
}

export function defaultSongParts(): WorshipSongPart[] {
  return WORSHIP_PART_ROLES.map((entry) => ({ role: entry.value, notes: "" }));
}

export function normalizeSongParts(parts: WorshipSongPart[] | undefined): WorshipSongPart[] {
  const map = new Map((parts ?? []).map((part) => [part.role, part.notes ?? ""]));
  return WORSHIP_PART_ROLES.map((entry) => ({
    role: entry.value,
    notes: map.get(entry.value)?.trim() ?? "",
  }));
}

export function getSongPartNotes(song: WorshipSong, partRole: string) {
  const part = normalizeSongParts(song.parts).find((entry) => entry.role === partRole);
  return part?.notes?.trim() ?? "";
}

export function worshipPracticeStemLabel(role: string) {
  const reference = WORSHIP_PRACTICE_REFERENCE_STEMS.find((entry) => entry.value === role);
  if (reference) return reference.label;
  return worshipPartLabel(role);
}

export function normalizePracticeStems(stems: WorshipPracticeStem[] | undefined) {
  return (stems ?? [])
    .filter((stem) => stem.audioUrl?.trim())
    .map((stem) => ({
      role: stem.role,
      audioUrl: stem.audioUrl.trim(),
      fileName: stem.fileName?.trim() || "audio",
      uploadedAt: stem.uploadedAt,
    }));
}

export function getSongPracticeStem(song: WorshipSong, role: string) {
  return normalizePracticeStems(song.practiceStems).find((stem) => stem.role === role);
}

export function upsertPracticeStem(
  stems: WorshipPracticeStem[] | undefined,
  role: string,
  stem: Omit<WorshipPracticeStem, "role">,
) {
  const next = normalizePracticeStems(stems).filter((entry) => entry.role !== role);
  return [...next, { role, ...stem }];
}

export function removePracticeStem(stems: WorshipPracticeStem[] | undefined, role: string) {
  return normalizePracticeStems(stems).filter((entry) => entry.role !== role);
}

export function listPracticeTracksForPart(song: WorshipSong, partRole: string) {
  const stems = normalizePracticeStems(song.practiceStems);
  if (stems.length === 0) return [];

  const orderedRoles = [
    partRole,
    "full",
    "instrumental",
    "vocals",
    ...WORSHIP_PART_ROLES.map((entry) => entry.value),
  ];

  const seen = new Set<string>();
  const tracks: WorshipPracticeStem[] = [];

  for (const role of orderedRoles) {
    const stem = stems.find((entry) => entry.role === role);
    if (!stem || seen.has(stem.role)) continue;
    seen.add(stem.role);
    tracks.push(stem);
  }

  for (const stem of stems) {
    if (seen.has(stem.role)) continue;
    seen.add(stem.role);
    tracks.push(stem);
  }

  return tracks;
}

export function worshipTimeLabel(time: string) {
  return WORSHIP_SERVICE_TIMES.find((entry) => entry.value === time)?.label ?? time;
}

export function worshipSegmentLabel(segment: string) {
  return WORSHIP_SONG_SEGMENTS.find((entry) => entry.value === segment)?.label ?? segment;
}

export function serviceTypeForTime(time: string): WorshipServiceType {
  const slot = WORSHIP_SERVICE_SCHEDULE.find((entry) => entry.value === time);
  return (slot?.serviceType as WorshipServiceType) ?? "special";
}

export function createSongId() {
  return `song-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function songFromLibrary(entry: WorshipLibrarySong): WorshipSong {
  return {
    id: createSongId(),
    librarySongId: entry.id,
    title: entry.title,
    key: entry.defaultKey,
    originalKey: entry.defaultKey,
    bpm: entry.bpm ?? undefined,
    notes: entry.notes ?? undefined,
    lyrics: undefined,
    parts: defaultSongParts(),
    youtubeVideoId: entry.youtubeVideoId ?? undefined,
    youtubeUrl: entry.youtubeUrl ?? undefined,
    chartUrl: entry.chartUrl ?? undefined,
    chartFileName: entry.chartFileName ?? undefined,
    segment: "worship",
    preparedBy: [],
  };
}

export function emptyWorshipSong(title = ""): WorshipSong {
  return {
    id: createSongId(),
    title,
    key: "C",
    originalKey: "C",
    lyrics: "",
    parts: defaultSongParts(),
    segment: "worship",
    preparedBy: [],
  };
}

export function normalizeSongs(songs: WorshipSong[] | undefined) {
  return (songs ?? [])
    .map((song, index) => {
      const key = song.key?.trim() || "C";
      return {
        id: song.id || createSongId(),
        librarySongId: song.librarySongId,
        title: song.title?.trim() ?? "",
        key,
        originalKey: song.originalKey?.trim() || key,
        bpm: song.bpm,
        notes: song.notes?.trim() || undefined,
        lyrics: song.lyrics?.trim() || undefined,
        parts: normalizeSongParts(song.parts),
        practiceStems: normalizePracticeStems(song.practiceStems),
        youtubeVideoId: song.youtubeVideoId?.trim() || undefined,
        youtubeUrl: song.youtubeUrl?.trim() || undefined,
        chartUrl: song.chartUrl?.trim() || undefined,
        chartFileName: song.chartFileName?.trim() || undefined,
        leaderUserId: song.leaderUserId,
        leaderName: song.leaderName?.trim() || undefined,
        segment: song.segment || "worship",
        order: song.order ?? index + 1,
        preparedBy: Array.isArray(song.preparedBy) ? [...new Set(song.preparedBy)] : [],
      };
    })
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
}

export function normalizeTeam(team: WorshipTeamMember[] | undefined) {
  return (team ?? []).map((member) => ({
    userId: member.userId,
    name: member.name.trim(),
    role: member.role,
    partRole: member.partRole?.trim() || undefined,
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

export function previousSundayIso(serviceDate: string) {
  const date = new Date(`${serviceDate}T12:00:00`);
  date.setDate(date.getDate() - 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Clone setlist + roster for a new service; resets readiness and song prep tracking. */
export function clonePlanContent(
  source: Pick<WorshipServicePlan, "songs" | "team" | "title" | "rehearsalNotes">,
) {
  return {
    title: source.title?.trim() || undefined,
    songs: normalizeSongs(
      source.songs.map((song) => ({
        ...song,
        id: createSongId(),
        preparedBy: [],
      })),
    ),
    team: normalizeTeam(source.team.map((member) => ({ ...member, ready: false }))),
    rehearsalNotes: source.rehearsalNotes?.trim() || undefined,
  };
}

export function suggestedRehearsalDate(serviceDate: string) {
  const date = new Date(`${serviceDate}T12:00:00`);
  date.setDate(date.getDate() - 1);
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

export function rehearsalDateTimeLabel(rehearsalDate?: string | null, rehearsalTime?: string | null) {
  if (!rehearsalDate) return "Not scheduled";
  const time = rehearsalTime ? worshipTimeLabel(rehearsalTime) : "Time TBD";
  const date = new Date(`${rehearsalDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${date} · ${time}`;
}

export function combinePlanDateTime(date: string, time: string) {
  return new Date(`${date}T${time || "19:00"}:00`);
}
