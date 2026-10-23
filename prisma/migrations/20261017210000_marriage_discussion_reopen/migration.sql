-- Separate "discussed" completion from shared notes (reopen clears discussedAt only).
ALTER TABLE "MarriageDiscussionMark" ADD COLUMN "discussedAt" TIMESTAMP(3);

UPDATE "MarriageDiscussionMark" SET "discussedAt" = "markedAt" WHERE "discussedAt" IS NULL;
