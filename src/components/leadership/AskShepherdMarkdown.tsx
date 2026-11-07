"use client";

import type { ReactNode } from "react";
import { parseAskShepherdMarkdown } from "@/lib/ask-shepherd-markdown";

/** Safe inline emphasis only. React escapes any HTML-like model content. */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*\n]+?\*\*|__[^_\n]+?__|`[^`\n]+?`|\*[^*\n]+?\*|_[^_\n]+?_)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i} className="font-semibold text-night-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("__") && part.endsWith("__") && part.length > 4) {
      return <strong key={i} className="font-semibold text-night-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={i} className="rounded bg-night-100 px-1 py-0.5 text-[0.9em]">{part.slice(1, -1)}</code>;
    }
    if (((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export function AskShepherdMarkdown({ content }: { content: string }) {
  const blocks = parseAskShepherdMarkdown(content);

  return (
    <div className="space-y-3 break-words text-[15px] leading-[1.75] text-night-800">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return block.level <= 3 ? (
              <h3 key={i} className="pt-2 text-[16px] font-semibold leading-snug text-night-950">
                {renderInline(block.text)}
              </h3>
            ) : (
              <h4 key={i} className="pt-1 text-[15px] font-semibold leading-snug text-night-900">
                {renderInline(block.text)}
              </h4>
            );
          case "paragraph":
            return <p key={i}>{renderInline(block.text)}</p>;
          case "unordered-list":
            return (
              <ul key={i} className="list-disc space-y-2 pl-6 marker:text-night-500">
                {block.items.map((item, j) => <li key={j} className="pl-1">{renderInline(item)}</li>)}
              </ul>
            );
          case "ordered-list":
            return (
              <ol key={i} start={block.start} className="list-decimal space-y-2 pl-6 marker:font-medium marker:text-night-600">
                {block.items.map((item, j) => <li key={j} className="pl-1">{renderInline(item)}</li>)}
              </ol>
            );
          case "quote":
            return <blockquote key={i} className="border-l-2 border-brand-400 pl-3 italic text-night-700">{renderInline(block.text)}</blockquote>;
          case "rule":
            return <hr key={i} className="my-3 border-night-200" />;
        }
      })}
    </div>
  );
}
