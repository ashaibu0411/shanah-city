import { readFileSync } from "fs";
import path from "path";

const BULK_PACKETS_PATH = path.join(process.cwd(), "data", "story-music-bulk-import-packets.json");

export function loadMergedImportCandidates() {
  let bulk = {};
  try {
    bulk = JSON.parse(readFileSync(BULK_PACKETS_PATH, "utf8")).packets ?? {};
  } catch {
    bulk = {};
  }
  return { ...FREE_LIBRARY_IMPORT_CANDIDATES, ...bulk };
}

/**
 * Curator-reviewed rights packets for free-library imports.
 * Bulk expansion packets merge from data/story-music-bulk-import-packets.json at runtime.
 */
export const FREE_LIBRARY_IMPORT_CANDIDATES = {
  "smd-0eb452b6f960bc56576688b2": {
    catalogTrackId: "amazing-grace-usaf-reserve-band",
    title: "Amazing Grace",
    artist: "United States Air Force Reserve Band",
    recordingUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/3f/Amazing_Grace_-_Concert_Band_-_United_States_Air_Force_Reserve_Band.mp3",
    licenseSlug: "public-domain",
    licenseUrl: "https://www.music.af.mil/Multimedia/Music/Public-Domain-Music/",
    attributionStatement: "Performance: United States Air Force Reserve Band (public domain).",
    rightsEvidenceRef:
      "Wikimedia Commons File:Amazing_Grace_-_Concert_Band_-_United_States_Air_Force_Reserve_Band.mp3 (extmetadata LicenseShortName: Public domain); USAF Public Domain Music program https://www.music.af.mil/Multimedia/Music/Public-Domain-Music/",
    recordingRightsNote:
      "United States Air Force Reserve Band performance marked Public domain on Wikimedia Commons and USAF PD music program.",
    compositionRightsNote:
      "Hymn text John Newton; tune New Britain / William Walker — public domain composition.",
    territory: "Worldwide (PD composition; U.S. federal band PD recording — curator confirmed app use)",
    genres: ["hymns", "worship"],
    tags: ["free-library", "hymn", "gospel"],
  },
  "smd-c48ba54c4945205fa63795e8": {
    catalogTrackId: "the-god-of-abraham-praise-usaf-band",
    title: "The God of Abraham Praise",
    artist: "United States Air Force Band",
    recordingUrl:
      "https://upload.wikimedia.org/wikipedia/commons/6/62/The_God_of_Abraham_Praise_-_Concert_Band_-_United_States_Air_Force_Band.mp3",
    licenseSlug: "public-domain",
    licenseUrl: "https://www.music.af.mil/Multimedia/Music/Public-Domain-Music/",
    attributionStatement: "Performance: United States Air Force Band (public domain).",
    rightsEvidenceRef:
      "Wikimedia Commons File:The_God_of_Abraham_Praise_-_Concert_Band_-_United_States_Air_Force_Band.mp3 (extmetadata LicenseShortName: Public domain); hymn tune Leoni (traditional PD).",
    recordingRightsNote:
      "United States Air Force Band concert band recording marked Public domain on Wikimedia Commons.",
    compositionRightsNote:
      "Hymn text Thomas Olivers; tune Leoni (traditional) — public domain composition.",
    territory: "Worldwide (PD composition; U.S. federal band PD recording — curator confirmed app use)",
    genres: ["hymns", "worship"],
    tags: ["free-library", "hymn"],
  },
  "smd-fcf40b8954248b34a7e15f57": {
    catalogTrackId: "gospel-train-us-navy-edwards",
    title: "Gospel Train",
    artist: "MU1 William F. Edwards, III (U.S. Navy)",
    recordingUrl: "https://upload.wikimedia.org/wikipedia/commons/9/92/Gospel_Train.mp3",
    licenseSlug: "public-domain",
    licenseUrl: "",
    attributionStatement: "Performance: MU1 William F. Edwards, III (public domain).",
    rightsEvidenceRef:
      "Wikimedia Commons File:Gospel_Train.mp3 (extmetadata LicenseShortName: Public domain); U.S. Navy recording.",
    recordingRightsNote: "U.S. Navy recording marked Public domain on Wikimedia Commons.",
    compositionRightsNote: "Traditional gospel spiritual — public domain.",
    territory: "Worldwide (PD recording and traditional composition — curator confirmed app use)",
    genres: ["gospel", "worship"],
    tags: ["free-library", "gospel"],
  },
  "smd-3cea848a8270510e20b0100e": {
    catalogTrackId: "lee-wastler-in-your-hands",
    title: "In Your Hands",
    artist: "Lee Wastler",
    recordingUrl:
      "https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/zx8mvMNNno9s9xcTuoCXuZ5cvgocwvhaaYlrKElH.mp3",
    licenseSlug: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    attributionStatement: "In Your Hands by Lee Wastler — CC BY 4.0. Source: Free Music Archive.",
    rightsEvidenceRef:
      "https://freemusicarchive.org/music/lee-wastler/come-to-jesus/in-your-hands/ (Attribution 4.0 International; Instrumental: No). FMA License Guide: CC BY permits sync/derivatives with credit.",
    recordingRightsNote:
      "Recording by Lee Wastler on FMA under CC BY 4.0. Church owner approved vocal batch import; curator env attestation covers worldwide Blob hosting and story background sync with required attribution.",
    compositionRightsNote: "Original composition by Lee Wastler (per FMA); CC BY 4.0 composition use with attribution.",
    territory: "Worldwide (CC BY 4.0 recording and composition — owner-approved import with curator attestation)",
    genres: ["gospel", "worship", "contemporary_christian"],
    tags: ["free-library", "gospel_worship_songs", "verified-vocal"],
  },
  "smd-1bf25ffdf913025b49ab6037": {
    catalogTrackId: "lee-wastler-a-fathers-love",
    title: "A Fathers Love",
    artist: "Lee Wastler",
    recordingUrl:
      "https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/jEODpdJDqlcEp6I04NYYFKLhblUdAIFRCJUVlUIO.mp3",
    licenseSlug: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    attributionStatement: "A Fathers Love by Lee Wastler — CC BY 4.0. Source: Free Music Archive.",
    rightsEvidenceRef:
      "https://freemusicarchive.org/music/lee-wastler/come-to-jesus/a-fathers-love/ (CC BY 4.0; Instrumental: No).",
    recordingRightsNote:
      "FMA CC BY 4.0 recording; owner-approved batch import with curator attestation for hosting and story sync.",
    compositionRightsNote: "Original composition by Lee Wastler (per FMA).",
    territory: "Worldwide (CC BY 4.0 — owner-approved import with curator attestation)",
    genres: ["gospel", "worship", "contemporary_christian"],
    tags: ["free-library", "gospel_worship_songs", "verified-vocal"],
  },
  "smd-a4c53b2b5b53e5d3f57b2be3": {
    catalogTrackId: "lee-wastler-i-wish",
    title: "I Wish",
    artist: "Lee Wastler",
    recordingUrl:
      "https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/NR5cDlXWxcgEylpa2x3A3j3Nylo4RJtcYBQtB1wY.mp3",
    licenseSlug: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    attributionStatement: "I Wish by Lee Wastler — CC BY 4.0. Source: Free Music Archive.",
    rightsEvidenceRef:
      "https://freemusicarchive.org/music/lee-wastler/come-to-jesus/i-wish/ (CC BY 4.0; Instrumental: No).",
    recordingRightsNote:
      "FMA CC BY 4.0 recording; owner-approved batch import with curator attestation for hosting and story sync.",
    compositionRightsNote: "Original composition by Lee Wastler (per FMA).",
    territory: "Worldwide (CC BY 4.0 — owner-approved import with curator attestation)",
    genres: ["gospel", "worship", "contemporary_christian"],
    tags: ["free-library", "gospel_worship_songs", "verified-vocal"],
  },
  "smd-543533520f6e5cda4dac6f43": {
    catalogTrackId: "swing-low-sweet-chariot-fisk-1909",
    title: "Swing Low, Sweet Chariot",
    artist: "Fisk Jubilee Singers",
    recordingUrl:
      "https://upload.wikimedia.org/wikipedia/commons/f/f9/Swing_Low%2C_Sweet_Chariot_-_Fisk_Jubilee_Singers_%281909%29.mp3",
    licenseSlug: "public-domain",
    licenseUrl: "",
    attributionStatement:
      "Swing Low, Sweet Chariot — Fisk Jubilee Singers (1909). Public domain recording; traditional spiritual.",
    rightsEvidenceRef:
      "Commons File:Swing Low, Sweet Chariot - Fisk Jubilee Singers (1909).mp3 (LicenseShortName: Public domain); LoC https://www.loc.gov/item/jukebox-128141/",
    recordingRightsNote:
      "1909 Victor recording; Commons PD US record expired. PD permits worldwide redistribution and sync.",
    compositionRightsNote: "Traditional spiritual (Wallace Willis); public domain composition.",
    territory: "Worldwide (PD US recording and traditional composition — owner-approved import)",
    genres: ["gospel", "hymn"],
    tags: ["free-library", "traditional_gospel", "gospel_worship_songs", "verified-vocal"],
  },
  "smd-16d1b08e5db0cdacb35f2428": {
    catalogTrackId: "golden-slippers-fisk-jubilee-1909",
    title: "Golden Slippers",
    artist: "Fisk University Jubilee Singers",
    recordingUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/05/Golden_Slippers_%281909%2C_Fisk_University_Jubilee_Singers%29.mp3",
    licenseSlug: "public-domain",
    licenseUrl: "",
    attributionStatement: "Golden Slippers — Fisk University Jubilee Singers (1909). Public domain.",
    rightsEvidenceRef:
      "Commons File:Golden Slippers (1909, Fisk University Jubilee Singers).mp3 (LicenseShortName: Public domain).",
    recordingRightsNote: "1909 LoC Jukebox recording; Commons public domain.",
    compositionRightsNote: "Traditional spiritual arrangement; public domain.",
    territory: "Worldwide (PD recording and composition — owner-approved import)",
    genres: ["gospel", "hymn"],
    tags: ["free-library", "traditional_gospel", "verified-vocal"],
  },
  "smd-58a33b4ddd7c70a444997b90": {
    catalogTrackId: "golden-jubilee-quartet-oh-jonah",
    title: "Oh Jonah!",
    artist: "Golden Jubilee Quartet",
    recordingUrl:
      "https://upload.wikimedia.org/wikipedia/commons/6/65/The_Golden_Jubilee_Quartet_-_Oh_Jonah.ogg",
    licenseSlug: "public-domain",
    licenseUrl: "",
    attributionStatement: "Oh Jonah! — Golden Jubilee Quartet (public domain).",
    rightsEvidenceRef: "Commons File:The Golden Jubilee Quartet - Oh Jonah.ogg (LicenseShortName: Public domain).",
    recordingRightsNote: "Commons PD vocal quartet recording; format conversion to MP3 permitted for app compatibility (PD).",
    compositionRightsNote: "Traditional spiritual — public domain.",
    territory: "Worldwide (PD — owner-approved import)",
    genres: ["gospel", "hymn"],
    tags: ["free-library", "traditional_gospel", "verified-vocal"],
  },
  "smd-06d679d532d0c17283a80b55": {
    catalogTrackId: "spiritual-four-quartet-john-the-revelator",
    title: "John the Revelator",
    artist: "The Spiritual Four Quartet",
    recordingUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/2c/The_Spiritual_Four_Quartet_-_John_the_Revelator.ogg",
    licenseSlug: "public-domain",
    licenseUrl: "",
    attributionStatement: "John the Revelator — The Spiritual Four Quartet (public domain).",
    rightsEvidenceRef:
      "Commons File:The Spiritual Four Quartet - John the Revelator.ogg (LicenseShortName: Public domain).",
    recordingRightsNote: "Commons PD vocal recording.",
    compositionRightsNote: "Traditional spiritual — public domain.",
    territory: "Worldwide (PD — owner-approved import)",
    genres: ["gospel", "hymn"],
    tags: ["free-library", "traditional_gospel", "verified-vocal"],
  },
  "smd-1688481f8842a8256a4b58be": {
    catalogTrackId: "cochran-field-singers-my-lord-is-writin",
    title: "My Lord Is Writin'",
    artist: "Cochran Field Singers",
    recordingUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/5b/Cochran_Field_Singers_-_My_Lord_Is_Writin%27.ogg",
    licenseSlug: "public-domain",
    licenseUrl: "",
    attributionStatement: "My Lord Is Writin' — Cochran Field Singers (public domain).",
    rightsEvidenceRef: "Commons File:Cochran Field Singers - My Lord Is Writin'.ogg (LicenseShortName: Public domain).",
    recordingRightsNote: "Commons PD field recording — vocal gospel ensemble.",
    compositionRightsNote: "Traditional spiritual — public domain.",
    territory: "Worldwide (PD — owner-approved import)",
    genres: ["gospel", "hymn"],
    tags: ["free-library", "traditional_gospel", "verified-vocal"],
  },
  "smd-ce3bf86313bfae788cac4058": {
    catalogTrackId: "middle-georgia-singers-death-is-an-awful-thing",
    title: "Death is an Awful Thing",
    artist: "Middle Georgia Singers",
    recordingUrl:
      "https://upload.wikimedia.org/wikipedia/commons/f/f4/Middle_Georgia_Singers_-_Death_is_an_Awful_Thing.ogg",
    licenseSlug: "public-domain",
    licenseUrl: "",
    attributionStatement: "Death is an Awful Thing — Middle Georgia Singers (public domain).",
    rightsEvidenceRef:
      "Commons File:Middle Georgia Singers - Death is an Awful Thing.ogg (LicenseShortName: Public domain).",
    recordingRightsNote: "Commons PD vocal gospel field recording.",
    compositionRightsNote: "Traditional spiritual — public domain.",
    territory: "Worldwide (PD — owner-approved import)",
    genres: ["gospel", "hymn"],
    tags: ["free-library", "traditional_gospel", "verified-vocal"],
  },
  "smd-56f742baea45ec91aa3e3aea": {
    catalogTrackId: "bertha-houston-we-are-americans-praise-the-lord",
    title: "We are Americans, Praise the Lord",
    artist: "Bertha Houston and her congregation",
    recordingUrl:
      "https://upload.wikimedia.org/wikipedia/commons/f/f5/Bertha_Houston_-_We_are_Americans%2C_Praise_the_Lord.ogg",
    licenseSlug: "public-domain",
    licenseUrl: "",
    attributionStatement:
      "We are Americans, Praise the Lord — Bertha Houston and congregation (public domain).",
    rightsEvidenceRef:
      "Commons File:Bertha Houston - We are Americans, Praise the Lord.ogg (LicenseShortName: Public domain).",
    recordingRightsNote: "Commons PD congregational vocal praise recording.",
    compositionRightsNote: "Traditional/praise spiritual — public domain.",
    territory: "Worldwide (PD — owner-approved import)",
    genres: ["gospel", "worship"],
    tags: ["free-library", "traditional_gospel", "gospel_worship_songs", "verified-vocal"],
  },
  "smd-5f5891377992d1b97e4f5620": {
    catalogTrackId: "four-brothers-death-come-a-knockin",
    title: "Death Come a-Knockin'",
    artist: "The Four Brothers",
    recordingUrl:
      "https://upload.wikimedia.org/wikipedia/commons/9/95/The_Four_Brothers_-_Death_Come_a-Knockin%27.ogg",
    licenseSlug: "public-domain",
    licenseUrl: "",
    attributionStatement: "Death Come a-Knockin' — The Four Brothers (public domain).",
    rightsEvidenceRef:
      "Commons File:The Four Brothers - Death Come a-Knockin'.ogg (LicenseShortName: Public domain).",
    recordingRightsNote: "Commons PD quartet vocal spiritual.",
    compositionRightsNote: "Traditional spiritual — public domain.",
    territory: "Worldwide (PD — owner-approved import)",
    genres: ["gospel", "hymn"],
    tags: ["free-library", "traditional_gospel", "verified-vocal"],
  },
};

