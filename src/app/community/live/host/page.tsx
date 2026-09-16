import { redirect } from "next/navigation";
import { CommunityLiveHostClient } from "@/components/community/CommunityLiveHostClient";
import { isLiveKitConfigured } from "@/lib/livekit-config";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { cookies } from "next/headers";

export default async function CommunityLiveHostPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/community/live/host");
  }

  if (!isLiveKitConfigured()) {
    return (
      <div className="community-live-host-shell">
        <p className="max-w-sm text-center text-sm text-white/90">
          Live stories are not configured on this server yet. Add LiveKit environment variables and
          redeploy.
        </p>
      </div>
    );
  }

  return <CommunityLiveHostClient hostUserId={user.id} />;
}
