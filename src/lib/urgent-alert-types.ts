export type UrgentAlert = {
  id: string;
  title: string;
  message: string;
  href?: string;
  ctaLabel?: string;
  imageUrl?: string;
  videoUrl?: string;
  artworkSquareUrl?: string;
  artworkWideUrl?: string;
  artworkBannerUrl?: string;
  active: boolean;
  startsAt?: string;
  expiresAt?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};
