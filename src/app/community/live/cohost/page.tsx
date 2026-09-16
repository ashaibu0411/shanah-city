import { Suspense } from "react";
import { CommunityLiveCoHostClient } from "@/components/community/CommunityLiveCoHostClient";

export default function CommunityLiveCoHostPage() {
  return (
    <Suspense
      fallback={
        <div className="community-live-host-shell">
          <p className="text-sm text-white/85">Loading…</p>
        </div>
      }
    >
      <CommunityLiveCoHostClient />
    </Suspense>
  );
}
