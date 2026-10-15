import { MarriageCounselingHub } from "@/components/marriage/MarriageCounselingHub";
import { PageHeader } from "@/components/ui";

export default function MarriageCounselingPage() {
  return (
    <>
      <div className="sr-only">
        <PageHeader variant="flat" eyebrow="Community" title="Marriage & Relationships" />
      </div>
      <MarriageCounselingHub />
    </>
  );
}
