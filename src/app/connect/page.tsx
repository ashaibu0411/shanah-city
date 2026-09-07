import { ConnectPageView } from "@/components/connect/ConnectPageView";
import { PageHeader } from "@/components/ui";
import { getChurchSocialImages } from "@/lib/facebook-church-media";

export default async function ConnectPage() {
  const churchImages = await getChurchSocialImages();

  return (
    <>
      <PageHeader
        eyebrow="Plan your visit"
        title="Connect"
        description="New here? We'd love to meet you. Join us in Aurora, Colorado or Accra, Ghana."
      />
      <ConnectPageView churchImages={churchImages} />
    </>
  );
}
