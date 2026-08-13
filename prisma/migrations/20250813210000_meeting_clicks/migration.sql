-- CreateTable
CREATE TABLE "MeetingClick" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "meetingId" TEXT,
    "meetingTitle" TEXT NOT NULL,
    "groupId" TEXT,
    "groupName" TEXT,
    "campusId" TEXT,
    "platform" TEXT,
    "source" TEXT NOT NULL,
    "joinUrl" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingClick_clickedAt_idx" ON "MeetingClick"("clickedAt");

-- CreateIndex
CREATE INDEX "MeetingClick_groupId_idx" ON "MeetingClick"("groupId");

-- CreateIndex
CREATE INDEX "MeetingClick_meetingId_idx" ON "MeetingClick"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingClick_userId_idx" ON "MeetingClick"("userId");
