#!/usr/bin/env node
/**
 * Re-verify the 125 discovery candidates (needs_review + discovered) against source APIs.
 * Output: .tmp-story-music-review-report.json (local) + stdout summary
 */

import { readFile, writeFile } from "fs/promises";
import path from "path";
import {
  fetchAudioPrefix,
  extractEmbeddedLicenseUrls,
  classifyEmbeddedUrls,
} from "./story-music-probe-embedded-license.mjs";

const ROOT = process.cwd();
const IN_PATH = path.join(ROOT, "data", "story-music-discovery-candidates.json");
const OUT_PATH = path.join(ROOT, ".tmp-story-music-review-report.json");

const WORSHIP_POSITIVE =
  /\b(gospel|worship|hymn|praise|christian|spiritual|sacred|church|amen|alleluia|hallelujah|psalm|organ hymn|choir|sanctus|agnus|kyrie|doxology|benediction|thanksgiving|adoration|majestic|glory|jesus|lord|christ)\b/i;

const WORSHIP_NEGATIVE =
  /\b(speech|sermon|lecture|podcast|interview|political|national anthem|secular pop|rock band|movie soundtrack|advertisement|sample only|test tone|silence|noise|quran|islamic call|bhajan|shiva worship|commentary on the gospel|gospel study|sunday service|sunday gathering|candlelight service|librivox|read by|memoir|book launch|direct audio|featuring pastor|christian nation|christian home|christian disciple|christian conflicts|christian feminist|hans christian andersen|faery tales|lost dimension|proclamation of the gospel|greek new testament|gospel of luke|gospel of acts|gospel of genesis|gospel of st jude|gospel mystery|sanctification|no pain, no gain)\b/i;

const LANGUAGE_SAMPLE = /^LL-Q\d+/i;

const SECULAR_HINT =
  /\b(blues(?! gospel)|jazz|metal|punk|hip.?hop|rap|edm|dance mix|trance|techno)\b/i;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(html) {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyCategory(title, artist, tags = []) {
  const text = `${title} ${artist} ${tags.join(" ")}`.toLowerCase();
  if (/african|ghana|nigeria|congo|zulu|swahili/.test(text)) return "African Gospel";
  if (/hymn|organ|psalm|doxology|sanctus|kyrie/.test(text)) return "Hymns";
  if (/instrumental|piano|organ|strings|midi/.test(text) && !/vocal/.test(text)) return "Worship Instrumentals";
  if (/prayer|meditation|peaceful|quiet|ambient/.test(text)) return "Prayer and Meditation";
  if (/thank/.test(text)) return "Thanksgiving";
  if (/gospel choir|choir/.test(text)) return "Gospel Vocals";
  if (/praise|celebrat|joy|hallelujah/.test(text)) return "Praise and Celebration";
  if (/worship|adoration|majestic|glory/.test(text)) return "Worship and Adoration";
  if (/background|soft/.test(text)) return "Peaceful Background Music";
  return "Worship and Adoration";
}

function worshipRelevance(title, artist, description = "") {
  const blob = `${title} ${artist} ${description}`;
  if (LANGUAGE_SAMPLE.test(title.trim())) {
    return { relevant: false, reason: "Wiktionary language-documentation sample, not worship music." };
  }
  if (WORSHIP_NEGATIVE.test(blob)) return { relevant: false, reason: "Non-worship or spoken/non-music content signal." };
  if (SECULAR_HINT.test(blob) && !/gospel/.test(blob)) return { relevant: false, reason: "Likely secular genre." };
  if (WORSHIP_POSITIVE.test(blob)) return { relevant: true, reason: "Worship/gospel keyword match." };
  return { relevant: "uncertain", reason: "Title does not clearly indicate Christian worship — needs listening review." };
}

function licenseAllowsLibrary(licenseShort, licenseUrl) {
  const combined = `${licenseShort} ${licenseUrl}`.toLowerCase();
  if (/by-nc|by-nd|by-sa|all rights reserved|copyrighted|fair use/.test(combined)) {
    return { ok: false, type: "rejected", reason: "Restricted license (NC/ND/SA or ARR)." };
  }
  if (/public domain|cc0|cc-zero|pdm/.test(combined)) {
    return { ok: true, type: "CC0/PD", attribution: false, reason: "Public domain or CC0 signal." };
  }
  if (/creativecommons\.org\/licenses\/by\//.test(combined) || /\bcc.?by\b/.test(combined)) {
    return { ok: true, type: "CC BY", attribution: true, reason: "CC BY signal — attribution required." };
  }
  return { ok: false, type: "unknown", reason: "License not independently verified on source page." };
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "ShanahCityStoryMusicReview/1.0", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function headOk(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.ok || res.status === 206;
  } catch {
    return false;
  }
}

async function verifyCommonsBatch(candidates) {
  const byTitle = new Map();
  for (const c of candidates) {
    if (!c.sourceStableId?.startsWith("File:")) continue;
    byTitle.set(c.sourceStableId, c);
  }
  const titles = [...byTitle.keys()];
  const results = new Map();
  for (let i = 0; i < titles.length; i += 40) {
    const chunk = titles.slice(i, i + 40);
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "imageinfo",
      iiprop: "url|extmetadata|mime|size|duration",
      titles: chunk.join("|"),
      origin: "*",
    });
    try {
      const data = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
      for (const page of Object.values(data.query?.pages ?? {})) {
        const title = page.title;
        const info = page.imageinfo?.[0];
        if (!title) continue;
        results.set(title, info ?? null);
      }
    } catch (e) {
      console.warn("Commons batch failed:", e.message);
    }
    await sleep(800);
  }
  return results;
}

