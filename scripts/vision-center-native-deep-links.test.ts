import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nativeStoryPath, nativeVisionPath } from "../src/components/app/NativeStoryLinkHandler";

const root = "https://shanah-city.vercel.app";
assert.equal(nativeVisionPath(root + "/leadership/vision/plan-123"), "/leadership/vision/plan-123");
assert.equal(nativeVisionPath(root + "/leadership/vision/churchwide"), "/leadership/vision/churchwide");
assert.equal(nativeVisionPath(root + "/leadership/vision/plan-123/"), "/leadership/vision/plan-123");
for (const url of [
  "https://evil.example/leadership/vision/plan-123",
  "http://shanah-city.vercel.app/leadership/vision/plan-123",
  root + "/leadership/vision/plan-123?next=https://evil.example",
  root + "/leadership/vision/../../admin",
  root + "/leadership/vision/",
]) assert.equal(nativeVisionPath(url), null, url);
assert.equal(nativeStoryPath(root + "/community?story=story-1"), "/community?story=story-1");
const aasa = JSON.parse(readFileSync("public/.well-known/apple-app-site-association", "utf8"));
assert.ok(aasa.applinks.details[0].components.some((x: {"/"?:string}) => x["/"] === "/leadership/vision/*"));
const android = readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");
assert.match(android, /android:pathPrefix="\/leadership\/vision\/"/);
console.log("Vision Center native deep link checks passed.");
