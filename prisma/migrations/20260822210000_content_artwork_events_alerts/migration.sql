-- AlterTable
ALTER TABLE "ChurchEvent" ADD COLUMN "artworkSquareUrl" TEXT,
ADD COLUMN "artworkWideUrl" TEXT,
ADD COLUMN "artworkBannerUrl" TEXT;

-- AlterTable
ALTER TABLE "UrgentAlert" ADD COLUMN "artworkSquareUrl" TEXT,
ADD COLUMN "artworkWideUrl" TEXT,
ADD COLUMN "artworkBannerUrl" TEXT;
