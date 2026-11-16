import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const share = readFileSync("src/components/community/CommunityStoryExternalShare.tsx", "utf8");
const viewer = readFileSync("src/components/community/CommunityStoryViewer.tsx", "utf8");
const row = readFileSync("src/components/community/CommunityStatusRow.tsx", "utf8");
const page = readFileSync("src/app/community/page.tsx", "utf8");

assert.match(share, /\/community\?story=/, "Every link must target a specific story");
assert.match(share, /https:\/\/wa\.me\/\?text=/, "WhatsApp chats/groups must use WhatsApp sharing link");
assert.match(share, /navigator\.clipboard\.writeText/, "Copy link fallback is required");
assert.match(share, /navigator\.canShare/, "Status media share must detect native capability");
assert.match(share, /navigator\.share/, "Status media must use platform share sheet");
assert.match(share, /useEffect\(\(\) => \{[\s\S]*fetch\(resolveStoryMediaUrl\(slide\.mediaUrl\)\)/, "Media must be prepared as the share panel opens");
assert.match(share, /if \(!eligibleMedia \|\| busy \|\| !preparedFile\) return/, "Share requires preloaded original media");
const shareAction = share.slice(share.indexOf("async function nativeMediaShare()"), share.indexOf("\n  return (", share.indexOf("async function nativeMediaShare()")));
assert.doesNotMatch(shareAction, /await fetch\(/, "No async media fetch before share gesture");
assert.match(shareAction, /await navigator\.share\(\{ files: \[preparedFile\] \}\)/);

assert.match(share, /mayExport\s*&&/, "Only owner may export original uploaded media");
assert.match(share, /slide\.mediaType === "image" \|\| slide\.mediaType === "video"/);
assert.doesNotMatch(share, /slide\.music\./, "Licensed music must never be included in external exports");
assert.match(share, /WhatsApp Status/, "Native sharing must give WhatsApp Status instructions");
assert.match(share, /save it, then upload it to WhatsApp Status/, "Fallback must be explicit");
assert.match(viewer, /CommunityStoryExternalShare/);
assert.match(viewer, /!slide\.groupId && !deck\.groupId/, "Restricted group-story sharing must not be exposed");
assert.match(viewer, /playbackPaused =[^;]*shareOpen/, "Story should pause while choosing share destination");
assert.match(row, /new URLSearchParams\(window\.location\.search\)\.get\("story"\)/);
assert.match(row, /setViewerStart\(\{ deckIndex, slideIndex \}\)/);
assert.match(row, /This story has expired or is no longer available/);
assert.match(page, /params\.story && !user/, "Externally shared private story must require sign-in");
assert.match(page, /sign-in\?next=/, "Login must redirect to requested story");
console.log("WhatsApp story link and native Status share checks passed.");
