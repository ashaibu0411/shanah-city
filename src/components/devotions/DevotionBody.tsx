import type { Devotion } from "@/lib/types";
import { devotionHasLegacySections } from "@/lib/devotion-utils";
import { RichTextContent } from "@/components/ui/RichTextContent";

export function DevotionBody({
  devotion,
  className = "",
}: {
  devotion: Devotion;
  className?: string;
}) {
  const legacy = devotionHasLegacySections(devotion);

  if (!legacy) {
    return (
      <div className={`text-sm leading-relaxed text-night-600 ${className}`.trim()}>
        <RichTextContent text={devotion.content} />
      </div>
    );
  }

  return (
    <div className={className}>
      {(devotion.verse || devotion.reference) && (
        <blockquote className="border-l-4 border-sand-400 pl-4 italic text-night-700">
          {devotion.verse ? (
            <>
              &ldquo;
              <RichTextContent text={devotion.verse} className="inline" />
              &rdquo;
            </>
          ) : null}
          {devotion.reference ? (
            <footer className="mt-2 not-italic text-sm font-semibold text-night-500">
              — {devotion.reference}
            </footer>
          ) : null}
        </blockquote>
      )}

      {devotion.content ? (
        <div className="mt-4 text-sm leading-relaxed text-night-600">
          <RichTextContent text={devotion.content} />
        </div>
      ) : null}

      {devotion.prayer ? (
        <div className="mt-4 rounded-xl bg-sand-50 p-3 text-sm text-night-600">
          <span className="font-semibold text-night-800">Prayer: </span>
          <RichTextContent text={devotion.prayer} className="inline" />
        </div>
      ) : null}
    </div>
  );
}