async function verifyArchive(identifier) {
  const url = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;
  try {
    const data = await fetchJson(url);
    const files = data.files ?? [];
    const audio = files.find((f) => /\.(mp3|ogg|flac|wav)$/i.test(f.name) && !f.name.includes("_archive.torrent"));
    return {
      title: data.metadata?.title,
      creator: data.metadata?.creator,
      licenseurl: data.metadata?.licenseurl,
      audioFile: audio?.name,
      audioUrl: audio ? `https://archive.org/download/${identifier}/${encodeURIComponent(audio.name)}` : null,
      runtime: data.metadata?.runtime,
      description: data.metadata?.description ?? "",
    };
  } catch {
    return null;
  }
}

function recommendTrack(input) {
  const {
    licenseOk,
    relevant,
    audioReachable,
    compositionNote,
    hasEvidenceRef,
  } = input;

  if (!relevant) return "UNSUITABLE";
  if (!licenseOk) return "REJECTED";
  if (!audioReachable) return "NEEDS ADDITIONAL RIGHTS EVIDENCE";
  if (compositionNote === "modern_cover") return "NEEDS ADDITIONAL RIGHTS EVIDENCE";
  if (relevant === "uncertain") return "NEEDS ADDITIONAL RIGHTS EVIDENCE";
  if (!hasEvidenceRef) return "READY FOR HUMAN APPROVAL";
  return "READY FOR HUMAN APPROVAL";
}

