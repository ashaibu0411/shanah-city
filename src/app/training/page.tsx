import type { Metadata } from "next";
import Link from "next/link";
import { TrainingPrintButton } from "@/components/training/TrainingPrintButton";
import { TRAINING_HANDOUTS, trainingHandoutStaticPath } from "@/lib/training-handouts";

export const metadata: Metadata = {
  title: "Leader Training Handouts",
  description: "Printable one-page guides for Shanah City ministry leaders.",
};

export default function TrainingPage() {
  return (
    <div className="sheet index-page">
      <div className="header">
        <div>
          <div className="brand">Shanah City App</div>
          <h1>Leader training handouts</h1>
          <p className="path">
            Open any handout → <strong>Print</strong> → <strong>Save as PDF</strong>
          </p>
        </div>
      </div>

      <p>
        One-page guides for training ministry leaders. Each sheet explains what the app helps
        their team achieve and where to find the tools.
      </p>

      <div className="card-list">
        {TRAINING_HANDOUTS.map((handout) => (
          <Link key={handout.slug} href={trainingHandoutStaticPath(handout)}>
            {handout.title}
            <span>{handout.description}</span>
          </Link>
        ))}
      </div>

      <div className="callout no-print">
        <strong>Tip:</strong> Share{" "}
        <Link href="/training">shanah-city.vercel.app/training</Link> so leaders can download
        handouts from any device.
      </div>

      <div className="footer">
        <span>Shanah City · Training materials</span>
        <TrainingPrintButton />
      </div>
    </div>
  );
}
