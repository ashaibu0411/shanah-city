export type KidsTeacherRole = "teacher" | "assistant" | "substitute";
export type KidsAssignmentStatus = "pending" | "confirmed" | "needs_replacement" | "declined";

export type KidsLessonCurriculum = {
  bibleStory?: string;
  teachingObjectives?: string;
  discussionQuestions?: string[];
  games?: string;
  crafts?: string;
  activities?: string;
  preparationChecklist?: string[];
  downloadableMaterials?: string;
};

export type KidsTeacherAssignment = {
  id: string;
  userId: string;
  userName: string;
  role: KidsTeacherRole;
  ageGroup: string;
  service: string;
  serviceDate: string;
  status: KidsAssignmentStatus;
  notes?: string;
  assignedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type KidsVolunteerProfile = {
  userId: string;
  userName: string;
  roles: string[];
  onboardingComplete: boolean;
  safeguardingCompletedAt?: string;
  availabilityNotes?: string;
  updatedAt: string;
};

export type KidsLessonCompletion = {
  id: string;
  lessonId: string;
  weekStarting: string;
  ageGroup: string;
  service: string;
  serviceDate: string;
  completedBy: string;
  completedByName: string;
  notes?: string;
  completedAt: string;
};

export type KidsAnnouncement = {
  id: string;
  title: string;
  body: string;
  audience: "all_teachers" | "leaders_only";
  createdBy: string;
  createdByName: string;
  publishedAt?: string;
  createdAt: string;
};

/** Child search hit for teacher check-in (no public exposure). */
export type KidsChildSearchResult = {
  familyMemberId: string;
  childName: string;
  parentUserId: string;
  parentName: string;
  birthYear?: string;
  allergies?: string;
  medicalNotes?: string;
  authorizedPickup?: { name: string; phone?: string; relationship?: string }[];
  suggestedAgeGroup?: string;
};

export type KidsLeaderSnapshot = {
  totalChildrenCheckedIn: number;
  headcount: { ageGroup: string; count: number }[];
  assignmentsToday: number;
  unconfirmedAssignments: number;
  uncoveredRooms: string[];
  publishedLessonsThisWeek: number;
  openIncidents: number;
  volunteersOnboarded: number;
  volunteersNeedingSafeguarding: number;
  upcomingAssignments: KidsTeacherAssignment[];
  attentionItems: string[];
};

export function getServiceDateLabel(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function suggestAgeGroupFromBirthYear(birthYear?: string) {
  if (!birthYear) return undefined;
  const year = Number.parseInt(birthYear, 10);
  if (!Number.isFinite(year)) return undefined;
  const age = new Date().getFullYear() - year;
  if (age <= 2) return "Nursery (0-2)";
  if (age <= 5) return "Preschool (3-5)";
  if (age <= 11) return "Elementary (6-11)";
  return "Youth (12+)";
}