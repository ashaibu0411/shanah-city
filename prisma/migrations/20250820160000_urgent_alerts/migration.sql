CREATE TABLE "UrgentAlert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "ctaLabel" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UrgentAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UrgentAlert_active_idx" ON "UrgentAlert"("active");
CREATE INDEX "UrgentAlert_expiresAt_idx" ON "UrgentAlert"("expiresAt");
