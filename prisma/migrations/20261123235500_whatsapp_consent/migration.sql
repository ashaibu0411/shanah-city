CREATE TABLE "WhatsAppContactState" (
  "phone" TEXT NOT NULL,
  "optedIn" BOOLEAN NOT NULL DEFAULT false,
  "optedOutAt" TIMESTAMP(3),
  "consentSource" TEXT,
  "consentAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WhatsAppContactState_pkey" PRIMARY KEY ("phone")
);
