function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Converts **bold**, *italic*, and _italic_ markers to safe HTML. */
export function richTextToHtml(text: string) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
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
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
