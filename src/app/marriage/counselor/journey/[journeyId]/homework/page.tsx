import Link from "next/link";
import { MarriageCounselorHomeworkManager } from "@/components/marriage/MarriageCounselorHomeworkManager";

type Props = {
  params: Promise<{ journeyId: string }>;
  searchParams: Promise<{ template?: string }>;
};

export default async function MarriageCounselorHomeworkPage({ params, searchParams }: Props) {
  const { journeyId } = await params;
  const sp = await searchParams;
  const initialTemplateKey = typeof sp.template === "string" ? sp.template : undefined;
  return (
    <div className="marriage-c3m-dashboard-shell">
      <Link href={`/marriage/counselor/journey/${journeyId}`} className="marriage-c3m-back-link">
        ← Journey overview
      </Link>
      <MarriageCounselorHomeworkManager journeyId={journeyId} initialTemplateKey={initialTemplateKey} />
    </div>
  );
}
