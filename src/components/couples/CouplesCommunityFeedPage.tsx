import { cookies } from "next/headers";
import { CouplesCommunityFeedLayout } from "@/components/couples/CouplesCommunityFeedLayout";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  getCouplesCommunityPostsForViewer,
  type CouplesCommunityFeedMode,
} from "@/lib/couples-community-posts-server";

export async function CouplesCommunityFeedPage({ mode }: { mode: CouplesCommunityFeedMode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const { posts, groupName, initialFilter } = await getCouplesCommunityPostsForViewer(user, mode);

  return (
    <CouplesCommunityFeedLayout
      mode={mode}
      initialPosts={posts}
      initialFilter={initialFilter}
      groupName={groupName}
    />
  );
}
