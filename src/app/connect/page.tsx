import { ConnectPageView } from "@/components/connect/ConnectPageView";
import { PageHeader } from "@/components/ui";

export default function ConnectPage() {
  return (
    <>
      <PageHeader
        eyebrow="Plan your visit"
        title="Connect"
        description="New here? We'd love to meet you. Join us in Aurora, Colorado or Accra, Ghana."
      />
      <ConnectPageView />
    </>
  );
}
