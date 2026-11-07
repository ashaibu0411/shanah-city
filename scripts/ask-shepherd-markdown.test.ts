import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseAskShepherdMarkdown } from "../src/lib/ask-shepherd-markdown";
import { AskShepherdMarkdown } from "../src/components/leadership/AskShepherdMarkdown";

const sample = [
  "Handling a late worship team member requires **wisdom** and kindness.",
  "",
  "### Biblical wisdom",
  "1. **Listen first:** Hear the volunteer's perspective.",
  "2. **Clarify expectations:** Speak the truth in love.",
  "",
  "### Practical steps",
  "- Meet privately.",
  "- Agree on a follow-up plan.",
  "",
  "> Lead with patience.",
].join("\n");

const blocks = parseAskShepherdMarkdown(sample);
assert.deepEqual(blocks.map((b) => b.type), [
  "paragraph", "heading", "ordered-list", "heading", "unordered-list", "quote"
]);
assert.equal(blocks[1].type, "heading");
if (blocks[1].type === "heading") assert.equal(blocks[1].text, "Biblical wisdom");
if (blocks[2].type === "ordered-list") assert.equal(blocks[2].items.length, 2);

const html = renderToStaticMarkup(createElement(AskShepherdMarkdown, { content: sample }));
assert.match(html, /<h3\b/);
assert.match(html, /Biblical wisdom/);
assert.match(html, /<ol\b/);
assert.match(html, /<ul\b/);
assert.match(html, /<strong\b/);
assert.doesNotMatch(html, /### Biblical wisdom/);

const injection = "<script>alert('bad')</script>\n\n[bad](javascript:alert(1))";
const safeHtml = renderToStaticMarkup(createElement(AskShepherdMarkdown, { content: injection }));
assert.doesNotMatch(safeHtml, /<script>/i);
assert.doesNotMatch(safeHtml, /\shref=/i);
assert.match(safeHtml, /&lt;script&gt;/i);

console.log("ask-shepherd-markdown.test.ts OK");
