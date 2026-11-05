#!/usr/bin/env node
/**
 * Assess discovery pool, reject ineligible rows, build bulk import packets for rights-cleared vocal gospel.
 * Output: data/story-music-bulk-import-packets.json + data/story-music-bulk-import-manifest.json
 */
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { loadFreeLibraryPublishState } from "./story-music-free-library-resume.mjs";
import { resolveFmaRecordingUrl, licenseAllowsStoryMusicQueue } from "./story-music-fma-recording-url.mjs";

const ROOT = process.cwd();
const DISCOVERY_PATH = path.join(ROOT, "data", "story-music-discovery-candidates.json");
const PACKETS_PATH = path.join(ROOT, "data", "story-music-bulk-import-packets.json");
const MANIFEST_PATH = path.join(ROOT, "data", "story-music-bulk-import-manifest.json");
const REPORT_PATH = path.join(ROOT, "data", "story-music-vocal-expansion-report.json");

const PROTECTED_CATALOG_IDS = new Set([
  "amazing-grace-usaf-reserve-band",
  "the-god-of-abraham-praise-usaf-band",
  "gospel-train-us-navy-edwards",
]);

const NEGATIVE =
  /\b(sermon|speech|lecture|podcast|interview|national anthem|language sample|LL-Q|wiktionary|\.mid$|midi|test tone|silence|secular pop|movie soundtrack|agnostic mountain|sunday service|sunday gathering|candlelight service|englewood christian church|no pain, no gain|gospel study|commentary|librivox|read by|quran|bhajan|drunkenjoe|audio sample|celestianpower|cambridgebayweather|negro spiritual\.ogg|en-uk-negro|ad te levavi|latin choral|faruqi|marines['’]? hymn|marine['’]?s hymn|the marines['’]? hymn|usmc band|u\.s\. marine band|offenbach|air force hymn|usna band|hymn to liberty|in praise of death|yun sim|inleiding|king['’]?s singers|instrumental\.oga|without words|bull of heaven|common-father-endlessness)\b/i;
  /\b(instrumental only|piano solo|organ solo|hymn tune\b|stock music|background music|ambient worship|flight hymn by ross bugden)\b/i;

const VOCAL_POSITIVE =
  /\b(quartet|choir|singers|jubilee|spiritual|congregation|sings|singing|vocal|sea chanters|gospel train|lee wastler|worship team|praise|hymn\b.*(band|sergeants|chanters|choir)|rock of ages|handel.*messiah.*choir|singing sergeants)\b/i;

