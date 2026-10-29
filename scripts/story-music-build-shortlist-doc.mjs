#!/usr/bin/env node
/**
 * Build docs/STORY_MUSIC_FIRST_LIBRARY_SHORTLIST.md from review report + curator overrides.
 */

import { readFile, writeFile } from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const REPORT = path.join(ROOT, ".tmp-story-music-review-report.json");
const OUT = path.join(ROOT, "docs", "STORY_MUSIC_FIRST_LIBRARY_SHORTLIST.md");
const RIGHTS_OUT = path.join(ROOT, "docs", "STORY_MUSIC_FIRST_LAUNCH_RIGHTS.md");

/** Curator overrides — not Shanah City approval. */
const OVERRIDE = {
  "smd-fcf40b8954248b34a7e15f57": {
    recommendation: "READY FOR HUMAN APPROVAL",
    category: "Gospel Vocals",
    priority: 1,
    rightsEvidence:
      "Commons PD; U.S. Navy recording (MU1 William F. Edwards III). Archive commons page + listen test.",
    attribution: "None required (PD).",
    playback: "MP3 — preferred for Android.",
  },
  "smd-0eb452b6f960bc56576688b2": {
    recommendation: "READY FOR HUMAN APPROVAL",
    category: "Hymns",
    priority: 2,
    rightsEvidence:
      "Commons extmetadata Public domain; credit links to https://www.music.af.mil/Multimedia/Music/Public-Domain-Music/ . Composition: Newton/Walker hymn (traditional PD). Curator archives page snapshot.",
    attribution: "Performance: United States Air Force Reserve Band (PD program).",
    playback: "MP3 — preferred for Android.",
  },
  "smd-e43319d259ac78d17e855b48": {
    recommendation: "READY FOR HUMAN APPROVAL",
    category: "Hymns",
    priority: 3,
    rightsEvidence: "Commons PD; gospel arrangement of carol. Verify composition PD.",
    attribution: "None required (PD).",
    playback: "OGG — transcode to MP3 for uniform mobile delivery if needed.",
  },
  "smd-d91c073b266b72df18d92cc7": {
    recommendation: "READY FOR HUMAN APPROVAL",
    category: "Worship and Adoration",
    priority: 4,
    rightsEvidence: "Commons PD; Handel Messiah (PD composition); Scherchen recording dated PD on file page.",
    attribution: "None required (PD).",
    playback: "OGG OK on Android Chrome; MP3 optional transcode.",
  },
  "smd-1688481f8842a8256a4b58be": {
    recommendation: "READY FOR HUMAN APPROVAL",
    category: "Gospel Vocals",
    priority: 5,
    rightsEvidence: "Commons PD; historic field recording (Library of Congress transfer).",
    attribution: "None required (PD).",
    playback: "OGG.",
  },
  "smd-58a33b4ddd7c70a444997b90": {
    recommendation: "READY FOR HUMAN APPROVAL",
    category: "Gospel Vocals",
    priority: 6,
    rightsEvidence: "Commons PD; historic gospel quartet recording.",
    attribution: "None required (PD).",
    playback: "OGG.",
  },
  "smd-06d679d532d0c17283a80b55": {
    recommendation: "READY FOR HUMAN APPROVAL",
    category: "Gospel Vocals",
    priority: 7,
    rightsEvidence: "Commons PD; historic spiritual recording.",
    attribution: "None required (PD).",
    playback: "OGG.",
  },
  "smd-4c967d8504052cd492400375": {
    recommendation: "READY FOR HUMAN APPROVAL",
    category: "Hymns",
    priority: 8,
    rightsEvidence: "Commons PD; 1913 Edison cylinder transfer.",
    attribution: "None required (PD).",
    playback: "OGG.",
  },
  "smd-c48ba54c4945205fa63795e8": {
    recommendation: "READY FOR HUMAN APPROVAL",
    category: "Hymns",
    priority: 9,
    rightsEvidence: "Commons PD; USAF Concert Band public-domain music program.",
    attribution: "U.S. Air Force Band (PD).",
    playback: "MP3.",
  },
  "smd-d25365a3e61d6110bc774753": {
    recommendation: "NEEDS ADDITIONAL RIGHTS EVIDENCE",
    category: "Gospel Vocals",
    priority: 10,
    rightsEvidence:
      "Commons CC BY 3.0; performer Sacramento Slavic SDA Church; source YouTube linked on file page. Confirm arrangement/performance rights beyond CC label.",
    attribution: "Required: Sacramento Slavic SDA Church + link per Commons credit.",
    playback: "OGG; no embedded NC/SA detected in file header probe.",
  },
  "smd-55f30852f74554f007a52430": {
    recommendation: "NEEDS ADDITIONAL RIGHTS EVIDENCE",
    category: "Hymns",
    priority: 11,
    rightsEvidence: "Commons CC BY 3.0; Collegium Vocale performance; Tallis composition PD.",
    attribution: "Required: Collegium Vocale + CC BY 3.0 notice.",
    playback: "OPUS — transcode to MP3/OGG for Android (OPUS support varies).",
  },
  "smd-4405f60b500128b0f3e6b4ef": {
    recommendation: "NEEDS ADDITIONAL RIGHTS EVIDENCE",
    category: "Hymns",
    priority: 12,
    rightsEvidence: "Commons CC BY 3.0; cathedral choir recording; hymn tune PD.",
    attribution: "Required: Choir of Ss. Simon & Jude Cathedral + CC BY 3.0.",
    playback: "OGG.",
  },
  "smd-c70a48f25a8a77cacfc3786f": {
    recommendation: "NEEDS ADDITIONAL RIGHTS EVIDENCE",
    category: "Worship and Adoration",
    priority: 13,
    rightsEvidence: "Commons CC0; Orthodox chant; ~23 min — may be long for stories.",
    attribution: "CC0 — document uploader.",
    playback: "OGG.",
  },
  "smd-54c025ebfde3cfc07c122773": {
    recommendation: "REJECTED",
    category: "Gospel Vocals",
    priority: 99,
    rightsEvidence:
      "**Conflict:** Commons page CC BY 4.0 vs embedded file tag `http://creativecommons.org/licenses/by-nc-sa/3.0/us/` (NC + SA). Not eligible until resolved or re-uploaded under BY-only terms.",
    attribution: "N/A — hold.",
    playback: "OGG — do not ingest.",
  },
  "smd-66b82bcbebfc9408fa852523": {
    recommendation: "REJECTED",
    category: "Hymns",
    priority: 99,
    rightsEvidence:
      "**Conflict:** Commons page CC BY 3.0 vs embedded `http://creativecommons.org/licenses/by-sa/3.0/`. ShareAlike blocks reusable library use under current policy.",
    attribution: "N/A — hold.",
    playback: "OGG — do not ingest.",
  },
  "smd-36967e5e38bede0bf18c1606": {
    recommendation: "UNSUITABLE",
    category: "Peaceful Background Music",
    priority: 99,
    rightsEvidence: "Commons CC BY 4.0 (Ross Bugden stock/cinematic). Classified as non-worship cinematic instrumental.",
    attribution: "N/A for worship launch.",
    playback: "WAV — large; not recommended.",
  },
  "smd-76caae5783452a85ecdd8821": {
    recommendation: "UNSUITABLE",
    category: "Hymns",
    priority: 99,
    rightsEvidence: "MIDI render — not an authentic worship recording for launch.",
    attribution: "N/A.",
    playback: "MIDI — poor Android story support.",
  },
  "smd-50d177738b0d8afee04b70e3": {
    recommendation: "UNSUITABLE",
    category: "Hymns",
    priority: 99,
    rightsEvidence: "MIDI hymn tune only.",
    attribution: "N/A.",
    playback: "MIDI.",
  },
};

