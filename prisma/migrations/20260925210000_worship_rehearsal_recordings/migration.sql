-- CreateTable
CREATE TABLE "WorshipRehearsalRecording" (
    "id" TEXT NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "serviceTime" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "recordedBy" TEXT NOT NULL,
    "recordedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorshipRehearsalRecording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorshipRehearsalRecording_serviceDate_serviceTime_idx" ON "WorshipRehearsalRecording"("serviceDate", "serviceTime");

-- CreateIndex
CREATE INDEX "WorshipRehearsalRecording_recordedBy_idx" ON "WorshipRehearsalRecording"("recordedBy");
