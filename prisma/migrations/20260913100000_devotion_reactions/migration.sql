-- CreateTable
CREATE TABLE "DevotionReaction" (
    "id" TEXT NOT NULL,
    "devotionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevotionReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DevotionReaction_devotionId_idx" ON "DevotionReaction"("devotionId");

-- CreateIndex
CREATE UNIQUE INDEX "DevotionReaction_devotionId_userId_emoji_key" ON "DevotionReaction"("devotionId", "userId", "emoji");
