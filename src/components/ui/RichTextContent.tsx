"use client";

import { richTextToHtml } from "@/lib/rich-text";

export function RichTextContent({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: richTextToHtml(text) }}
    />
  );
}
