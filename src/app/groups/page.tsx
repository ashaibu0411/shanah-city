import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GroupsHub } from "@/components/groups/GroupsHub";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

type GroupsPageProps = {
  searchParams: Promise<{ group?: string; chat?: string }>;
};

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const { group, chat } = await searchParams;
  const groupId = group?.trim();

  if (groupId) {
    const query = chat === "1" ? "?chat=1" : "";
    redirect(`/groups/${encodeURIComponent(groupId)}${query}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Get involved"
        title="Groups & ministries"
        description="Browse church groups and ministries. Tap any group to see details, join, chat, and polls."
      />
      <Suspense
        fallback={
          <Card>
            <p className="text-sm text-night-600">Loading groups...</p>
          </Card>
        }
      >
        <GroupsHub />
      </Suspense>
    </>
  );
}
