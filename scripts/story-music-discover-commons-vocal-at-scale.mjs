#!/usr/bin/env node
/**
 * Large-scale Wikimedia Commons discovery for vocal gospel / Christian worship audio (PD or CC BY only).
 * Merges into data/story-music-discovery-candidates.json — metadata only, no auto-publish.
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { createHash } from "crypto";

const ROOT = process.cwd();
const OUT_PATH = path.join(ROOT, "data", "story-music-discovery-candidates.json");

const SEARCHES = [
  "negro spiritual quartet ogg",
  "gospel quartet singers ogg",
  "jubilee singers mp3",
  "Fisk Jubilee Singers",
  "Library of Congress gospel vocal",
  "National Jukebox spiritual",
  "gospel choir singing ogg",
  "christian hymn vocal mp3",
  "Sea Chanters gospel",
  "United States Navy Band gospel vocal",
  "Air Force Band hymn vocal",
  "Sacred harp singing",
  "shape note singing gospel",
  "African American gospel field recording",
  "congregation gospel singing",
  "spiritual singers ogg PD",
  "gospel acapella ogg",
  "christian worship vocal CC BY",
  "gospel praise vocal mp3",
  "hymn choir performance ogg",
  "Rock of Ages vocal recording",
  "Amazing Grace vocal recording public domain",
  "Swing Low gospel",
  "Go Down Moses spiritual recording",
  "Were You There spiritual ogg",
  "Steal Away spiritual singers",
  "Joshua Fit the Battle spiritual",
  "Down by the Riverside gospel quartet",
  "Golden Gate Quartet",
  "Mitchell's Christian Singers",
  "Birmingham Jubilee Singers",
  "Fisk University Jubilee",
  "gospel sermon NOT",
  "Loc.gov jukebox gospel",
];

const SKIP_TITLE =
  /\b(sermon|speech|lecture|podcast|interview|national anthem|language sample|LL-Q|\.mid$|midi file|test tone|silence|\.pdf|\.mid\b|hymn tune only|organ solo|piano solo|instrumental only)\b/i;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function dedupeKey(source, stableId, recordingUrl) {
  return createHash("sha256").update(`${source}|${stableId}|${recordingUrl}`).digest("hex").slice(0, 24);
}

function rejectLicense(license, licenseUrl) {
  const combined = `${license ?? ""} ${licenseUrl ?? ""}`.toLowerCase();
  if (/by-nc|by-nd|by-sa|all rights reserved/.test(combined)) return true;
  if (/creativecommons\.org\/licenses\/by\/[\d.]+/.test(combined)) return false;
  if (/public.?domain|pd-us|pd us|license\/pd\b/.test(combined)) return false;
  if (/cc0|creativecommons\.org\/publicdomain/.test(combined)) return false;
  return !/public domain|cc.?by|creativecommons\.org\/licenses\/by\//.test(combined);
}

function classifyLicense(licenseShort, licenseUrl) {
  const combined = `${licenseShort ?? ""} ${licenseUrl ?? ""}`.toLowerCase();
  if (rejectLicense(licenseShort, licenseUrl)) {
    return { licenseClass: "rejected", allowed: false };
  }
  if (/public.?domain|pd-us|pd us|\bpd\b/.test(combined) && !/cc0/.test(combined)) {
    return { licenseClass: "public-domain", allowed: true };
  }
  if (/cc0|creativecommons\.org\/publicdomain/.test(combined)) {
    return { licenseClass: "cc0", allowed: true };
  }
  return { licenseClass: "cc-by", allowed: true };
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "ShanahCityStoryMusicDiscovery/2.0", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function searchCommons(query, limit = 50) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "search",
    srsearch: `filetype:audio ${query}`,
    srnamespace: "6",
    srlimit: String(limit),
    origin: "*",
  });
  const data = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  return (data.query?.search ?? [])
    .map((h) => h.title)
    .filter((t) => /\.(ogg|oga|opus|mp3|wav|flac)$/i.test(t ?? ""));
}

async function fetchCommonsMeta(titles) {
  if (titles.length === 0) return new Map();
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime|size",
    titles: titles.join("|"),
    origin: "*",
  });
  const data = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const out = new Map();
  for (const page of Object.values(data.query?.pages ?? {})) {
    if (page.title) out.set(page.title, page.imageinfo?.[0] ?? null);
  }
  return out;
}

function stripHtml(html) {
  return (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  const maxPerQuery = Number(process.argv.find((a) => a.startsWith("--max="))?.split("=")[1] ?? 40);
  let existing = [];
  try {
    existing = JSON.parse(await readFile(OUT_PATH, "utf8")).candidates ?? [];
  } catch {
    existing = [];
  }
  const byKey = new Map(existing.map((c) => [c.dedupeKey, c]));
  const now = new Date().toISOString();
  let incoming = 0;
  let skipped = 0;

  for (const q of SEARCHES) {
    let titles = [];
    try {
      titles = await searchCommons(q, maxPerQuery);
    } catch (e) {
      console.warn("search failed", q, e.message);
      await sleep(600);
      continue;
    }
    titles = titles.filter((t) => !SKIP_TITLE.test(t));
    for (let i = 0; i < titles.length; i += 40) {
      const chunk = titles.slice(i, i + 40);
      let meta;
      try {
        meta = await fetchCommonsMeta(chunk);
      } catch {
        await sleep(800);
        continue;
      }
      for (const title of chunk) {
        const info = meta.get(title);
        if (!info?.url) continue;
        const ext = info.extmetadata ?? {};
        const licenseShort = ext.LicenseShortName?.value ?? "";
        const licenseUrl = stripHtml(ext.LicenseUrl?.value ?? "");
        const { licenseClass, allowed } = classifyLicense(licenseShort, licenseUrl);
        const fileTitle = title.replace(/^File:/i, "");
        if (SKIP_TITLE.test(fileTitle) || SKIP_TITLE.test(stripHtml(ext.ImageDescription?.value ?? ""))) {
          skipped += 1;
          continue;
        }
        const vocalHint =
          /quartet|choir|singers|jubilee|spiritual|congregation|vocal|gospel|hymn|praise|worship|chanters|sings|singing/i.test(
            `${fileTitle} ${stripHtml(ext.ImageDescription?.value ?? "")}`,
          );
        if (!vocalHint) {
          skipped += 1;
          continue;
        }
        const artist = stripHtml(ext.Artist?.value) || stripHtml(ext.Credit?.value) || "Wikimedia Commons contributor";
        const recordingUrl = info.url.split("?")[0];
        const sourcePageUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
        const dedupe = dedupeKey("wikimedia_commons", title, recordingUrl);
        if (byKey.has(dedupe)) continue;
        const row = {
          id: `smd-${dedupe}`,
          source: "wikimedia_commons",
          sourceStableId: title,
          dedupeKey: dedupe,
          title: fileTitle.slice(0, 200),
          artist: artist.slice(0, 200),
          category: "worship",
          sourcePageUrl,
          recordingUrl,
          licenseSlug: licenseShort || (allowed ? licenseClass : "rejected"),
          licenseUrl,
          licenseClass: allowed ? licenseClass : "rejected",
          fileFormat: info.mime,
          tags: ["vocal-discovery-scale", q.slice(0, 40)],
          searchQuery: q,
          reviewStatus: allowed ? "needs_review" : "rejected",
          rejectionReason: allowed
            ? "Commons vocal gospel scale discovery — verify recording/composition before import."
            : "License failed strict PD/CC BY filter.",
          discoveredAt: now,
          updatedAt: now,
          vocalContent: vocalHint ? "likely_vocal" : "uncertain",
        };
        if (allowed) {
          row.compositionRightsNote =
            "Verify composition PD or cleared — traditional spiritual/hymn assumed pending file page review.";
          row.recordingRightsNote = `Commons LicenseShortName: ${licenseShort || licenseClass}.`;
          row.rightsEvidenceRef = `Commons ${title} (${licenseShort || licenseClass}).`;
        }
        byKey.set(dedupe, row);
        incoming += 1;
      }
      await sleep(500);
    }
    await sleep(400);
  }

  const merged = [...byKey.values()];
  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(
    OUT_PATH,
    `${JSON.stringify({ version: "1", updatedAt: now, candidates: merged }, null, 2)}\n`,
    "utf8",
  );
  console.log(
    JSON.stringify(
      { total: merged.length, newRows: incoming, skippedNonVocalOrLicense: skipped, searches: SEARCHES.length },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
