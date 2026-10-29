#!/usr/bin/env node
/**
 * Discover free worship/gospel audio candidates via official APIs (metadata only).
 * Does NOT auto-approve or download audio. Run locally/CI; commit updated JSON for admin review.
 *
 * Usage: node scripts/story-music-discover-sources.mjs [--max-per-query=30]
 */

import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { createHash } from "crypto";

const ROOT = process.cwd();
const OUT_PATH = path.join(ROOT, "data", "story-music-discovery-candidates.json");

const SEARCH_QUERIES = [
  "gospel",
  "worship",
  "christian",
  "praise",
  "prayer hymn",
  "instrumental worship",
  "christian piano",
  "gospel choir",
  "african gospel",
  "thanksgiving worship",
  "peaceful spiritual instrumental",
  "hymn piano",
  "church organ hymn",
  "gospel praise",
  "christian meditation",
];

const CATEGORY = "worship";

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
  if (/publicdomain|cc0|\/by\/4|license\/by\//.test(combined)) return false;
  if (license === "cc0" || license === "by" || license === "pdm") return false;
  return !/cc0|public.?domain|creativecommons\.org\/licenses\/by\//.test(combined);
}

function classifyLicense(license, licenseUrl) {
  const combined = `${license ?? ""} ${licenseUrl ?? ""}`.toLowerCase();
  if (rejectLicense(license, licenseUrl)) return { licenseClass: "rejected", allowed: false };
  if (/cc0|publicdomain|public.?domain|pdm/.test(combined)) {
    return { licenseClass: "cc0", allowed: true };
  }
  return { licenseClass: "cc-by", allowed: true };
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "ShanahCityStoryMusicDiscovery/1.0 (admin catalog pipeline)",
      Accept: "application/json",
      ...headers,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url.slice(0, 120)}`);
  }
  return response.json();
}

let openverseTokenCache = null;

async function getOpenverseAccessToken() {
  if (openverseTokenCache?.expiresAt > Date.now() + 60_000) {
    return openverseTokenCache.token;
  }
  const clientId = process.env.OPENVERSE_CLIENT_ID?.trim();
  const clientSecret = process.env.OPENVERSE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const response = await fetch("https://api.openverse.org/v1/auth_tokens/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error(`Openverse token HTTP ${response.status}`);
  }
  const data = await response.json();
  openverseTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return openverseTokenCache.token;
}

async function discoverOpenverse(maxPerQuery) {
  const rows = [];
  let token = null;
  try {
    token = await getOpenverseAccessToken();
  } catch (error) {
    console.warn("Openverse OAuth unavailable:", error instanceof Error ? error.message : error);
  }
  if (!token) {
    console.warn(
      "Skipping Openverse (set OPENVERSE_CLIENT_ID and OPENVERSE_CLIENT_SECRET — register at api.openverse.org).",
    );
    return rows;
  }
  for (const q of SEARCH_QUERIES) {
    const params = new URLSearchParams({
      q,
      license: "cc0,by",
      page_size: String(Math.min(maxPerQuery, 50)),
    });
    const url = `https://api.openverse.org/v1/audio/?${params}`;
    try {
      const data = await fetchJson(url, { Authorization: `Bearer ${token}` });
      for (const item of data.results ?? []) {
        const license = (item.license ?? "").toLowerCase();
        const licenseUrl = item.license_url ?? item.license_version ?? "";
        const { licenseClass, allowed } = classifyLicense(license, licenseUrl);
        const recordingUrl = item.url ?? item.detail_url ?? "";
        const sourcePageUrl = item.foreign_landing_url ?? item.detail_url ?? recordingUrl;
        if (!recordingUrl || !sourcePageUrl) continue;
        const stableId = String(item.id ?? item.identifier ?? sourcePageUrl);
        rows.push({
          source: "openverse",
          sourceStableId: stableId,
          dedupeKey: dedupeKey("openverse", stableId, recordingUrl),
          title: (item.title ?? "Untitled").slice(0, 200),
          artist: (item.creator ?? item.source ?? "Unknown").slice(0, 200),
          category: CATEGORY,
          sourcePageUrl,
          recordingUrl,
          licenseSlug: license || "unknown",
          licenseUrl: typeof licenseUrl === "string" ? licenseUrl : String(licenseUrl ?? ""),
          licenseClass: allowed ? licenseClass : "rejected",
          durationSec: typeof item.duration === "number" ? item.duration : undefined,
          fileFormat: item.filetype ?? undefined,
          tags: [q],
          searchQuery: q,
          reviewStatus: allowed ? "discovered" : "rejected",
          rejectionReason: allowed ? undefined : "License failed strict CC0/CC BY filter.",
        });
      }
    } catch (error) {
      console.warn(`Openverse query "${q}" failed:`, error instanceof Error ? error.message : error);
    }
    await sleep(800);
  }
  return rows;
}

