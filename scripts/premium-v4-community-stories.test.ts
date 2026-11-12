import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("src/app/community/page.tsx", "utf8");
const globals = readFileSync("src/app/globals.css", "utf8");
const css = readFileSync("src/app/community/community-refresh.css", "utf8");
const feed = readFileSync("src/components/community/CommunityFeed.tsx", "utf8");

assert.match(globals, /@import "\.\/premium-v4-cinematic-chrome\.css";/);
assert.match(globals, /@import "\.\/mobile-native-density\.css";/, "keep mobile scroll/chrome from main");
assert.match(css, /Native mobile social density/, "native mobile Community density pass");
assert.match(page, /community-refresh sc-v4-community/, "V4 is opt-in on church-wide Community");
assert.match(css, /community-refresh-feed-heading[\s\S]*margin.*1rem/);
assert.match(css, /\.community-refresh\.sc-v4-community/, "V4 CSS remains route-scoped");
assert.match(css, /#061329/);
assert.match(css, /#512d83/i);
assert.match(css, /#e9bc72/i);
assert.match(css, /#fffcf5/i, "readable warm feed cards");
assert.match(page, /getCommunityPostsForViewer/, "keep viewer authorization");
assert.match(page, /getPollsForViewer/, "keep polls");
assert.match(page, /enrichCommunityPostsForViewer/, "keep reactions");
assert.match(page, /<CommunityStatusRow/, "keep stories");
assert.match(page, /<PollsSection/, "keep polls UI");
assert.match(page, /<CommunityFeed/, "keep posts");
assert.match(feed, /<CommunityComposer/, "keep composer");
assert.match(feed, /<CommunityFeedTabs/, "keep filters");
assert.match(feed, /<CommunityPostCard/, "keep comments, reactions and moderation");
console.log("premium V4 Community/Stories visual-only guard OK");
