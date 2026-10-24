import Link from "next/link";
import { MarriageCounselorHomeworkManager } from "@/components/marriage/MarriageCounselorHomeworkManager";

type Props = { params: Promise<{ journeyId: string }> };

export default async function MarriageCounselorHomeworkPage({ params }: Props) {
  const { journeyId } = await params;
  return (
    <div className="marriage-c3m-dashboard-shell">
      <Link href={`/marriage/counselor/journey/${journeyId}`} className="marriage-c3m-back-link">
        ← Journey overview
      </Link>
      <MarriageCounselorHomeworkManager journeyId={journeyId} />
    </div>
  );
}
