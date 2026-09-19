-- AlterTable
ALTER TABLE "GroupChatMessage" ADD COLUMN "replyToMessageId" TEXT;
ALTER TABLE "GroupChatMessage" ADD COLUMN "replyToSenderId" TEXT;
ALTER TABLE "GroupChatMessage" ADD COLUMN "replyToSenderName" TEXT;
ALTER TABLE "GroupChatMessage" ADD COLUMN "replyToExcerpt" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN "replyToMessageId" TEXT;
ALTER TABLE "Message" ADD COLUMN "replyToSenderId" TEXT;
ALTER TABLE "Message" ADD COLUMN "replyToSenderName" TEXT;
ALTER TABLE "Message" ADD COLUMN "replyToExcerpt" TEXT;