async function discoverWikimedia(maxPerQuery) {
  const rows = [];
  const searches = [
    "gospel music",
    "hymn music",
    "worship audio",
    "christian hymn",
    "praise music",
    "spiritual song",
    "church music",
    "organ hymn",
    "gospel choir",
    "christian piano",
    "african gospel",
    "gospel blues",
    "sacred music",
    "religious hymn",
    "worship instrumental",
    "christian worship",
    "gospel song",
    "hymn vocal",
    "gospel recording",
    "christian music audio",
  ];
  for (const q of searches) {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      list: "search",
      srsearch: `filetype:audio ${q}`,
      srnamespace: "6",
      srlimit: String(Math.min(maxPerQuery, 50)),
      origin: "*",
    });
    try {
      const data = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
      const titles = (data.query?.search ?? [])
        .map((hit) => hit.title)
        .filter((title) => /\.(ogg|oga|opus|mp3|wav|flac|mid)$/i.test(title ?? ""));
      if (titles.length === 0) continue;

      const batchParams = new URLSearchParams({
        action: "query",
        format: "json",
        prop: "imageinfo",
        iiprop: "url|extmetadata|mime|size",
        titles: titles.join("|"),
        origin: "*",
      });
      const meta = await fetchJson(`https://commons.wikimedia.org/w/api.php?${batchParams}`);
      const pages = meta.query?.pages ?? {};
      for (const page of Object.values(pages)) {
        const title = page.title ?? "";
        const info = page.imageinfo?.[0];
        if (!info?.url) continue;
        const ext = info.extmetadata ?? {};
        const licenseShort = ext.LicenseShortName?.value ?? "";
        const licenseUrl = ext.LicenseUrl?.value ?? "";
        const artist = ext.Artist?.value?.replace(/<[^>]+>/g, "").trim() || "Wikimedia Commons contributor";
        const { licenseClass, allowed } = classifyLicense(licenseShort, licenseUrl);
        const fileTitle = title.replace(/^File:/i, "");
        const sourcePageUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
        const stableId = title;
        rows.push({
          source: "wikimedia_commons",
          sourceStableId: stableId,
          dedupeKey: dedupeKey("wikimedia_commons", stableId, info.url),
          title: fileTitle.slice(0, 200),
          artist: artist.slice(0, 200),
          category: CATEGORY,
          sourcePageUrl,
          recordingUrl: info.url,
          licenseSlug: licenseShort || "needs-page-review",
          licenseUrl,
          licenseClass: allowed ? licenseClass : "rejected",
          durationSec: info.size ? undefined : undefined,
          fileFormat: info.mime,
          tags: [q],
          searchQuery: q,
          reviewStatus: allowed ? "needs_review" : "rejected",
          rejectionReason: allowed
            ? "Commons metadata passed filter — human must verify composition/recording on file page."
            : "Commons license failed strict CC0/CC BY filter.",
        });
      }
    } catch (error) {
      console.warn(`Wikimedia query "${q}" failed:`, error instanceof Error ? error.message : error);
    }
    await sleep(500);
  }
  return rows;
}

