import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ios = readFileSync("ios/App/App/App.entitlements", "utf8");
const project = readFileSync("ios/App/App.xcodeproj/project.pbxproj", "utf8");
const aasa = JSON.parse(readFileSync("public/.well-known/apple-app-site-association", "utf8"));
const android = readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");
const androidRoute = readFileSync("src/app/.well-known/assetlinks.json/route.ts", "utf8");
const mobileHandler = readFileSync("src/components/app/NativeStoryLinkHandler.tsx", "utf8");
const appShell = readFileSync("src/components/app/AppShell.tsx", "utf8");
const share = readFileSync("src/components/community/CommunityStoryExternalShare.tsx", "utf8");
const web = readFileSync("src/app/community/page.tsx", "utf8");
const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));

assert.match(ios, /com\.apple\.developer\.associated-domains/);
assert.match(ios, /applinks:shanah-city\.vercel\.app/);
assert.match(project, /DEVELOPMENT_TEAM = S4MRT53FN9;/);
assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER = org\.shanahcity\.app;/);
const appId = aasa.applinks.details[0].appID;
assert.equal(appId, "S4MRT53FN9.org.shanahcity.app");
assert.deepEqual(aasa.applinks.details[0].components[0]["/"], "/community");
assert.equal(aasa.applinks.details[0].components[0]["?"].story, "*");
assert.ok(vercel.headers.some((h: { source: string; headers: Array<{key:string;value:string}> }) =>
  h.source === "/.well-known/apple-app-site-association" &&
  h.headers.some(header => header.key === "Content-Type" && header.value === "application/json")));

assert.match(android, /android:autoVerify="true"/);
assert.match(android, /android:scheme="https"/);
assert.match(android, /android:host="shanah-city\.vercel\.app"/);
assert.match(android, /android:path="\/community"/);
assert.match(androidRoute, /process\.env\.ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS/);
assert.match(androidRoute, /org\.shanahcity\.app/);
assert.match(androidRoute, /delegate_permission\/common\.handle_all_urls/);
assert.match(androidRoute, /status: 503/, "Never publish fake certificate fingerprints");

assert.match(mobileHandler, /App\.addListener\("appUrlOpen"/);
assert.match(mobileHandler, /App\.getLaunchUrl\(\)/);
assert.match(mobileHandler, /url\.hostname !== APP_LINK_HOST/);
assert.match(mobileHandler, /url\.pathname !== "\/community"/);
assert.match(mobileHandler, /url\.searchParams\.get\("story"\)/);
assert.match(mobileHandler, /window\.location\.assign\(path\)/);
assert.match(appShell, /<NativeStoryLinkHandler \/>/);
assert.match(share, /https:\/\/shanah-city\.vercel\.app\/community\?story=/);
assert.match(web, /params\.story && !user/);

console.log("Native app Story links: Apple association, Android verification, secure routing and WhatsApp URL checks passed.");
