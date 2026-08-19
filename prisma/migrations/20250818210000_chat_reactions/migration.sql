-- AlterTable
ALTER TABLE "GroupChatMessage" ADD COLUMN "reactions" JSONB;
ALTER TABLE "Message" ADD COLUMN "reactions" JSONB;
