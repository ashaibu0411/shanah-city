-- CreateTable
CREATE TABLE "GroupServiceRoster" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "serviceTime" TEXT NOT NULL,
    "title" TEXT,
    "assignments" JSONB NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupServiceRoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupRosterTemplate" (
    "groupId" TEXT NOT NULL,
    "roles" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupRosterTemplate_pkey" PRIMARY KEY ("groupId")
);

-- CreateIndex
CREATE INDEX "GroupServiceRoster_groupId_serviceDate_idx" ON "GroupServiceRoster"("groupId", "serviceDate");

-- CreateIndex
CREATE INDEX "GroupServiceRoster_status_idx" ON "GroupServiceRoster"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GroupServiceRoster_groupId_serviceDate_serviceTime_key" ON "GroupServiceRoster"("groupId", "serviceDate", "serviceTime");
