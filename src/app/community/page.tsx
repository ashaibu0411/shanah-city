import { CommunityFeed } from "@/components/community/CommunityFeed";
import { PollsSection } from "@/components/polls/PollsSection";
import { MarkFeedRead } from "@/components/notifications/MarkFeedRead";
import { PageHeader } from "@/components/ui";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { attachCanManageToPosts } from "@/lib/community-post-access";
import { getCommunityPostsForViewer } from "@/lib/member-server";
import { getPollsForViewer } from "@/lib/poll-server";
import { cookies } from "next/headers";

export default async function CommunityPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const [posts, polls, isAdmin] = await Promise.all([
    getCommunityPostsForViewer(user?.id),
    getPollsForViewer(user),
    user ? canManageAsAdmin(user) : Promise.resolve(false),
  ]);
  const postsWithAccess = attachCanManageToPosts(posts, user, isAdmin);

  return (
    <div className="community-page">
      <PageHeader
        eyebrow="Together"
        title="Community"
        description="Pray for one another, share praise reports, and stay connected across the Shanah City family."
      />
      <MarkFeedRead feed="community" />
      <PollsSection
        initialPolls={polls.filter((poll) => !poll.targetGroupId)}
        compact
        hideWhenEmpty
      />
      <CommunityFeed initialPosts={postsWithAccess} />
    </div>
  );
}
