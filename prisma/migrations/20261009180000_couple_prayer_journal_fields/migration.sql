-- AlterTable
ALTER TABLE "CouplePrayerJournalEntry" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'our-marriage';
ALTER TABLE "CouplePrayerJournalEntry" ADD COLUMN "scriptureRef" TEXT;
ALTER TABLE "CouplePrayerJournalEntry" ADD COLUMN "privacy" TEXT NOT NULL DEFAULT 'couple';
ALTER TABLE "CouplePrayerJournalEntry" ADD COLUMN "testimony" TEXT;
ALTER TABLE "CouplePrayerJournalEntry" ADD COLUMN "thanksgivingScripture" TEXT;
ALTER TABLE "CouplePrayerJournalEntry" ADD COLUMN "answeredPhotoKey" TEXT;
