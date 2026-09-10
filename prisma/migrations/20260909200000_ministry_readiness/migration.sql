-- CreateTable
CREATE TABLE "MinistryReadinessCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readinessKey" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "agreedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MinistryReadinessCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MinistryReadinessCompletion_groupId_agreedAt_idx" ON "MinistryReadinessCompletion"("groupId", "agreedAt");

-- CreateIndex
CREATE INDEX "MinistryReadinessCompletion_readinessKey_idx" ON "MinistryReadinessCompletion"("readinessKey");

-- CreateIndex
CREATE UNIQUE INDEX "MinistryReadinessCompletion_userId_readinessKey_key" ON "MinistryReadinessCompletion"("userId", "readinessKey");
