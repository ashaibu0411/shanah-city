import { CommunityFeed } from "@/components/community/CommunityFeed";
import { CommunityStatusRow } from "@/components/community/CommunityStatusRow";
import { PollsSection } from "@/components/polls/PollsSection";
import { MarkFeedRead } from "@/components/notifications/MarkFeedRead";
import { editorialPremium } from "@/components/app/editorial-premium";
import { PageHeader } from "@/components/ui";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { attachCanManageToPosts } from "@/lib/community-post-access";
import { attachCanManageToPostComments } from "@/lib/community-comment-access";
import { enrichCommunityPostsForViewer } from "@/lib/community-comment-reaction-server";
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
  const postsWithReactions = await enrichCommunityPostsForViewer(posts, user?.id);
  const postsWithAccess = attachCanManageToPosts(postsWithReactions, user, isAdmin);
  const postsWithCommentAccess = attachCanManageToPostComments(postsWithAccess, user, isAdmin);

  return (
    <div className="community-page min-w-0 max-w-full overflow-x-clip">
      <div className="community-page-solid">
        <PageHeader variant="flat" eyebrow="Together" title="Community" />
        <div className="community-page-stories">
          <CommunityStatusRow />
        </div>
        <p
          className={`community-page-intro ${editorialPremium.pageDescription} max-w-2xl text-base`}
        >
          See moments from your groups and friends, pray in one tap, and stay connected day to day.
        </p>
        <MarkFeedRead feed="community" />
        <PollsSection
          initialPolls={polls.filter((poll) => !poll.targetGroupId)}
          compact
          hideWhenEmpty
        />
        <CommunityFeed initialPosts={postsWithCommentAccess} />
      </div>
    </div>
  );
}
