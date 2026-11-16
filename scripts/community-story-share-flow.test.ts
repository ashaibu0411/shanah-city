import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync("src/components/community/CommunityStatusRow.tsx","utf8");
const stylesheet = readFileSync("src/app/globals.css","utf8");
const api = readFileSync("src/app/api/community/statuses/route.ts","utf8");

// Regression: the composer must snapshot soundtrack before it clears its React state.
const snapshot = component.indexOf("const attachment = storyPostPayload();");
const close = component.indexOf("closeComposeDialog();", snapshot);
assert.ok(snapshot > 0 && close > snapshot, "Capture music/group attachment before closing the dialog");
assert.match(component, /uploadStatuses\(files, caption \|\| undefined, attachment\)/);
assert.match(component, /postWrittenMoment\(\{ caption, storyKind \}, attachment\)/);
assert.match(component, /postLinkMoment\(\{ linkUrl: rawLink, caption: note \|\| undefined \}, attachment\)/);
assert.match(component, /async function uploadStatuses\(fileList: File\[\], caption\?: string, attachment: Record<string, unknown> = \{\}\)/);
assert.match(component, /\{ \.\.\.attachment, mediaUrl, mediaType, caption: statusCaption \}/);
assert.match(component, /\{\s*\.\.\.attachment,\s*mediaType: "text"/);
assert.match(component, /\{\s*\.\.\.attachment,\s*mediaType: "link"/);
assert.match(component, /musicTrackId: selectedMusicTrack\.id/);
assert.match(component, /musicClipStartSeconds,/);
assert.match(component, /musicClipDurationSec,/);

// A selected music track can be posted as a text moment without a manually written caption.
assert.match(component, /composeMode === "text" && selectedMusicTrack/);
assert.match(component, /selectedMusicTrack\.title/);

// Share failures and music validation must be visible while the composer is open.
assert.match(component, /role="alert" className="mt-3 rounded-xl border border-rose-300/);
assert.match(component, /if \(uploading\) return;/);
assert.match(component, /disabled=\{uploading\}/);

// Mobile choice modal must never trap users inside a scroll-locked surface.
assert.match(component, /aria-label="Close Share a moment"/);
assert.match(component, /Cancel · Back to Community/);
assert.match(stylesheet, /\.community-story-share-menu\s*\{[^}]*max-height:/);
assert.match(stylesheet, /\.community-story-share-menu\s*\{[^}]*overflow-y: auto/);
assert.match(stylesheet, /\.community-story-share-menu > div:first-child\s*\{[^}]*position: sticky/);

// Server still attaches authorized track metadata; no override or bypass introduced.
assert.match(api, /assertTrackAttachable\(musicTrackId/);
console.log("Story music share and mobile cancel regression checks passed.");
