import { Suspense } from "react";
import { GroupsHub } from "@/components/groups/GroupsHub";
import { Card, PageHeader } from "@/components/ui";

export default function GroupsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get involved"
        title="Groups & ministries"
        description="Create or join choir, men's ministry, small groups, youth teams, and more across the Shanah City family."
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