function slugId(artist, title) {
  return `${artist}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

function stableCatalogId(artist, title, discoveryId) {
  const base = slugId(artist, title);
  if (base.length >= 8) return base;
  return `track-${createHash("sha256").update(discoveryId).digest("hex").slice(0, 16)}`;
}

function stripHtml(html) {
  return (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function licenseOk(row) {
  if (row.licenseClass === "rejected") return false;
  const combined = `${row.licenseSlug ?? ""} ${row.licenseUrl ?? ""} ${row.licenseClass ?? ""}`.toLowerCase();
  if (/by-nc|by-nd|by-sa/.test(combined)) return false;
  if (row.licenseClass === "cc-by" || /cc.?by|creativecommons\.org\/licenses\/by\//.test(combined)) return true;
  if (row.licenseClass === "public-domain" || row.licenseClass === "cc0") return true;
  if (/public domain/.test(combined)) return true;
  return false;
}

function normalizeLicenseClass(row) {
  const combined = `${row.licenseSlug ?? ""} ${row.licenseUrl ?? ""}`.toLowerCase();
  if (/public domain|pd-us|pd us/.test(combined) && !/cc0|publicdomain\/zero/.test(combined)) {
    return "public-domain";
  }
  if (/cc0|publicdomain\/zero/.test(combined)) return "cc0";
  if (/creativecommons\.org\/licenses\/by\//.test(combined) || row.licenseClass === "cc-by") return "cc-by";
  return row.licenseClass;
}

function pickerTags(row, title, artist, desc) {
  const tags = new Set(["free-library", "verified-vocal"]);
  const blob = `${title} ${artist} ${desc} ${(row.tags ?? []).join(" ")}`.toLowerCase();
  if (/african|ghana|nigeria|congo|zulu|swahili|kenya/.test(blob)) tags.add("african_gospel");
  if (/quartet|jubilee|1909|spiritual|negro spiritual|field recording/.test(blob)) tags.add("traditional_gospel");
  if (/choir|chorus|sergeants|chanters/.test(blob)) tags.add("gospel_choirs");
  if (/lee wastler|contemporary|worship song|praise team/.test(blob)) tags.add("gospel_worship_songs");
  if (tags.size === 2) tags.add("gospel_worship_songs");
  return [...tags];
}

function genresFor(tags) {
  const g = new Set(["gospel"]);
  if (tags.includes("traditional_gospel")) g.add("hymn");
  if (tags.includes("gospel_worship_songs") || tags.includes("african_gospel")) g.add("worship");
  if (tags.includes("gospel_worship_songs")) g.add("contemporary_christian");
  return [...g];
}

async function fetchCommonsApi(params) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { "User-Agent": "ShanahCityBulkManifest/1.0" },
    });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
      continue;
    }
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      if (attempt < 4) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      throw new Error(`Commons API non-JSON: ${text.slice(0, 80)}`);
    }
  }
  throw new Error("Commons API rate limited");
}

async function verifyCommonsBatch(candidates) {
  const titles = candidates.filter((c) => c.sourceStableId?.startsWith("File:")).map((c) => c.sourceStableId);
  const results = new Map();
  for (let i = 0; i < titles.length; i += 20) {
    const chunk = titles.slice(i, i + 20);
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "imageinfo",
      iiprop: "url|extmetadata|mime",
      titles: chunk.join("|"),
      origin: "*",
    });
    const data = await fetchCommonsApi(params);
    for (const page of Object.values(data.query?.pages ?? {})) {
      results.set(page.title, page.imageinfo?.[0] ?? null);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  return results;
}

async function main() {
  const { tracks: publishedTracks } = loadFreeLibraryPublishState();
  const publishedCatalogIds = new Set(publishedTracks.keys());

  const file = JSON.parse(await readFile(DISCOVERY_PATH, "utf8"));
  const pool = file.candidates.filter(
    (c) => c.reviewStatus !== "published" && c.reviewStatus !== "rejected" && c.reviewStatus !== "revoked",
  );

  const commonsPool = pool.filter((c) => c.source === "wikimedia_commons");
  const commonsMeta = await verifyCommonsBatch(commonsPool);

  const packets = {};
  const manifest = [];
  const rejected = [];
  let assessed = 0;

  for (const row of pool) {
    assessed += 1;
    let title = row.title.replace(/^File:/i, "").replace(/\.(ogg|mp3|wav|flac)$/i, "").trim();
    let artist = row.artist;
    let recordingUrl = row.recordingUrl?.split("?")[0] ?? "";
    let licenseShort = row.licenseSlug;
    let licenseUrl = row.licenseUrl;
    let description = "";

    if (NEGATIVE.test(`${title} ${artist} ${(row.tags ?? []).join(" ")}`)) {
      rejected.push({ id: row.id, reason: "negative-content-filter" });
      row.reviewStatus = "rejected";
      row.rejectionReason = "Expansion assess: non-worship or ineligible content.";
      continue;
    }
    if (/\.mid(\?|$)|audio\/midi/i.test(`${recordingUrl} ${title} ${row.fileFormat ?? ""}`)) {
      rejected.push({ id: row.id, reason: "midi-not-audio" });
      row.reviewStatus = "rejected";
      row.rejectionReason = "Expansion assess: MIDI file, not a vocal recording.";
      continue;
    }
    if (INSTRUMENTAL_ONLY.test(`${title} ${description}`)) {
      rejected.push({ id: row.id, reason: "instrumental-only" });
      row.reviewStatus = "rejected";
      row.rejectionReason = "Expansion assess: instrumental-only signal.";
      continue;
    }

    if (row.source === "wikimedia_commons") {
      const info = commonsMeta.get(row.sourceStableId);
      if (info) {
        const ext = info.extmetadata ?? {};
        licenseShort = ext.LicenseShortName?.value ?? licenseShort;
        licenseUrl = stripHtml(ext.LicenseUrl?.value ?? "") || licenseUrl;
        artist = stripHtml(ext.Artist?.value) || artist;
        description = stripHtml(ext.ImageDescription?.value ?? "");
        recordingUrl = info.url?.split("?")[0] ?? recordingUrl;
      }
    } else if (row.sourceStableId?.startsWith("fma:")) {
      const slug = row.sourceStableId.replace(/^fma:/, "");
      const resolved = await resolveFmaRecordingUrl(slug);
      if (resolved.recordingUrl) recordingUrl = resolved.recordingUrl;
      if (resolved.license) {
        const check = licenseAllowsStoryMusicQueue(resolved.license);
        if (!check.allowed) {
          rejected.push({ id: row.id, reason: check.reason });
          row.reviewStatus = "rejected";
          continue;
        }
      }
    }

    row.licenseClass = normalizeLicenseClass({ ...row, licenseSlug: licenseShort, licenseUrl });
    if (row.licenseClass === "cc0" && /public domain/i.test(licenseShort ?? "")) {
      row.licenseClass = "public-domain";
    }

    if (!licenseOk({ ...row, licenseSlug: licenseShort, licenseUrl })) {
      rejected.push({ id: row.id, reason: "license-blocked" });
      row.reviewStatus = "rejected";
      row.rejectionReason = "Expansion assess: NC/ND/SA or unverified license.";
      continue;
    }

    if (!VOCAL_POSITIVE.test(`${title} ${artist} ${description} ${row.vocalEvidence ?? ""}`)) {
      if (row.vocalContent !== "verified_vocal" && row.vocalContent !== "likely_vocal") {
        rejected.push({ id: row.id, reason: "no-vocal-signal" });
        row.reviewStatus = "rejected";
        row.rejectionReason = "Expansion assess: no verified vocal gospel signal.";
        continue;
      }
    }

    const GOSPEL_CONTEXT =
      /\b(gospel|spiritual|worship|hymn|praise|christ|jesus|jubilee|quartet|chanters|sergeants|lee wastler|rock of ages|battle hymn|amazing grace|go down|jonah|revelator|congregation|gospel train|tallis|chariot|pharaoh)\b/i;
    if (!GOSPEL_CONTEXT.test(`${title} ${artist} ${description}`)) {
      rejected.push({ id: row.id, reason: "not-gospel-context" });
      row.reviewStatus = "rejected";
      row.rejectionReason = "Expansion assess: not Christian/gospel worship context.";
      continue;
    }

    if (/handel|messiah,\s*part|scherchen/i.test(`${title} ${description}`)) {
      rejected.push({ id: row.id, reason: "classical-oratorio-excerpt" });
      row.reviewStatus = "rejected";
      continue;
    }

    if (!recordingUrl.startsWith("https://upload.wikimedia.org/") && !recordingUrl.includes("files.freemusicarchive.org")) {
      rejected.push({ id: row.id, reason: "no-direct-audio-url" });
      continue;
    }

    const catalogTrackId = row.catalogTrackId ?? stableCatalogId(artist, title, row.id);
    if (PROTECTED_CATALOG_IDS.has(catalogTrackId) || publishedCatalogIds.has(catalogTrackId)) {
      continue;
    }
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const duplicatePublished = [...publishedTracks.values()].some((t) => {
      const existing = (t.title ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      return existing && normalizedTitle.includes(existing.slice(0, 20)) && existing.length > 8;
    });
    if (/swing low,\s*sweet chariot/i.test(title) && publishedCatalogIds.has("swing-low-sweet-chariot-fisk-1909")) {
      rejected.push({ id: row.id, reason: "duplicate-published-spiritual" });
      row.reviewStatus = "rejected";
      row.rejectionReason = "Expansion assess: duplicate of published catalog recording.";
      continue;
    }
    if (duplicatePublished && /swing low|gospel train|amazing grace/i.test(title)) {
      rejected.push({ id: row.id, reason: "duplicate-published-title" });
      row.reviewStatus = "rejected";
      row.rejectionReason = "Expansion assess: duplicate of published catalog recording.";
      continue;
    }
    const tags = pickerTags(row, title, artist, description);
    const licenseSlug =
      row.licenseClass === "cc-by"
        ? licenseShort?.includes("BY") ? licenseShort : "CC BY"
        : "public-domain";

    const packet = {
      catalogTrackId,
      title: title.slice(0, 200),
      artist: artist.slice(0, 200),
      recordingUrl,
      licenseSlug,
      licenseUrl: licenseUrl ?? "",
      attributionStatement:
        row.attributionStatement ??
        (row.licenseClass === "cc-by"
          ? `${title} — ${artist} (${licenseShort || "CC BY"}). Source: Wikimedia Commons.`
          : `${title} — ${artist} (public domain recording).`),
      rightsEvidenceRef:
        row.rightsEvidenceRef ?? `Commons ${row.sourceStableId} (${licenseShort || row.licenseClass}).`,
      recordingRightsNote:
        row.recordingRightsNote ??
        `Commons-verified ${licenseShort || row.licenseClass}; owner-approved vocal expansion batch.`,
      compositionRightsNote:
        row.compositionRightsNote ??
        "Traditional hymn/spiritual or composition cleared via source license — verify if modern arrangement.",
      territory:
        row.territory ??
        (row.licenseClass === "cc-by"
          ? "Worldwide (CC BY — curator attestation on file for Blob hosting and story sync)"
          : "Worldwide (public domain recording — owner-approved import)"),
      genres: genresFor(tags),
      tags,
    };

    packets[row.id] = packet;
    manifest.push(row.id);
  }

  await writeFile(DISCOVERY_PATH, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  await writeFile(
    PACKETS_PATH,
    `${JSON.stringify({ version: "1", updatedAt: new Date().toISOString(), packets }, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    MANIFEST_PATH,
    `${JSON.stringify({ version: "1", updatedAt: new Date().toISOString(), candidateIds: manifest }, null, 2)}\n`,
    "utf8",
  );

  const report = {
    assessed,
    importReady: manifest.length,
    rejected: rejected.length,
    rejectionSamples: rejected.slice(0, 30),
    alreadyPublished: publishedCatalogIds.size,
  };
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