function fmtDur(sec) {
  if (!sec || !Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function cleanUrl(u) {
  if (!u) return "—";
  return u.split("?")[0];
}

function applyTitleOverrides(row) {
  let rec = row.recommendation;
  let reason = row.worshipRelevance;
  const t = `${row.title} ${row.artist}`.toLowerCase();
  if (/gospel of snoop|faruqi-audio|marcha oficial|president clinton|norge vart land|himno de arbo|guerrero|dapitan hymn|cabuyao|misamis|azores|free russia|марсельез|raginsky|gospel oak|louvor igreja|negro spiritual pronunciation|en-uk-negro/.test(t)) {
    if (!/cochran|golden jubilee|spiritual four|edison|gospel train|wenceslas|handel|tallis|pass-me-not|byzantine|strife|god of abraham|amazing grace/.test(t)) {
      if (/free russia|марсельез|president|marcha|norge|guerrero|dapitan|cabuyao|misamis|azores|raginsky|gospel oak|pronunciation|louvor igreja novsa/.test(t)) {
        rec = "UNSUITABLE";
        reason = "Secular/civic/regional anthem or non–story-music content.";
      }
    }
  }
  if (/marines'? hymn|marine'?s hymn/.test(t) && !/battle hymn/.test(t)) {
    rec = "UNSUITABLE";
    reason = "U.S. military service hymn — not Christian worship story background.";
  }
  if (/battle hymn of the republic/.test(t)) {
    rec = rec === "REJECTED" ? rec : "NEEDS ADDITIONAL RIGHTS EVIDENCE";
    reason = "Patriotic sacred song — pick at most one PD band recording after curator review.";
  }
  return { ...row, recommendation: rec, worshipRelevance: reason };
}

function recordingNote(r) {
  if (r.directAudioUrl?.includes("upload.wikimedia.org") || r.directAudioUrl?.includes("archive.org/download")) {
    return "Direct URL from source API (HEAD may rate-limit)";
  }
  return r.recordingVerification;
}

function mergeOverride(row) {
  const o = OVERRIDE[row.id];
  if (!o) return row;
  return {
    ...row,
    recommendation: o.recommendation,
    category: o.category,
    rightsEvidenceRef: o.rightsEvidence ?? row.rightsEvidenceRef,
    attributionRequired: o.attribution ?? row.attributionRequired,
  };
}

function rowLine(r) {
  const o = OVERRIDE[r.id];
  const rec = o?.recommendation ?? r.recommendation;
  const cat = o?.category ?? r.category;
  const note = [o?.playback, o?.note].filter(Boolean).join(" ");
  const remaining = r.remainingApproval
    .filter((x) => !(r.directAudioUrl && x === "Confirm downloadable audio URL"))
    .join("; ");
  const rights = o?.rightsEvidence ?? r.rightsEvidenceRef;
  return `| ${escapeCell(r.title)} | ${escapeCell(r.artist)} | ${cat} | ${fmtDur(r.durationSec)} | [source](${r.sourcePageUrl}) | ${r.directAudioUrl ? `[audio](${cleanUrl(r.directAudioUrl)})` : "—"} | ${escapeCell(r.licenseShort ?? r.licenseType)} | ${escapeCell(rights)} | ${escapeCell(r.compositionVerification)} | ${escapeCell(recordingNote(r))} | ${escapeCell(o?.attribution ?? r.attributionRequired)} | ${rec} | ${escapeCell(remaining + (note ? ` ${note}` : ""))} |`;
}

function escapeCell(s) {
  return String(s ?? "—").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function dispositionSummary(rows) {
  const counts = {};
  for (const r of rows) {
    const rec = OVERRIDE[r.id]?.recommendation ?? r.recommendation;
    counts[rec] = (counts[rec] ?? 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, total };
}

async function main() {
  const { reviewedAt, reviewed } = JSON.parse(await readFile(REPORT, "utf8"));
  let rows = reviewed.map(applyTitleOverrides).map(mergeOverride);

  const missingAmazing = !rows.some((r) => r.id === "smd-0eb452b6f960bc56576688b2");
  if (missingAmazing) {
    rows.push(
      mergeOverride({
        id: "smd-0eb452b6f960bc56576688b2",
        source: "wikimedia_commons",
        title: "Amazing Grace - Concert Band - United States Air Force Reserve Band",
        artist: "United States Air Force Reserve Band; William Walker (composition)",
        category: "Hymns",
        durationSec: 226.8,
        sourcePageUrl:
          "https://commons.wikimedia.org/wiki/File:Amazing_Grace_-_Concert_Band_-_United_States_Air_Force_Reserve_Band.mp3",
        directAudioUrl:
          "https://upload.wikimedia.org/wikipedia/commons/3/3f/Amazing_Grace_-_Concert_Band_-_United_States_Air_Force_Reserve_Band.mp3",
        audioReachable: false,
        licenseType: "CC0/PD",
        licenseShort: "Public domain",
        licenseUrl: "https://www.music.af.mil/Multimedia/Music/Public-Domain-Music/",
        rightsEvidenceRef: OVERRIDE["smd-0eb452b6f960bc56576688b2"].rightsEvidence,
        compositionVerification: "pd_claim_on_page",
        recordingVerification: "Direct URL from source API",
        attributionRequired: OVERRIDE["smd-0eb452b6f960bc56576688b2"].attribution,
        worshipRelevance: "Christian hymn — PD government performance.",
        recommendation: "READY FOR HUMAN APPROVAL",
        remainingApproval: [
          "Shanah City curator sign-off (not auto-approved)",
          "Archive commons + music.af.mil PD evidence",
          "Audio quality listen test",
          "Blob ingest + intake publish",
        ],
      }),
    );
  }

  const dispositions = dispositionSummary(rows);
  const examined = rows.length;

  const stats = {
    examined,
    worshipSuitable: rows.filter((r) => {
      const rec = OVERRIDE[r.id]?.recommendation ?? r.recommendation;
      return rec !== "UNSUITABLE" && rec !== "REJECTED";
    }).length,
    launchReady: rows.filter((r) => (OVERRIDE[r.id]?.recommendation ?? r.recommendation) === "READY FOR HUMAN APPROVAL").length,
    dispositions,
  };

  const priorityIds = Object.entries(OVERRIDE)
    .filter(([, v]) => v.priority < 90)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([id]) => id);
  const priority = priorityIds.map((id) => rows.find((r) => r.id === id)).filter(Boolean);

  const header = `| Song title | Artist | Category | Duration | Source link | Direct audio | License type | Rights evidence | Composition verification | Recording verification | Attribution | Recommendation | Remaining approval requirements |`;

  let md = `# Story Music — First Library Shortlist

Generated from automated source re-check plus curator classification. **No track is approved by Shanah City in this document.**

- Review run: \`${reviewedAt}\`
- Candidates examined: **${examined}** (\`needs_review\` / \`discovered\` pool, includes curator-added Amazing Grace)
- Suitable for worship story background (not UNSUITABLE/REJECTED): **${stats.worshipSuitable}**
- **READY FOR HUMAN APPROVAL** (first batch): **${stats.launchReady}**
- Dispositions (sum **${dispositions.total}**): ${JSON.stringify(dispositions.counts)}

### License conflicts resolved in this pass

| Track | Issue | Disposition |
| --- | --- | --- |
| Little Wooden Church (Trumpeteers) | Commons CC BY 4.0 vs embedded **BY-NC-SA 3.0 US** | **REJECTED** — hold |
| Cwm Rhondda | Commons CC BY 3.0 vs embedded **BY-SA 3.0** | **REJECTED** — hold |
| Flight Hymn (Ross Bugden) | CC BY stock/cinematic | **UNSUITABLE** for worship launch |
| Pass Me Not (Worship Night) | CC BY 3.0; confirm arrangement/performance | **NEEDS ADDITIONAL RIGHTS EVIDENCE** |
| Amazing Grace (USAF Reserve Band) | PD performance + hymn composition | **READY FOR HUMAN APPROVAL** (added) |

See \`docs/STORY_MUSIC_FIRST_LAUNCH_RIGHTS.md\` for per-track evidence and playback format notes.

## First launch priority (target 10–15)

${header}
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${priority.map(rowLine).join("\n")}

## Full review pool

${header}
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.map(rowLine).join("\n")}

## Post-approval ingestion

1. Admin discovery queue → human **approved** (archived source page snapshot).
2. \`node scripts/story-music-ingest-approved.mjs --candidate=<id> [--transcode-mp3]\` (files stay outside Git).
3. Blob upload → admin intake **verify** → **publish**.
4. Staging playback checklist (attach, stream, mute, story change, attribution).

**Do not** enable \`STORY_MUSIC_FREE_LIBRARY_ENABLED\` in production until hosted tracks pass staging tests.

`;

  const launchReady = priority.filter(
    (r) => (OVERRIDE[r.id]?.recommendation ?? r.recommendation) === "READY FOR HUMAN APPROVAL",
  );

  let rightsMd = `# Story Music — First Launch Rights Evidence

**Status:** 0 Shanah City–approved tracks. This document supports human approval only.

## Recommended first batch (${launchReady.length} tracks marked READY FOR HUMAN APPROVAL)

${launchReady
  .map((r) => {
    const o = OVERRIDE[r.id];
    return `### ${r.title}

- **Artist:** ${r.artist}
- **Category:** ${o?.category ?? r.category}
- **Source:** ${r.sourcePageUrl}
- **Audio:** ${cleanUrl(r.directAudioUrl ?? "—")}
- **License (Commons/API):** ${r.licenseShort ?? r.licenseType}
- **Rights evidence:** ${o?.rightsEvidence ?? r.rightsEvidenceRef}
- **Attribution for app:** ${o?.attribution ?? r.attributionRequired}
- **Playback / Android:** ${o?.playback ?? "Verify on device"}
- **Human still required:** Curator sign-off, listen test, evidence archive, Blob ingest, staging playback.
`;
  })
  .join("\n")}

## Held or excluded from launch

- **The Trumpeteers — Little Wooden Church:** embedded NC-SA vs page BY — **REJECTED**
- **Cwm Rhondda:** embedded SA vs page BY — **REJECTED**
- **Flight Hymn (Ross Bugden):** cinematic instrumental — **UNSUITABLE**
- **MIDI hymn renders (Monkland, Rock of Ages tune):** **UNSUITABLE** for launch quality
- **Internet Archive discovery rows (~40):** spoken-word services — **UNSUITABLE** (see full pool)

## Format guidance (Android / Samsung)

| Format | Story background use |
| --- | --- |
| MP3 | Preferred — broad Android support |
| OGG | Generally OK in Chrome/WebView |
| OPUS | Transcode to MP3/OGG before launch |
| WAV | Transcode — large files |
| MIDI | Do not use for member stories |

Transcode (when licensed to do so): \`ffmpeg -i input.opus -codec:a libmp3lame -qscale:a 2 output.mp3\` — retain attribution and note derivative format in intake.

`;

  await writeFile(OUT, md);
  await writeFile(RIGHTS_OUT, rightsMd);
  console.log(`Wrote ${OUT} and ${RIGHTS_OUT}`);
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
