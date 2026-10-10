import { cookies } from "next/headers";
import { Suspense } from "react";
import { CouplesCommunityPage } from "@/components/couples/CouplesCommunityPage";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getCouplesCommunityPostsForViewer } from "@/lib/couples-community-posts-server";

async function CouplesCommunityPageContent() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const { posts, groupName, initialFilter } = await getCouplesCommunityPostsForViewer(
    user,
    "discussions",
  );

  return (
    <CouplesCommunityPage
      initialPosts={posts}
      initialFilter={initialFilter}
      groupName={groupName}
    />
  );
}

export default function CouplesCommunityRoutePage() {
  return (
    <Suspense fallback={null}>
      <CouplesCommunityPageContent />
    </Suspense>
  );
}