async function discoverFmaArchive(maxPerQuery) {
  const rows = [];
  const queries = [
    'mediatype:audio AND licenseurl:*creativecommons.org/licenses/by/* AND (title:gospel OR title:worship OR title:hymn)',
    'mediatype:audio AND licenseurl:*publicdomain* AND (title:gospel OR title:christian)',
    'collection:freemusicarchive AND mediatype:audio AND (title:gospel OR title:worship OR subject:gospel)',
  ];
  for (const q of queries) {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier,title,creator,licenseurl,format&rows=${Math.min(maxPerQuery, 100)}&output=json`;
    try {
      const data = await fetchJson(url);
      for (const doc of data.response?.docs ?? []) {
      const identifier = doc.identifier;
      if (!identifier) continue;
      const sourcePageUrl = `https://archive.org/details/${identifier}`;
      const recordingUrl = `https://archive.org/download/${identifier}`;
      const licenseUrl = doc.licenseurl ?? "";
      const { licenseClass, allowed } = classifyLicense("", licenseUrl);
      rows.push({
        source: "fma_archive",
        sourceStableId: identifier,
        dedupeKey: dedupeKey("fma_archive", identifier, recordingUrl),
        title: (doc.title ?? identifier).slice(0, 200),
        artist: (Array.isArray(doc.creator) ? doc.creator[0] : doc.creator) ?? "Free Music Archive",
        category: CATEGORY,
        sourcePageUrl,
        recordingUrl,
        licenseSlug: allowed ? licenseClass : "unknown",
        licenseUrl: String(licenseUrl),
        licenseClass: allowed ? licenseClass : "rejected",
        tags: ["archive.org", "fma"],
        searchQuery: q,
        reviewStatus: allowed ? "discovered" : "rejected",
        rejectionReason: allowed ? undefined : "Archive license URL failed strict filter.",
      });
      }
    } catch (error) {
      console.warn(`Archive search failed (${q.slice(0, 40)}…):`, error instanceof Error ? error.message : error);
    }
    await sleep(600);
  }
  return rows;
}

function mergeCandidates(existing, incoming) {
  const byKey = new Map(existing.map((c) => [c.dedupeKey, c]));
  const now = new Date().toISOString();
  for (const row of incoming) {
    const prior = byKey.get(row.dedupeKey);
    if (prior) {
      prior.tags = [...new Set([...(prior.tags ?? []), ...(row.tags ?? [])])];
      prior.updatedAt = now;
      continue;
    }
    byKey.set(row.dedupeKey, {
      id: `smd-${row.dedupeKey}`,
      discoveredAt: now,
      updatedAt: now,
      ...row,
    });
  }
  return [...byKey.values()];
}

async function main() {
  const maxArg = process.argv.find((a) => a.startsWith("--max-per-query="));
  const maxPerQuery = maxArg ? Number(maxArg.split("=")[1]) : 30;

  let existing = [];
  try {
    const raw = await readFile(OUT_PATH, "utf8");
    existing = JSON.parse(raw).candidates ?? [];
  } catch {
    existing = [];
  }

  console.log("Discovering from Openverse, Wikimedia Commons, FMA (Internet Archive)…");
  const [openverse, wikimedia, fma] = await Promise.all([
    discoverOpenverse(maxPerQuery),
    discoverWikimedia(Math.min(maxPerQuery, 25)),
    discoverFmaArchive(Math.min(maxPerQuery, 50)),
  ]);

  const merged = mergeCandidates(existing, [...openverse, ...wikimedia, ...fma]);
  const payload = {
    version: "1",
    updatedAt: new Date().toISOString(),
    candidates: merged,
  };

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const stats = {
    total: merged.length,
    openverse: openverse.length,
    wikimedia: wikimedia.length,
    fma: fma.length,
    discovered: merged.filter((c) => c.reviewStatus === "discovered").length,
    rejected: merged.filter((c) => c.reviewStatus === "rejected").length,
  };
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
