/** Safe, deliberately limited Markdown block parser for Ask Shepherd responses.
 * It preserves readable headings, paragraphs and lists without ever interpreting HTML.
 * The React renderer escapes text nodes; provider text cannot inject markup.
 */
export type AskShepherdMarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ordered-list"; start: number; items: string[] }
  | { type: "unordered-list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "rule" };

const HEADING = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/;
const ORDERED = /^\s{0,3}(\d+)[.)]\s+(.+)$/;
const UNORDERED = /^\s{0,3}[-*+]\s+(.+)$/;
const QUOTE = /^\s{0,3}>\s?(.*)$/;
const RULE = /^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/;

function startsBlock(line: string): boolean {
  return HEADING.test(line) || ORDERED.test(line) ||
    UNORDERED.test(line) || QUOTE.test(line) || RULE.test(line);
}

/** Text-only AST: no raw HTML, URL parsing, or dangerouslySetInnerHTML. */
export function parseAskShepherdMarkdown(input: string): AskShepherdMarkdownBlock[] {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const blocks: AskShepherdMarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim()) { i += 1; continue; }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      i += 1;
      continue;
    }
    if (RULE.test(line)) {
      blocks.push({ type: "rule" });
      i += 1;
      continue;
    }

    const quote = QUOTE.exec(line);
    if (quote) {
      const parts: string[] = [];
      while (i < lines.length) {
        const m = QUOTE.exec(lines[i] ?? "");
        if (!m) break;
        parts.push(m[1].trim());
        i += 1;
      }
      blocks.push({ type: "quote", text: parts.join(" ") });
      continue;
    }

    const ordered = ORDERED.exec(line);
    const unordered = UNORDERED.exec(line);
    if (ordered || unordered) {
      const isOrdered = Boolean(ordered);
      const items: string[] = [];
      const start = ordered ? Number(ordered[1]) : 1;
      while (i < lines.length) {
        const m = (isOrdered ? ORDERED : UNORDERED).exec(lines[i] ?? "");
        if (!m) break;
        items.push((isOrdered ? m[2] : m[1]).trim());
        i += 1;
        // Indented continuation lines belong to the same list item.
        while (i < lines.length && /^\s{2,}\S/.test(lines[i] ?? "") && !startsBlock((lines[i] ?? "").trimStart())) {
          items[items.length - 1] += " " + (lines[i] ?? "").trim();
          i += 1;
        }
        if (i < lines.length && !lines[i]?.trim() && (isOrdered ? ORDERED : UNORDERED).test(lines[i + 1] ?? "")) {
          i += 1;
        }
      }
      if (isOrdered) blocks.push({ type: "ordered-list", start, items });
      else blocks.push({ type: "unordered-list", items });
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && (lines[i] ?? "").trim() && (!paragraph.length || !startsBlock(lines[i] ?? ""))) {
      paragraph.push((lines[i] ?? "").trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}
