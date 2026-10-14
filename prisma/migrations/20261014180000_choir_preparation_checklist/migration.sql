-- Persist per-member worship preparation checklist (production / Postgres).
CREATE TABLE "ChoirPreparationChecklist" (
    "userId" TEXT NOT NULL,
    "planKey" TEXT NOT NULL,
    "checked" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoirPreparationChecklist_pkey" PRIMARY KEY ("userId","planKey")
);

CREATE INDEX "ChoirPreparationChecklist_userId_idx" ON "ChoirPreparationChecklist"("userId");
