-- CreateTable
CREATE TABLE "MarriagePrepDefaultCounselorSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "counselorUserId" TEXT,
    "automationRequestedByUserId" TEXT,
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarriagePrepDefaultCounselorSetting_pkey" PRIMARY KEY ("id")
);
