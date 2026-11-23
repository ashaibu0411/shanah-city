ALTER TABLE "GuestCareProfile" ADD COLUMN "smsConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GuestCareProfile" ADD COLUMN "smsConsentAt" TIMESTAMP(3);
ALTER TABLE "GuestCareProfile" ADD COLUMN "smsConsentSource" TEXT;
ALTER TABLE "GuestCareProfile" ADD COLUMN "smsConsentDisclosureVersion" TEXT;
