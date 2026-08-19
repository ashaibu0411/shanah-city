-- AlterTable
ALTER TABLE "Message" ADD COLUMN "attachmentUrl" TEXT;
ALTER TABLE "Message" ADD COLUMN "attachmentType" TEXT;
ALTER TABLE "Message" ADD COLUMN "attachmentName" TEXT;
ALTER TABLE "Message" ADD COLUMN "editedAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MessageReport" ADD COLUMN "groupId" TEXT;
ALTER TABLE "MessageReport" ADD COLUMN "messageId" TEXT;

-- AlterTable
ALTER TABLE "GroupChatMessage" ADD COLUMN "attachmentUrl" TEXT;
ALTER TABLE "GroupChatMessage" ADD COLUMN "attachmentType" TEXT;
ALTER TABLE "GroupChatMessage" ADD COLUMN "attachmentName" TEXT;
ALTER TABLE "GroupChatMessage" ADD COLUMN "editedAt" TIMESTAMP(3);
ALTER TABLE "GroupChatMessage" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GroupChatReadState" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupChatReadState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatTypingIndicator" (
    "id" TEXT NOT NULL,
    "channelType" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatTypingIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupChatReadState_groupId_idx" ON "GroupChatReadState"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupChatReadState_groupId_userId_key" ON "GroupChatReadState"("groupId", "userId");

-- CreateIndex
CREATE INDEX "ChatTypingIndicator_channelType_channelId_idx" ON "ChatTypingIndicator"("channelType", "channelId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatTypingIndicator_channelType_channelId_userId_key" ON "ChatTypingIndicator"("channelType", "channelId", "userId");

-- CreateTable
CREATE TABLE "ChatAttachmentMeta" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "groupId" TEXT,
    "threadId" TEXT,
    "contentType" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatAttachmentMeta_pkey" PRIMARY KEY ("id")
);
