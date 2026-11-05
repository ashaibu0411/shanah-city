#!/usr/bin/env node
/** Verify Commons vocal gospel candidate files (license + mime). */
const FILES = [
  "File:Swing Low, Sweet Chariot - Fisk Jubilee Singers (1909).mp3",
  "File:The Golden Jubilee Quartet - Oh Jonah.ogg",
  "File:The Spiritual Four Quartet - John the Revelator.ogg",
  "File:01 - Go down Moses (Negro Spiritual).ogg",
  "File:Down by the Riverside - Golden Gate Quartet.ogg",
  "File:Joshua Fit the Battle of Jericho - Golden Gate Quartet.ogg",
  "File:Steal Away - Golden Gate Quartet.ogg",
  "File:Were You There - Golden Gate Quartet.ogg",
  "File:Amazing Grace - Concert Band - United States Air Force Reserve Band.mp3",
  "File:Gospel Train.mp3",
  "File:The God of Abraham Praise - United States Air Force Band.mp3",
];

const params = new URLSearchParams({
  action: "query",
  format: "json",
  prop: "imageinfo",
  iiprop: "url|extmetadata|mime|size",
  titles: FILES.join("|"),
  origin: "*",
});
const data = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
  headers: { "User-Agent": "ShanahCityStoryMusic/1.0" },
}).then((r) => r.json());

for (const page of Object.values(data.query?.pages ?? {})) {
  const info = page.imageinfo?.[0];
  const ext = info?.extmetadata ?? {};
  console.log(
    JSON.stringify({
      title: page.title,
      mime: info?.mime,
      license: ext.LicenseShortName?.value,
      licenseUrl: ext.LicenseUrl?.value?.replace(/<[^>]+>/g, ""),
      artist: ext.Artist?.value?.replace(/<[^>]+>/g, " ").slice(0, 120),
      url: info?.url?.split("?")[0],
      desc: ext.ImageDescription?.value?.replace(/<[^>]+>/g, " ").slice(0, 100),
    }),
  );
}
