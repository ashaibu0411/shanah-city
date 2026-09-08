-- Devotion audience tags (e.g. "couples")
ALTER TABLE "Devotion" ADD COLUMN "tags" JSONB;

-- Couples RSVP: count spouses on a single member RSVP
ALTER TABLE "ChurchEvent" ADD COLUMN "rsvpCouplesMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "EventRsvp" ADD COLUMN "guestCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "EventRsvp" ADD COLUMN "spouseName" TEXT;
