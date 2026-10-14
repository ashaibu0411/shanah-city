-- CreateTable
CREATE TABLE "ChoirRehearsalLibraryRecording" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'audio',
    "audioUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "durationSeconds" INTEGER,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "uploadStatus" TEXT NOT NULL DEFAULT 'ready',
    "recordedBy" TEXT NOT NULL,
    "recordedByName" TEXT NOT NULL,
    "serviceDate" TEXT,
    "serviceTime" TEXT,
    "songId" TEXT,
    "vocalPart" TEXT,
    "instrumentRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChoirRehearsalLibraryRecording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChoirRehearsalLibraryRecording_groupId_createdAt_idx" ON "ChoirRehearsalLibraryRecording"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "ChoirRehearsalLibraryRecording_recordedBy_idx" ON "ChoirRehearsalLibraryRecording"("recordedBy");

-- CreateIndex
CREATE INDEX "ChoirRehearsalLibraryRecording_category_idx" ON "ChoirRehearsalLibraryRecording"("category");

-- CreateIndex
CREATE INDEX "ChoirRehearsalLibraryRecording_visibility_idx" ON "ChoirRehearsalLibraryRecording"("visibility");

-- CreateIndex
CREATE INDEX "ChoirRehearsalLibraryRecording_uploadStatus_idx" ON "ChoirRehearsalLibraryRecording"("uploadStatus");
