ALTER TABLE "KidsArrivalRequest" ADD COLUMN "accessTokenHash" TEXT;
CREATE UNIQUE INDEX "KidsArrivalRequest_accessTokenHash_key" ON "KidsArrivalRequest"("accessTokenHash");