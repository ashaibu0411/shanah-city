import { MarriageCounselorJourneyDetail } from "@/components/marriage/MarriageCounselorJourneyDetail";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default async function MarriageCounselorJourneyPage({
  params,
}: {
  params: Promise<{ journeyId: string }>;
}) {
  const { journeyId } = await params;
  return (
    <div className={marriagePremium.counselorDashboardPage}>
      <div className={marriagePremium.counselorDashboardInset}>
        <MarriageCounselorJourneyDetail journeyId={journeyId} />
      </div>
    </div>
  );
}
