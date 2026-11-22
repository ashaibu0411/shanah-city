-- Kids Ministry workspace: curriculum fields, assignments, volunteers, completions, announcements

ALTER TABLE "KidsLesson" ADD COLUMN IF NOT EXISTS "memoryVerse" TEXT;
ALTER TABLE "KidsLesson" ADD COLUMN IF NOT EXISTS "curriculum" JSONB;
ALTER TABLE "KidsLesson" ADD COLUMN IF NOT EXISTS "materialsUrl" TEXT;
ALTER TABLE "KidsLesson" ADD COLUMN IF NOT EXISTS "assignedToUserId" TEXT;

CREATE TABLE IF NOT EXISTS "KidsTeacherAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KidsTeacherAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "KidsTeacherAssignment_serviceDate_service_idx" ON "KidsTeacherAssignment"("serviceDate", "service");
CREATE INDEX IF NOT EXISTS "KidsTeacherAssignment_userId_serviceDate_idx" ON "KidsTeacherAssignment"("userId", "serviceDate");

CREATE TABLE IF NOT EXISTS "KidsVolunteerProfile" (
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "roles" JSONB,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "safeguardingCompletedAt" TIMESTAMP(3),
    "availabilityNotes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KidsVolunteerProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "KidsLessonCompletion" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "weekStarting" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "completedBy" TEXT NOT NULL,
    "completedByName" TEXT NOT NULL,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KidsLessonCompletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "KidsLessonCompletion_weekStarting_ageGroup_service_serviceDate_key"
ON "KidsLessonCompletion"("weekStarting", "ageGroup", "service", "serviceDate");

CREATE TABLE IF NOT EXISTS "KidsAnnouncement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KidsAnnouncement_pkey" PRIMARY KEY ("id")
);