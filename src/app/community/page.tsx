import { CommunityFeed } from "@/components/community/CommunityFeed";
import { PageHeader } from "@/components/ui";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getCommunityPostsForViewer } from "@/lib/member-server";
import { cookies } from "next/headers";

export default async function CommunityPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const posts = await getCommunityPostsForViewer(user?.id);

  return (
    <>
      <PageHeader
        eyebrow="Together"
        title="Community"
        description="Pray for one another, share praise reports, and comment on posts across the Shanah City family."
      />
      <CommunityFeed initialPosts={posts} />
    </>
  );
}
