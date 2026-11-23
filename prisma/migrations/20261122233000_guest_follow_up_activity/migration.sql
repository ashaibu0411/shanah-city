CREATE TABLE "GuestFollowUpActivity" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "note" TEXT,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuestFollowUpActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GuestFollowUpActivity_guestId_createdAt_idx" ON "GuestFollowUpActivity"("guestId", "createdAt");
CREATE INDEX "GuestFollowUpActivity_actorId_createdAt_idx" ON "GuestFollowUpActivity"("actorId", "createdAt");
