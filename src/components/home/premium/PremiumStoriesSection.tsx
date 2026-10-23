"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { CommunityStatusRow } from "@/components/community/CommunityStatusRow";

export function PremiumStoriesSection() {
  const { user, loading } = useAuth();

  return (
    <section className="premium-section premium-stories" aria-label="Community stories">
      <div className="premium-section__head">
        <h2 className="premium-section__title">Community</h2>
        <Link href="/community" className="premium-section__link">
          View all →
        </Link>
      </div>

      {!loading && !user ? (
        <div className="premium-stories__guest">
          <p className="premium-stories__guest-title">Stories from your church family</p>
          <p className="premium-stories__guest-copy">
            Sign in to see updates, share a moment, and celebrate what God is doing together.
          </p>
          <Link href="/sign-in" className="premium-btn premium-btn--secondary premium-btn--sm">
            Sign in to view stories
          </Link>
        </div>
      ) : (
        <div className="premium-stories__row">
          <CommunityStatusRow variant="home" />
        </div>
      )}
    </section>
  );
}
