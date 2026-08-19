import type { Devotion } from "@/lib/types";
import { RichTextContent } from "@/components/ui/RichTextContent";

export function DevotionBody({
  devotion,
  className = "",
}: {
  devotion: Devotion;
  className?: string;
}) {
  return (
    <div className={className}>
      <blockquote className="border-l-4 border-sand-400 pl-4 italic text-night-700">
        &ldquo;
        <RichTextContent text={devotion.verse} className="inline" />
        &rdquo;
        <footer className="mt-2 not-italic text-sm font-semibold text-night-500">
          — {devotion.reference}
        </footer>
      </blockquote>

      <div className="mt-4 text-sm leading-relaxed text-night-600">
        <RichTextContent text={devotion.content} />
      </div>

      <div className="mt-4 rounded-xl bg-sand-50 p-3 text-sm text-night-600">
        <span className="font-semibold text-night-800">Prayer: </span>
        <RichTextContent text={devotion.prayer} className="inline" />
      </div>
    </div>
  );
}
