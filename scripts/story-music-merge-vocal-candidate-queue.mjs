#!/usr/bin/env node
/**
 * Merge data/story-music-vocal-candidate-queue.json into discovery candidates + render owner review doc.
 * Does NOT import audio or change published catalog tracks.
 *
 * Usage: node scripts/story-music-merge-vocal-candidate-queue.mjs [--write-doc]
 */

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { licenseAllowsStoryMusicQueue, resolveFmaRecordingUrl } from "./story-music-fma-recording-url.mjs";

const ROOT = process.cwd();
const QUEUE_PATH = path.join(ROOT, "data", "story-music-vocal-candidate-queue.json");
const DISCOVERY_PATH = path.join(ROOT, "data", "story-music-discovery-candidates.json");
const DOC_PATH = path.join(ROOT, "docs", "STORY_MUSIC_VOCAL_CANDIDATE_REVIEW.md");

function dedupeKey(source, stableId, recordingUrl) {
  return createHash("sha256").update(`${source}|${stableId}|${recordingUrl}`).digest("hex").slice(0, 24);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function queueRowToDiscovery(row) {
  let recordingUrl = row.recordingUrl ?? "";
  let source = row.source === "fma_live" ? "fma_archive" : row.source;
  let sourceStableId = row.sourceStableId ?? row.fmaPageSlug ?? row.queueId;
  let licenseUrl = row.licenseUrl ?? "";
  let licenseClass = row.licenseClass ?? "rejected";

  if (row.source === "fma_live" && row.fmaPageSlug) {
    const resolved = await resolveFmaRecordingUrl(row.fmaPageSlug);
    if (resolved.recordingUrl) recordingUrl = resolved.recordingUrl;
    if (resolved.license) {
      const check = licenseAllowsStoryMusicQueue(resolved.license);
      if (!check.allowed) {
        return { skip: true, reason: check.reason, row };
      }
      licenseClass = check.licenseClass;
      licenseUrl = check.licenseUrl;
    }
    if (resolved.instrumental && /^yes$/i.test(resolved.instrumental)) {
      return { skip: true, reason: "FMA marks track as instrumental.", row };
    }
    sourceStableId = `fma:${row.fmaPageSlug}`;
    await sleep(350);
  }

  if (!recordingUrl) {
    return { skip: true, reason: "No direct recording URL.", row };
  }

  const candidate = {
    source,
    sourceStableId,
    dedupeKey: dedupeKey(source, sourceStableId, recordingUrl),
    title: row.title,
    artist: row.artist,
    category: "worship",
    sourcePageUrl: row.sourcePageUrl,
    recordingUrl,
    licenseSlug: row.licenseSlug ?? licenseClass,
    licenseUrl,
    licenseClass,
    attributionStatement: row.attributionStatement,
    compositionRightsNote: row.compositionRightsNote,
    recordingRightsNote: row.recordingRightsNote,
    rightsEvidenceRef: row.rightsEvidenceRef,
    territory: row.territory,
    streamingPermitted: row.streamingPermitted,
    storagePermitted: row.storagePermitted,
    syncPermitted: row.syncPermitted,
    vocalContent: row.vocalContent,
    vocalEvidence: row.vocalEvidence,
    pickerCategories: row.pickerCategories,
    vocalQueueId: row.queueId,
    reviewerDecision: row.reviewerDecision ?? "pending_owner_listen",
    reviewStatus: row.reviewStatus ?? "needs_review",
    tags: [
      "vocal-candidate-queue",
      ...(row.pickerCategories ?? []),
      row.vocalContent === "verified_vocal" ? "verified-vocal" : "vocal-review",
    ],
    genres: row.pickerCategories?.includes("traditional_gospel") && !row.pickerCategories?.includes("gospel_worship_songs")
      ? ["hymn", "gospel"]
      : row.pickerCategories?.includes("traditional_gospel")
        ? ["gospel", "hymn"]
        : ["gospel", "contemporary_christian", "worship"],
    searchQuery: "vocal-candidate-queue",
    rejectionReason: row.reviewerDecision === "owner_approved"
      ? "Owner selected; curator rights verification and authorized Blob import still pending."
      : "Awaiting owner listen/approve — not imported to Blob.",
  };

  return { skip: false, candidate, row };
}

function mergeIntoDiscovery(existing, incoming) {
  const byKey = new Map(existing.map((c) => [c.dedupeKey, c]));
  const byQueueId = new Map(
    existing.filter((c) => c.vocalQueueId).map((c) => [c.vocalQueueId, c]),
  );
  const now = new Date().toISOString();
  let added = 0;
  let updated = 0;
  let skippedPublished = 0;

  for (const row of incoming) {
    if (row.skip) continue;
    const c = row.candidate;
    const prior =
      byKey.get(c.dedupeKey) ??
      (row.row.discoveryDedupeKey ? existing.find((x) => x.dedupeKey === row.row.discoveryDedupeKey) : null) ??
      byQueueId.get(c.vocalQueueId);

    if (prior?.reviewStatus === "published") {
      skippedPublished += 1;
      continue;
    }

    if (prior) {
      Object.assign(prior, {
        ...c,
        id: prior.id,
        discoveredAt: prior.discoveredAt,
        updatedAt: now,
        reviewStatus: prior.reviewStatus === "published" ? "published" : c.reviewStatus,
      });
      updated += 1;
      continue;
    }

    byKey.set(c.dedupeKey, {
      id: `smd-${c.dedupeKey}`,
      discoveredAt: now,
      updatedAt: now,
      ...c,
    });
    added += 1;
  }

  return { candidates: [...byKey.values()], added, updated, skippedPublished };
}

function renderDoc(queue, mergeStats, resolvedPreview) {
  const lines = [];
  lines.push("# Story Music — Vocal candidate review (owner listen / approve)");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("**No live import yet.** The owner approved all 11 candidates for consideration on 2026-11-04. This records selection only: rights clearance, genuine curator attestation, and authorized Blob import remain required.");
  lines.push("");
  lines.push("## Existing free library (do not modify)");
  lines.push("");
  for (const row of queue.alreadyPublishedDoNotModify ?? []) {
    lines.push(`- **${row.title}** (\`${row.catalogTrackId}\`) — ${row.note}`);
  }
  lines.push("");
  lines.push(`## Vocal candidates (${(queue.candidates ?? []).length}) — owner approved; rights/import review pending`);
  lines.push("");
  lines.push(
    "| Listen | Title | Artist | Vocal evidence | License | Storage / sync | Preview URL | Decision |",
  );
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const row of queue.candidates ?? []) {
    const preview = resolvedPreview.get(row.queueId)?.recordingUrl ?? row.recordingUrl ?? "—";
    const listen = row.sourcePageUrl ? `[FMA/Commons](${row.sourcePageUrl})` : "—";
    const storage =
      row.storagePermitted === true
        ? "PD — storage OK pending curator"
        : "CC BY — curator attestation before Blob";
    lines.push(
      `| ${listen} | ${row.title} | ${row.artist} | ${row.vocalEvidence?.slice(0, 80) ?? ""} | ${row.licenseSlug} | ${storage} / ${row.syncPermitted} | ${preview === "—" ? "—" : `[audio](${preview})`} | ${row.reviewerDecision} |`,
    );
  }
  lines.push("");
  lines.push("### Rights evidence (by queue id)");
  lines.push("");
  for (const row of queue.candidates ?? []) {
    lines.push(`#### ${row.queueId} — ${row.title}`);
    lines.push(`- **Source:** ${row.rightsEvidenceRef}`);
    lines.push(`- **Attribution:** ${row.attributionStatement ?? "—"}`);
    lines.push(`- **Composition:** ${row.compositionRightsNote ?? "—"}`);
    lines.push(`- **Recording:** ${row.recordingRightsNote ?? "—"}`);
    lines.push(`- **Territory:** ${row.territory ?? "—"}`);
    lines.push("");
  }
  lines.push("## Rejected (policy — NC / ND / SA)");
  lines.push("");
  for (const row of queue.rejected ?? []) {
    lines.push(`- **${row.title}** — ${row.artist}: ${row.reason} ([evidence](${row.rightsEvidenceRef?.startsWith("http") ? row.rightsEvidenceRef : "#"}))`);
  }
  lines.push("");
  lines.push("## Discovery merge stats");
  lines.push("");
  lines.push(`- Added: ${mergeStats.added}`);
  lines.push(`- Updated: ${mergeStats.updated}`);
  lines.push(`- Skipped (already published): ${mergeStats.skippedPublished}`);
  lines.push("");
  lines.push("## Next: rights clearance and import");
  lines.push("");
  lines.push("1. The owner selected all 11 candidates on 2026-11-04; this is not proof of individual listening, a copyright legal opinion, or a fabricated curator attestation.");
  lines.push("2. Curator verifies composition and recording rights, worldwide scope, story synchronization, source evidence and proper attribution. Do not treat public-domain recordings as CC0 dedications without evidence.");
  lines.push("3. Complete genuine rights packets and use an authorized vocal import workflow with real credentials. The existing free-library importer supports its configured packet IDs only.");
  lines.push("4. Publish only after Blob upload, catalog/rights records, compatible playback on iPhone/Samsung and owner acceptance all pass.");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const writeDoc = process.argv.includes("--write-doc") || true;
  const queue = JSON.parse(await readFile(QUEUE_PATH, "utf8"));
  const discoveryRaw = JSON.parse(await readFile(DISCOVERY_PATH, "utf8"));
  const existing = discoveryRaw.candidates ?? [];

  const resolvedPreview = new Map();
  const toMerge = [];
  for (const row of queue.candidates ?? []) {
    if (row.discoveryDedupeKey && !row.recordingUrl) {
      const prior = existing.find((c) => c.dedupeKey === row.discoveryDedupeKey);
      if (prior?.recordingUrl) {
        row.recordingUrl = prior.recordingUrl.split("?")[0];
        row.sourcePageUrl = row.sourcePageUrl ?? prior.sourcePageUrl;
      }
    }
    const result = await queueRowToDiscovery(row);
    if (result.skip) {
      console.warn(`Skip ${row.queueId}: ${result.reason}`);
      continue;
    }
    if (result.candidate.recordingUrl) {
      resolvedPreview.set(row.queueId, { recordingUrl: result.candidate.recordingUrl });
    }
    toMerge.push(result);
  }

  const { candidates, added, updated, skippedPublished } = mergeIntoDiscovery(existing, toMerge);
  const payload = {
    version: discoveryRaw.version ?? "1",
    updatedAt: new Date().toISOString(),
    candidates,
  };
  await writeFile(DISCOVERY_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const mergeStats = { added, updated, skippedPublished };
  console.log(JSON.stringify(mergeStats, null, 2));

  if (writeDoc) {
    queue.updatedAt = new Date().toISOString();
    await writeFile(QUEUE_PATH, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
    await writeFile(DOC_PATH, `${renderDoc(queue, mergeStats, resolvedPreview)}\n`, "utf8");
    console.log(`Wrote ${DOC_PATH}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
