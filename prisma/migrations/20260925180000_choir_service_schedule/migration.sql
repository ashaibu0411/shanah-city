CREATE TABLE "ChoirServiceSchedule" (
    "id" TEXT NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "serviceTime" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "assignments" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdBy" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoirServiceSchedule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChoirServiceSchedule_serviceDate_idx" ON "ChoirServiceSchedule"("serviceDate");
