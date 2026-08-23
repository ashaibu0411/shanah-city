-- AlterTable
ALTER TABLE "ChurchEvent" ADD COLUMN "rsvpEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ChurchEvent" ADD COLUMN "rsvpAudience" TEXT;
ALTER TABLE "ChurchEvent" ADD COLUMN "rsvpGroupId" TEXT;
ALTER TABLE "ChurchEvent" ADD COLUMN "rsvpGroupName" TEXT;
ALTER TABLE "ChurchEvent" ADD COLUMN "rsvpDeadline" TIMESTAMP(3);
ALTER TABLE "ChurchEvent" ADD COLUMN "rsvpCapacity" INTEGER;
ALTER TABLE "ChurchEvent" ADD COLUMN "rsvpInstructions" TEXT;

-- CreateTable
CREATE TABLE "EventRsvp" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventRsvp_eventId_status_idx" ON "EventRsvp"("eventId", "status");

-- CreateIndex
CREATE INDEX "EventRsvp_userId_idx" ON "EventRsvp"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRsvp_eventId_userId_key" ON "EventRsvp"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ChurchEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
