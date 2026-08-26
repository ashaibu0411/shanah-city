function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getLineBounds(value: string, index: number) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, index - 1)) + 1;
  const lineEndIndex = value.indexOf("\n", index);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  return { lineStart, lineEnd };
}

/** Keep header markers only; strip accidental body ** from pasted content. */
function normalizeHeaderMarkers(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(
      /\*\*([^\n*]+)\n\*\*([\s\S]*?)\*\*/g,
      (_, header, body) => `**${header}**\n${body.replace(/^\*\*/, "").replace(/\*\*$/, "")}`,
    )
    .replace(/\*\*([^\n*]+)\n\*\*(?=\n|$)/g, "**$1**")
    .replace(/^\*\*$/gm, "");
}

/** Converts single-line **headers**, *italic*, and _italic_ to safe HTML. */
export function richTextToHtml(text: string) {
  const normalized = normalizeHeaderMarkers(text);
  const escaped = escapeHtml(normalized);

  const withHeaderBold = escaped.replace(/\*\*([^\n*]+)\*\*/g, "<strong>$1</strong>");

  return withHeaderBold
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

/** Bold the current line only — for section headers in devotions. */
export function applyHeaderBold(
  value: string,
  selectionStart: number | null,
  selectionEnd: number | null,
) {
  const caret = selectionStart ?? value.length;
  const { lineStart, lineEnd } = getLineBounds(value, caret);
  const line = value.slice(lineStart, lineEnd);

  const wrappedMatch = line.match(/^\*\*([^*]+)\*\*$/);
  if (wrappedMatch) {
    const plain = wrappedMatch[1];
    const next = value.slice(0, lineStart) + plain + value.slice(lineEnd);
    return { next, cursor: lineStart + plain.length };
  }

  const plain = line.replace(/^\*\*/, "").replace(/\*\*$/, "").trim();
  const wrapped = `**${plain || "Section title"}**`;
  const next = value.slice(0, lineStart) + wrapped + value.slice(lineEnd);
  return { next, cursor: lineStart + wrapped.length };
}

export function richTextToPlain(text: string) {
  const normalized = normalizeHeaderMarkers(text);
  return normalized
    .replace(/\*\*([^\n*]+)\*\*/g, "$1")
    .replace(/(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)/g, "$1")
    .replace(/_([^_\n]+?)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
