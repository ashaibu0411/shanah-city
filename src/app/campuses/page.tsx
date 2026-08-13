import { CampusesGrid } from "@/components/campuses/CampusesGrid";
import { PageHeader } from "@/components/ui";

export default function CampusesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Global"
        title="Campuses"
        description="Shanah City is one family — Aurora, Colorado · Accra, Ghana · and online worldwide."
      />
      <CampusesGrid />
    </>
  );
}
