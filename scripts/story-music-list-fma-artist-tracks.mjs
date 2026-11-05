#!/usr/bin/env node
const slug = process.argv[2] ?? "lee-wastler";
const url = `https://freemusicarchive.org/music/${slug}/`;
const html = await fetch(url, { headers: { "User-Agent": "ShanahCityStoryMusic/1.0" } }).then((r) => r.text());
const links = [...html.matchAll(/href="(\/music\/lee-wastler\/[^"]+)"/gi)].map((m) => m[1]);
const unique = [...new Set(links)].filter((h) => h.split("/").length >= 5);
console.log("links", unique.length);
for (const href of unique.slice(0, 25)) {
  console.log(href);
}
