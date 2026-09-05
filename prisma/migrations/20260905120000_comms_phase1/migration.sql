-- CreateTable
CREATE TABLE "CommsRequest" (
    "id" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "description" TEXT NOT NULL,
    "targetAudience" TEXT,
    "deliverables" JSONB NOT NULL DEFAULT '[]',
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "assigneeId" TEXT,
    "assigneeName" TEXT,
    "requesterId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "calendarItemId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommsRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommsCalendarItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'planned',
    "color" TEXT,
    "body" TEXT,
    "requestId" TEXT,
    "assigneeId" TEXT,
    "assigneeName" TEXT,
    "dueDate" TIMESTAMP(3),
    "promotedAs" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommsCalendarItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommsRequest_status_idx" ON "CommsRequest"("status");

-- CreateIndex
CREATE INDEX "CommsRequest_requesterId_idx" ON "CommsRequest"("requesterId");

-- CreateIndex
CREATE INDEX "CommsRequest_assigneeId_idx" ON "CommsRequest"("assigneeId");

-- CreateIndex
CREATE INDEX "CommsCalendarItem_weekStart_idx" ON "CommsCalendarItem"("weekStart");

-- CreateIndex
CREATE INDEX "CommsCalendarItem_channel_idx" ON "CommsCalendarItem"("channel");

-- CreateIndex
CREATE INDEX "CommsCalendarItem_status_idx" ON "CommsCalendarItem"("status");
