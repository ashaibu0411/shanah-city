-- CreateTable
CREATE TABLE "LiveStreamSchedule" (
    "id" TEXT NOT NULL DEFAULT 'upcoming',
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "platform" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveStreamSchedule_pkey" PRIMARY KEY ("id")
);
