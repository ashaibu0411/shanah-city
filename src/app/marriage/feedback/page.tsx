import { Suspense } from "react";
import { MarriageCoupleFeedbackCenter } from "@/components/marriage/MarriageCoupleFeedbackCenter";

export default function MarriageCoupleFeedbackPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm">Loading feedback…</p>}>
      <MarriageCoupleFeedbackCenter />
    </Suspense>
  );
}