export const VOCAL_IMPORT_CANDIDATE_IDS = [
  "smd-3cea848a8270510e20b0100e",
  "smd-1bf25ffdf913025b49ab6037",
  "smd-a4c53b2b5b53e5d3f57b2be3",
  "smd-543533520f6e5cda4dac6f43",
  "smd-16d1b08e5db0cdacb35f2428",
  "smd-58a33b4ddd7c70a444997b90",
  "smd-06d679d532d0c17283a80b55",
  "smd-1688481f8842a8256a4b58be",
  "smd-ce3bf86313bfae788cac4058",
  "smd-56f742baea45ec91aa3e3aea",
  "smd-5f5891377992d1b97e4f5620",
];

export const ALL_FREE_LIBRARY_CATALOG_IDS = [
  "amazing-grace-usaf-reserve-band",
  "the-god-of-abraham-praise-usaf-band",
  "gospel-train-us-navy-edwards",
  ...VOCAL_IMPORT_CANDIDATE_IDS.map((id) => FREE_LIBRARY_IMPORT_CANDIDATES[id].catalogTrackId),
];

/** All free-library catalog ids including bulk expansion packets file when present. */
export function listAllFreeLibraryCatalogIdsFromPackets() {
  const merged = loadMergedImportCandidates();
  const ids = new Set(ALL_FREE_LIBRARY_CATALOG_IDS);
  for (const packet of Object.values(merged)) {
    if (packet?.catalogTrackId) ids.add(packet.catalogTrackId);
  }
  return [...ids];
}

export const DEFAULT_IMPORT_CANDIDATE_IDS = [
  "smd-0eb452b6f960bc56576688b2",
  "smd-c48ba54c4945205fa63795e8",
  "smd-fcf40b8954248b34a7e15f57",
];
