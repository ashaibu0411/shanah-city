"use client";

import Link from "next/link";
import { CommunityStatusRow } from "@/components/community/CommunityStatusRow";

export function HomeStoriesSection() {
  return (
    <section className="community-home-stories community-home-stories--embedded" aria-label="Stories">
      <div className="community-home-stories-head">
        <Link href="/community" className="community-home-stories-link">
          Community
          <span className="community-home-stories-link-arrow" aria-hidden>
            →
          </span>
        </Link>
      </div>
      <CommunityStatusRow variant="home" />
    </section>
  );
}
