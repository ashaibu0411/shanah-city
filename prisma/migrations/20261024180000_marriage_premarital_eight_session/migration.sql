-- CreateTable
CREATE TABLE "MarriagePremaritalProgramSession" (
    "journeyId" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "privateNotes" TEXT,
    "checklistJson" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "MarriagePremaritalProgramSession_pkey" PRIMARY KEY ("journeyId","sessionKey")
);

-- CreateTable
CREATE TABLE "MarriagePremaritalProgramMeta" (
    "journeyId" TEXT NOT NULL,
    "pausedAt" TIMESTAMP(3),
    "extraSessionCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriagePremaritalProgramMeta_pkey" PRIMARY KEY ("journeyId")
);

-- CreateIndex
CREATE INDEX "MarriagePremaritalProgramSession_journeyId_idx" ON "MarriagePremaritalProgramSession"("journeyId");
