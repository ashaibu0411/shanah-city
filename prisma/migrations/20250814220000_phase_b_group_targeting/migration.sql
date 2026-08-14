-- Phase B: group-scoped events and targeted community announcements
ALTER TABLE "ChurchEvent" ADD COLUMN "groupId" TEXT;
ALTER TABLE "ChurchEvent" ADD COLUMN "groupName" TEXT;

ALTER TABLE "CommunityPost" ADD COLUMN "targetGroupId" TEXT;
ALTER TABLE "CommunityPost" ADD COLUMN "targetGroupName" TEXT;
