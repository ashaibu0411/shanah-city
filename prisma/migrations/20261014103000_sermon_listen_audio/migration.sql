-- CreateTable
CREATE TABLE "SermonListenAudio" (
    "youtubeVideoId" TEXT NOT NULL,
    "title" TEXT,
    "audioUrl" TEXT NOT NULL,
    "audioFileName" TEXT,
    "uploadedById" TEXT,
    "uploadedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SermonListenAudio_pkey" PRIMARY KEY ("youtubeVideoId")
);
