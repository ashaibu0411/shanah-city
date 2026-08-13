import { CommunityFeed } from "@/components/community/CommunityFeed";
import { PageHeader } from "@/components/ui";
import { getCommunityPosts } from "@/lib/member-server";

export default async function CommunityPage() {
  const posts = await getCommunityPosts();

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
