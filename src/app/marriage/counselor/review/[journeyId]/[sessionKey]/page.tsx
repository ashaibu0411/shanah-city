import { MarriageCounselorSessionReviewClient } from "@/components/marriage/MarriageCounselorSessionReviewClient";

type Props = { params: Promise<{ journeyId: string; sessionKey: string }> };

export default async function MarriageCounselorSessionReviewPage({ params }: Props) {
  const { journeyId, sessionKey } = await params;
  return (
    <MarriageCounselorSessionReviewClient
      journeyId={journeyId}
      sessionKey={decodeURIComponent(sessionKey)}
    />
  );
}
