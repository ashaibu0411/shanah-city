ALTER TABLE "ChurchEvent" ADD COLUMN "recurringMonthDay" INTEGER;

ALTER TABLE "ChurchEvent" ADD CONSTRAINT "ChurchEvent_recurringMonthDay_check"
CHECK ("recurringMonthDay" IS NULL OR ("recurringMonthDay" BETWEEN 1 AND 31));

CREATE TABLE "WeeklyBulletin" (
  "id" TEXT NOT NULL,
  "weekStart" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeeklyBulletin_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WeeklyBulletin_weekStart_key" ON "WeeklyBulletin"("weekStart");
