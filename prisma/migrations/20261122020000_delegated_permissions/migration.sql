CREATE TABLE "DelegatedPermission" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "permission" TEXT NOT NULL, "grantedBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "DelegatedPermission_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "DelegatedPermission_userId_permission_key" ON "DelegatedPermission"("userId", "permission");
CREATE INDEX "DelegatedPermission_permission_idx" ON "DelegatedPermission"("permission");
