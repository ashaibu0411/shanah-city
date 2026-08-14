-- AlterTable
ALTER TABLE "Group" ADD COLUMN "requiresApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Group" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Group" ADD COLUMN "signupVisible" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "GroupJoinRequest" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedByName" TEXT,

    CONSTRAINT "GroupJoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroupJoinRequest_status_idx" ON "GroupJoinRequest"("status");
CREATE INDEX "GroupJoinRequest_groupId_idx" ON "GroupJoinRequest"("groupId");
CREATE INDEX "GroupJoinRequest_userId_idx" ON "GroupJoinRequest"("userId");
