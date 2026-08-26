function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Writers often split headers as `**Title\n**Body**` — normalize to paired markers. */
function normalizeBoldBlocks(text: string) {
  return text.replace(
    /\*\*([^\n*]+)\n\*\*([\s\S]+?)\*\*/g,
    "**$1**\n**$2**",
  );
}

/** Converts **bold**, *italic*, and _italic_ markers to safe HTML. */
export function richTextToHtml(text: string) {
  const normalized = normalizeBoldBlocks(text.replace(/\r\n/g, "\n"));
  const escaped = escapeHtml(normalized);

  const withBoldPairs = escaped.replace(
    /\*\*([\s\S]+?)\*\*/g,
    "<strong>$1</strong>",
  );

  const withLineBold = withBoldPairs.replace(
    /^\*\*([^\n*]+)$/gm,
    "<strong>$1</strong>",
  );

  const withoutOrphanMarkers = withLineBold.replace(/^\*\*$/gm, "");

  return withoutOrphanMarkers
    .replace(/(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)/g, "<em>$1</em>")
    .replace(/_([^_\n]+?)_/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}

export function wrapRichTextSelection(
  value: string,
  selectionStart: number | null,
  selectionEnd: number | null,
  marker: "**" | "*" | "_",
) {
  const start = selectionStart ?? value.length;
  const end = selectionEnd ?? value.length;
  const selected = value.slice(start, end);
  const wrapped = selected || "text";
  const next = `${value.slice(0, start)}${marker}${wrapped}${marker}${value.slice(end)}`;
  const cursor =
    start + marker.length + wrapped.length + marker.length + (selected ? 0 : -4);
  return { next, cursor };
}

export type RichTextFormat = "bold" | "italic";

export function applyRichTextFormat(
  value: string,
  selectionStart: number | null,
  selectionEnd: number | null,
  format: RichTextFormat,
) {
  const marker = format === "bold" ? "**" : "*";
  return wrapRichTextSelection(value, selectionStart, selectionEnd, marker);
}

export function richTextToPlain(text: string) {
  const normalized = normalizeBoldBlocks(text.replace(/\r\n/g, "\n"));
  return normalized
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
    .replace(/^\*\*([^\n*]+)$/gm, "$1")
    .replace(/^\*\*$/gm, "")
    .replace(/(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)/g, "$1")
    .replace(/_([^_\n]+?)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
