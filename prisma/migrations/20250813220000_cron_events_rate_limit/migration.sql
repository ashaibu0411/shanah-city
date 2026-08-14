-- AlterTable
ALTER TABLE "Devotion" ADD COLUMN "notifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ChurchEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "campusId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChurchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitEntry" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("key")
);
