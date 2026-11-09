CREATE TABLE "GivingStripeMemberSyncLease" (
    "userId" TEXT NOT NULL,
    "holderId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GivingStripeMemberSyncLease_pkey" PRIMARY KEY ("userId")
);
