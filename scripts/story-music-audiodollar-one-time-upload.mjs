#!/usr/bin/env node
/**
 * One-time production audio ingest. Fail closed if source bytes cannot
 * be verified/uploaded; remove this build hook once production is READY.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { put } from "@vercel/blob";

const row = JSON.parse(await readFile(new URL("../data/story-music-audiodollar-gospel-qa.json", import.meta.url), "utf8"));
const path = "story-music/audio/free-library/audiodollar-gospel.mp3";
async function main() {
  if (process.env.VERCEL_ENV !== "production") return;
  const token = process.env.STORY_MUSIC_BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error("AudioDollar upload failed closed: Blob token unavailable");
  const url = new URL(row.sourceAudioUrl);
  if (url.protocol !== "https:" || url.hostname !== "files.freemusicarchive.org" ||
    !/^\/storage-freemusicarchive-org\/tracks\/[A-Za-z0-9]+\.mp3$/.test(url.pathname) ||
    url.search || url.hash || row.id !== "audiodollar-gospel" ||
    row.license !== "CC BY 4.0") throw new Error("Unapproved source or license");
  const response = await fetch(url, { redirect:"error", signal:AbortSignal.timeout(90000) });
  if (!response.ok || !(response.headers.get("content-type") || "").toLowerCase().startsWith("audio/")) {
    throw new Error("AudioDollar source audio unavailable");
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const sha = createHash("sha256").update(bytes).digest("hex");
  if (bytes.length !== row.audio.bytes || sha !== row.audio.sha256 ||
    !((bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
      (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))) {
    throw new Error("AudioDollar source integrity mismatch");
  }
  let access = "public";
  try {
    await put(path,bytes,{token,access,contentType:"audio/mpeg",addRandomSuffix:false});
  } catch(error) {
    const message=error instanceof Error?error.message:String(error);
    if (/already exists|pathname is already taken|already uploaded/i.test(message)) {
      console.log("AudioDollar Gospel already in Blob");
      return;
    }
    if (!/cannot use public access on a private store/i.test(message)) throw error;
    access="private";
    await put(path,bytes,{token,access,contentType:"audio/mpeg",addRandomSuffix:false});
  }
  console.log(`AudioDollar Gospel uploaded: bytes=${bytes.length}, sha256=${sha}, access=${access}`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
