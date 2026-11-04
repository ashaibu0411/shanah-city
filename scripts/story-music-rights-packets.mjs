/**
 * Curator-reviewed rights packets for first free-library imports.
 * Each entry maps discovery candidate id → fields required by story-music-ingest-approved.mjs.
 * reviewStatus is NOT set here; import script applies approval only when curator env attestation is present.
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
};

export const DEFAULT_IMPORT_CANDIDATE_IDS = [
  "smd-0eb452b6f960bc56576688b2",
  "smd-c48ba54c4945205fa63795e8",
  "smd-fcf40b8954248b34a7e15f57",
];
