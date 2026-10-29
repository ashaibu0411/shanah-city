/**
 * Generates original (church-owned) QA tones for story-music hybrid POC.
 * Not commercial recordings — simple synthesized clips for playback testing.
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "test-fixtures", "story-music-poc");

const CLIPS = [
  { file: "ghana-worship-poc.wav", hz: 392 },
  { file: "nigeria-gospel-poc.wav", hz: 440 },
  { file: "south-africa-gospel-poc.wav", hz: 466 },
  { file: "kenya-worship-poc.wav", hz: 523 },
  { file: "caribbean-gospel-poc.wav", hz: 587 },
  { file: "us-gospel-poc.wav", hz: 659 },
  { file: "latin-worship-poc.wav", hz: 698 },
  { file: "europe-worship-poc.wav", hz: 784 },
  { file: "asia-worship-poc.wav", hz: 880 },
  { file: "shanah-staging-qa-instrumental.wav", hz: 523.25 },
];

const SAMPLE_RATE = 22050;
const DURATION_SEC = 8;

function writeWav(filePath, frequencyHz) {
  const numSamples = SAMPLE_RATE * DURATION_SEC;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i += 1) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.min(1, t / 0.05) * Math.min(1, (DURATION_SEC - t) / 0.8);
    const sample = Math.sin(2 * Math.PI * frequencyHz * t) * 0.22 * envelope;
    const int16 = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(int16, 44 + i * 2);
  }

  return writeFile(filePath, buffer);
}

await mkdir(OUT_DIR, { recursive: true });
for (const clip of CLIPS) {
  await writeWav(path.join(OUT_DIR, clip.file), clip.hz);
}
console.log(`Wrote ${CLIPS.length} POC wav files to ${OUT_DIR}`);
