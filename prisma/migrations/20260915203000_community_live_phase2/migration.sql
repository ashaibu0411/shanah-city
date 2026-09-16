CREATE TABLE IF NOT EXISTS "CommunityLiveJoinRequest" (
    "id" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityLiveJoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommunityLiveJoinRequest_statusId_userId_key"
    ON "CommunityLiveJoinRequest"("statusId", "userId");

CREATE INDEX IF NOT EXISTS "CommunityLiveJoinRequest_statusId_state_idx"
    ON "CommunityLiveJoinRequest"("statusId", "state");

CREATE TABLE IF NOT EXISTS "CommunityLiveCoHost" (
    "id" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityLiveCoHost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommunityLiveCoHost_statusId_userId_key"
    ON "CommunityLiveCoHost"("statusId", "userId");

CREATE INDEX IF NOT EXISTS "CommunityLiveCoHost_statusId_idx"
    ON "CommunityLiveCoHost"("statusId");
