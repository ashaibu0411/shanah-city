import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { UrgentAlertDetailView } from "@/components/urgent-alert/UrgentAlertDetailView";
import { PageHeader } from "@/components/ui";
import { getPublicUrgentAlertById } from "@/lib/urgent-alert-server";
import { urgentAlertPublicShareBlurb } from "@/lib/urgent-alert-utils";
import { urgentAlertShareUrl } from "@/lib/share-urls";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

type UrgentAlertDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: UrgentAlertDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const alert = await getPublicUrgentAlertById(id);
  if (!alert) {
    return { title: "Alert not found" };
  }

  const url = urgentAlertShareUrl(alert.id);
  const description = alert.message.length > 155
    ? `${alert.message.slice(0, 155)}…`
    : alert.message;
  const images = alert.imageUrl ?? alert.artworkWideUrl ?? undefined;

  return {
    title: `Urgent: ${alert.title}`,
    description,
    openGraph: {
      title: `Urgent — ${site.name}: ${alert.title}`,
      description: alert.message.slice(0, 200),
      url,
      type: "article",
      images: images ? [{ url: images, alt: alert.title }] : undefined,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: `Urgent: ${alert.title}`,
      description: alert.message.slice(0, 200),
      images: images ? [images] : undefined,
    },
  };
}

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
