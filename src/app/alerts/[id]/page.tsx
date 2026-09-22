import { notFound } from "next/navigation";
import { UrgentAlertDetailView } from "@/components/urgent-alert/UrgentAlertDetailView";
import { PageHeader } from "@/components/ui";
import { getPublicUrgentAlertById } from "@/lib/urgent-alert-server";

export const dynamic = "force-dynamic";

type UrgentAlertDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UrgentAlertDetailPage({ params }: UrgentAlertDetailPageProps) {
  const { id } = await params;
  const alert = await getPublicUrgentAlertById(id);

  if (!alert) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="Shanah City"
        title="Urgent alert"
        description="Important update for our church family."
      />
      <UrgentAlertDetailView alert={alert} />
    </>
  );
}
