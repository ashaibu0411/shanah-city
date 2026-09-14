"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { trainingHandoutStaticPath } from "@/lib/training-handouts";

type Props = {
  title: string;
  staticPath: string;
  backHref?: string;
};

export function TrainingHandoutViewer({ title, staticPath, backHref = "/profile" }: Props) {
  const router = useRouter();
  const frameRef = useRef<HTMLIFrameElement>(null);

  function printHandout() {
    const frame = frameRef.current;
    try {
      frame?.contentWindow?.print();
    } catch {
      window.open(staticPath, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="training-handout-view -mx-4 flex min-h-[calc(100dvh-8rem)] flex-col lg:-mx-6 lg:min-h-[calc(100dvh-6rem)]">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-night-900/10 bg-[var(--color-bg)]/95 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push(backHref);
            }
          }}
          className="text-sm font-semibold text-clay-700 hover:underline"
        >
          ← Back
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-night-900">
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={staticPath}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-night-600 hover:underline"
          >
            Open
          </Link>
          <button
            type="button"
            onClick={printHandout}
            className="text-xs font-semibold text-clay-700 hover:underline"
          >
            Print
          </button>
        </div>
      </div>
      <iframe
        ref={frameRef}
        title={title}
        src={staticPath}
        className="min-h-0 w-full flex-1 border-0 bg-[#ece1cc]"
      />
    </div>
  );
}
