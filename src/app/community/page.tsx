import { CommunityFeed } from "@/components/community/CommunityFeed";
import { PollsSection } from "@/components/polls/PollsSection";
import { MarkFeedRead } from "@/components/notifications/MarkFeedRead";
import { CommunityV6LightShell } from "@/components/community/CommunityV6LightShell";
import "./community-refresh.css";
import "./community-social-feed-v6.css";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { attachCanManageToPosts } from "@/lib/community-post-access";
import { attachCanManageToPostComments } from "@/lib/community-comment-access";
import { enrichCommunityPostsForViewer } from "@/lib/community-comment-reaction-server";
import { getCommunityPostsForViewer } from "@/lib/member-server";
import { getPollsForViewer } from "@/lib/poll-server";
import { getGroups } from "@/lib/group-server";
import { groupHasMinistryHub } from "@/lib/group-ministry-hub-types";
import type { CommunityFeedFilter } from "@/lib/community-ui-utils";
import { cookies } from "next/headers";

function parseFeedFilter(value?: string): CommunityFeedFilter | undefined {
  if (value === "prayer" || value === "praise" || value === "general" || value === "announcement") {
    return value;
  }
  return undefined;
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const groupId = params.group?.trim() || "";
  const initialFilter = parseFeedFilter(params.filter?.trim());

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const [posts, polls, isAdmin, groups] = await Promise.all([
    getCommunityPostsForViewer(user?.id),
    getPollsForViewer(user),
    user ? canManageAsAdmin(user) : Promise.resolve(false),
    getGroups(),
  ]);
  const postsWithReactions = await enrichCommunityPostsForViewer(posts, user?.id);
  const postsWithAccess = attachCanManageToPosts(postsWithReactions, user, isAdmin);
  let postsWithCommentAccess = attachCanManageToPostComments(postsWithAccess, user, isAdmin);
  if (groupId) {
    postsWithCommentAccess = postsWithCommentAccess.filter(
      (post) => post.targetGroupId === groupId,
    );
  }
  const groupFilterLabel =
    groupId && groupHasMinistryHub(groupId)
      ? groups.find((entry) => entry.id === groupId)?.name
      : undefined;

  return (
    <div className="community-page community-refresh sc-v6-social-feed min-w-0 max-w-full overflow-x-clip">
      <CommunityV6LightShell />
      <div className="community-page-solid community-v6-shell">
        <MarkFeedRead feed="community" />
        <PollsSection
          initialPolls={polls.filter((poll) => !poll.targetGroupId)}
          churchWideOnly
          compact
          hideWhenEmpty
        />
        <CommunityFeed
          initialPosts={postsWithCommentAccess}
          initialFilter={initialFilter}
          initialGroupId={groupId || undefined}
          groupFilterLabel={groupFilterLabel}
          stackedLayout="v6"
        />
      </div>
    </div>
  );
}
