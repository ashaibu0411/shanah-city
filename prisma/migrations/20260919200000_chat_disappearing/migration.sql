-- Disappearing messages + clear chat support
ALTER TABLE "MessageThread" ADD COLUMN IF NOT EXISTS "disappearingSeconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "GroupChatMessage" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "GroupChatSettings" (
    "groupId" TEXT NOT NULL,
    "disappearingSeconds" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "GroupChatSettings_pkey" PRIMARY KEY ("groupId")
);
