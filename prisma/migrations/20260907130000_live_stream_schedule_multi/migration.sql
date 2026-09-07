-- Allow multiple livestream schedules (remove single-row default id).
ALTER TABLE "LiveStreamSchedule" ALTER COLUMN "id" DROP DEFAULT;
