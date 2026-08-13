import { DevotionAdminPanel } from "@/components/admin/DevotionAdminPanel";
import { PageHeader } from "@/components/ui";

export default function DevotionAdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Leaders"
        title="Write devotions"
        description="Pastors and leaders can publish daily devotions to the app and website. Sign in, then use your leader PIN or leader account."
      />
      <DevotionAdminPanel />
    </>
  );
}
