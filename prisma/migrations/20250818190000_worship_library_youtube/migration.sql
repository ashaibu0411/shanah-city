-- AlterTable
ALTER TABLE "WorshipSongLibrary" ADD COLUMN "youtubeVideoId" TEXT;
ALTER TABLE "WorshipSongLibrary" ADD COLUMN "youtubeUrl" TEXT;

-- CreateIndex
CREATE INDEX "WorshipSongLibrary_youtubeVideoId_idx" ON "WorshipSongLibrary"("youtubeVideoId");
