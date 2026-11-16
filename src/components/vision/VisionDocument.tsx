"use client";

import type { ReactNode } from "react";

/**
 * Read-only, accessible presentation for existing plain-text ministry briefs.
 * Formatting never changes the stored original vision text.
 */
function isHeading(line: string) {
  const clean = line.trim();
  return clean.length > 2 && clean.length < 110
    && /[A-Z]/.test(clean)
    && !/[a-z]/.test(clean)
    && !/[.!?]$/.test(clean);
}

function listLine(line: string) {
  const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
  if (numbered) return { marker: numbered[1] + ".", text: numbered[2] };
  const bullet = line.match(/^[-•]\s+(.+)$/);
  if (bullet) return { marker: "•", text: bullet[1] };
  return null;
}

function renderInline(text: string): ReactNode {
  const colon = text.match(/^([^:]{3,48}:)\s+(.+)$/);
  if (colon) return <><strong className="font-bold text-slate-950">{colon[1]}</strong> {colon[2]}</>;
  return text;
}

export function VisionDocument({ content, onSuggest }: { content: string; onSuggest?: (section: string) => void }) {
  const sections = content.replace(/\r\n/g, "\n").split(/\n\s*\n/).flatMap(chunk => {
    const lines = chunk.split("\n").map(line => line.trim()).filter(Boolean);
    if (lines.length > 1 && lines[0] && isHeading(lines[0])) {
      return [{ kind: "heading", text: lines[0] }, ...lines.slice(1).map(text => ({ kind: "line", text }))];
    }
    return lines.map(text => ({ kind: isHeading(text) ? "heading" : "line", text }));
  });
  const months = /^(January|February|March|April|May|June|July|August|September|October|November|December):/;
  return (
    <article className="w-full min-w-0 space-y-5 text-[17px] leading-[1.85] tracking-normal text-slate-800 sm:text-[18px] sm:leading-[1.9]">
      {sections.map((part, index) => {
        if (part.kind === "heading") {
          return <div key={index} className="!mt-9 flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3 first:!mt-0">
            <h3 className="min-w-0 flex-1 break-words text-xl font-extrabold leading-snug tracking-tight text-slate-950 sm:text-2xl">{part.text}</h3>
            {onSuggest && <button type="button" className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800" onClick={() => onSuggest(part.text)}>Suggest change</button>}
          </div>;
        }
        const item = listLine(part.text);
        if (item) return (
          <div key={index} className="flex min-w-0 items-start gap-3 pl-1">
            <span aria-hidden className="min-w-7 flex-none font-extrabold text-blue-800">{item.marker}</span>
            <p className="min-w-0 flex-1 break-words">{renderInline(item.text)}</p>
          </div>
        );
        const calendarMonth = part.text.match(months)?.[1];
        return <div key={index} className={calendarMonth && onSuggest ? "min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4" : "min-w-0"}>
          <p className="min-w-0 break-words">{renderInline(part.text)}</p>
          {calendarMonth && onSuggest && <button type="button" className="inline-flex rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-800" onClick={() => onSuggest("calendar:" + calendarMonth)}>Suggest a change for {calendarMonth}</button>}
        </div>;
      })}
    </article>
  );
}
