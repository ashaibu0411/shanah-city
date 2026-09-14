ALTER TABLE "MessageThread" ADD COLUMN "isGroup" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MessageThread" ADD COLUMN "participantIds" JSONB;

UPDATE "MessageThread"
SET "participantIds" = jsonb_build_array("participantAId", "participantBId")
WHERE "participantIds" IS NULL;