async function main() {
  const file = JSON.parse(await readFile(IN_PATH, "utf8"));
  const pool = file.candidates.filter((c) => c.reviewStatus === "needs_review" || c.reviewStatus === "discovered");
  console.log(`Review pool: ${pool.length}`);

  const commons = pool.filter((c) => c.source === "wikimedia_commons");
  const archive = pool.filter((c) => c.source === "fma_archive");

  const commonsMeta = await verifyCommonsBatch(commons);

  const reviewed = [];

  for (const c of pool) {
    let title = c.title.replace(/^File:/i, "").replace(/\.(ogg|mp3|wav|flac|mid)$/i, "").trim();
    let artist = c.artist;
    let licenseShort = c.licenseSlug;
    let licenseUrl = c.licenseUrl;
    let directAudio = c.recordingUrl;
    let durationSec = c.durationSec;
    let description = "";
    let compositionNote = "unknown";

    if (c.source === "wikimedia_commons") {
      const info = commonsMeta.get(c.sourceStableId);
      if (info) {
        const ext = info.extmetadata ?? {};
        licenseShort = ext.LicenseShortName?.value ?? licenseShort;
        licenseUrl = ext.LicenseUrl?.value ?? licenseUrl;
        artist = stripHtml(ext.Artist?.value) || stripHtml(ext.Credit?.value) || artist;
        description = stripHtml(ext.ImageDescription?.value ?? "");
        directAudio = info.url ?? directAudio;
        durationSec = info.duration ?? durationSec;
        if (/\.mid$/i.test(c.sourceStableId)) compositionNote = "midi_render";
        else if (/hymn tune|hymn\b/i.test(title) && !/19\d\d|18\d\d/.test(description)) {
          compositionNote = "hymn_tune_verify_composition";
        } else if (/worship his majesty|modern|cover|arrangement/i.test(`${title} ${description}`)) {
          compositionNote = "modern_cover";
        } else if (/public domain|pd-us|author died/i.test(description.toLowerCase())) {
          compositionNote = "pd_claim_on_page";
        }
      } else {
        compositionNote = "commons_fetch_failed";
      }
    } else if (c.source === "fma_archive") {
      const meta = await verifyArchive(c.sourceStableId);
      if (meta) {
        title = meta.title ?? title;
        artist = (Array.isArray(meta.creator) ? meta.creator[0] : meta.creator) ?? artist;
        licenseUrl = meta.licenseurl ?? licenseUrl;
        directAudio = meta.audioUrl ?? directAudio;
        description = meta.description ?? description;
        if (meta.runtime) durationSec = parseRuntime(meta.runtime);
      }
      await sleep(200);
    }

    const relevance = worshipRelevance(title, artist, description);
    let license = licenseAllowsLibrary(licenseShort, licenseUrl);
    let embeddedLicenseNote = "";
    if (license.ok && directAudio?.startsWith("http") && /\.(ogg|oga|opus)$/i.test(directAudio)) {
      try {
        await sleep(1200);
        const prefix = await fetchAudioPrefix(directAudio.split("?")[0]);
        const embedded = extractEmbeddedLicenseUrls(prefix);
        const emb = classifyEmbeddedUrls(embedded);
        embeddedLicenseNote = embedded.length ? `Embedded tags: ${embedded.join(", ")}` : "";
        if (emb.allowed === false) {
          license = {
            ok: false,
            type: "rejected",
            reason: `Commons page license conflicts with embedded file tags (${emb.reason}).`,
          };
        }
      } catch {
        embeddedLicenseNote = "Embedded license probe skipped (fetch/rate-limit).";
      }
    }
    if (/flight hymn by ross bugden/i.test(title)) {
      relevance.relevant = false;
      relevance.reason = "Cinematic/stock instrumental; not Christian worship content.";
    }
    const audioReachable = directAudio?.startsWith("http") ? await headOk(directAudio) : false;

    const category = classifyCategory(title, artist, c.tags ?? []);

    const recommendation = recommendTrack({
      licenseOk: license.ok,
      relevant: relevance.relevant,
      audioReachable,
      compositionNote,
      hasEvidenceRef: false,
    });

    reviewed.push({
      id: c.id,
      source: c.source,
      title,
      artist: artist.slice(0, 120),
      category,
      durationSec,
      sourcePageUrl: c.sourcePageUrl,
      directAudioUrl: directAudio?.startsWith("http") ? directAudio : null,
      audioReachable,
      licenseType: license.type,
      licenseUrl: licenseUrl || null,
      licenseShort,
      rightsEvidenceRef: `discovery:${c.id} — pending curator archive of source page snapshot`,
      compositionVerification: compositionNote,
      recordingVerification: audioReachable ? "Direct file HEAD OK" : "File not confirmed reachable",
      attributionRequired: license.attribution ? "Yes — CC BY" : license.ok && license.type?.includes("CC0") ? "No (PD/CC0)" : "TBD",
      worshipRelevance: embeddedLicenseNote ? `${relevance.reason} ${embeddedLicenseNote}` : relevance.reason,
      recommendation,
      remainingApproval: [
        "Shanah City curator sign-off (not auto-approved)",
        license.ok ? null : "Confirm license on source page",
        audioReachable ? null : "Confirm downloadable audio URL",
        compositionNote.includes("modern") || compositionNote.includes("hymn_tune")
          ? "Independent composition rights check"
          : null,
        "Audio quality listen test",
        "Blob ingest + intake publish",
      ].filter(Boolean),
    });
  }

  await writeFile(OUT_PATH, JSON.stringify({ reviewedAt: new Date().toISOString(), reviewed }, null, 2));

  const stats = {
    examined: reviewed.length,
    suitable: reviewed.filter((r) => r.recommendation !== "UNSUITABLE" && r.recommendation !== "REJECTED").length,
    ready: reviewed.filter((r) => r.recommendation === "READY FOR HUMAN APPROVAL").length,
    needsEvidence: reviewed.filter((r) => r.recommendation === "NEEDS ADDITIONAL RIGHTS EVIDENCE").length,
    rejected: reviewed.filter((r) => r.recommendation === "REJECTED").length,
    unsuitable: reviewed.filter((r) => r.recommendation === "UNSUITABLE").length,
    corroboratedLicense: reviewed.filter((r) => r.licenseType === "CC BY" || r.licenseType === "CC0/PD").length,
    audioReachable: reviewed.filter((r) => r.audioReachable).length,
  };
  console.log(JSON.stringify(stats, null, 2));
}

function parseRuntime(runtime) {
  if (typeof runtime === "number") return runtime;
  const m = String(runtime).match(/(\d+)/);
  return m ? Number(m[1]) : undefined;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
