-- CreateTable
CREATE TABLE "PastoralRoleSlot" (
    "role" TEXT NOT NULL,
    "userId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "updatedByName" TEXT,

    CONSTRAINT "PastoralRoleSlot_pkey" PRIMARY KEY ("role")
);

INSERT INTO "PastoralRoleSlot" ("role", "userId", "updatedAt")
VALUES
  ('senior_pastor', NULL, CURRENT_TIMESTAMP),
  ('associate_pastor', NULL, CURRENT_TIMESTAMP)
ON CONFLICT ("role") DO NOTHING;
