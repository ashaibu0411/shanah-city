CREATE TABLE "FeedReadState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feedKey" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedReadState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeedReadState_userId_feedKey_key" ON "FeedReadState"("userId", "feedKey");
