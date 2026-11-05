#!/usr/bin/env node
/** One-off fetch helpers for vocal candidate curation (stdout only). */
import { createHash } from "crypto";

async function archiveSearch(query, rows = 25) {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,creator,licenseurl,description&rows=${rows}&output=json`;
  const data = await fetch(url, { headers: { "User-Agent": "ShanahCityStoryMusic/1.0" } }).then((r) => r.json());
  return data.response?.docs ?? [];
}

async function archiveAudioFile(identifier) {
  const meta = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`, {
    headers: { "User-Agent": "ShanahCityStoryMusic/1.0" },
  }).then((r) => r.json());
  const files = meta.files ?? [];
  const audio = files.find(
    (f) =>
      /\.(mp3|ogg|flac)$/i.test(f.name) &&
      !f.name.includes("_archive.torrent") &&
      !/^\.|^__/.test(f.name),
  );
  return audio
    ? {
        name: audio.name,
        url: `https://archive.org/download/${identifier}/${encodeURIComponent(audio.name)}`,
        licenseurl: meta.metadata?.licenseurl,
        title: meta.metadata?.title,
        creator: meta.metadata?.creator,
      }
    : null;
}

async function commonsSearch(search) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "search",
    srsearch: search,
    srnamespace: "6",
    srlimit: "15",
    origin: "*",
  });
  const data = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": "ShanahCityStoryMusic/1.0" },
  }).then((r) => r.json());
  return (data.query?.search ?? [])
    .map((h) => h.title)
    .filter((t) => /\.(ogg|oga|mp3|wav)$/i.test(t));
}

const cmd = process.argv[2] ?? "summary";
if (cmd === "lee-wastler") {
  const docs = await archiveSearch('creator:"Lee Wastler" AND mediatype:audio', 30);
  console.log(JSON.stringify(docs, null, 2));
} else if (cmd === "gospel-vocal-pd") {
  const titles = await commonsSearch('filetype:audio gospel choir vocal -instrumental');
  console.log(JSON.stringify(titles.slice(0, 12), null, 2));
} else if (cmd === "fma-gospel-by") {
  const docs = await archiveSearch(
    'collection:freemusicarchive AND mediatype:audio AND (title:gospel OR subject:gospel OR title:worship) AND licenseurl:*creativecommons.org/licenses/by/*',
    40,
  );
  console.log(JSON.stringify(docs.slice(0, 20), null, 2));
}
