#!/usr/bin/env node
/* Isolated CI baseline: observe the full Next.js process tree while the
 * normal worker-enabled Next build runs. No production migrations.
 * Sum of RSS includes shared pages; use as a comparative estimate, not PSS.
 */
const { spawn, execFileSync } = require("node:child_process");
const nextCli = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextCli, "build"], {
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: "inherit",
});
let peakTotalKb = 0;
let peakChildren = 0;
let samples = 0;
function sample() {
  try {
    const ps = execFileSync("ps", ["-e", "-o", "pid=,ppid=,rss="], { encoding: "utf8" });
    const all = ps.split("\n").map(line => line.trim().split(/\s+/).map(Number)).filter(a => a.length === 3 && a.every(Number.isFinite));
    const descendants = new Set([child.pid]);
    for (let i = 0; i < 10; i++) {
      let added = 0;
      for (const [pid, ppid] of all) if (descendants.has(ppid) && !descendants.has(pid)) { descendants.add(pid); added++; }
      if (!added) break;
    }
    const rss = all.filter(([pid]) => descendants.has(pid)).reduce((total, [, , kb]) => total + kb, 0);
    peakTotalKb = Math.max(peakTotalKb, rss);
    peakChildren = Math.max(peakChildren, descendants.size);
    samples++;
    if (samples % 4 === 0) console.log("[build-memory-baseline] sampled process-tree RSS: " + Math.round(rss/1024) + " MiB");
  } catch (e) {
    console.error("[build-memory-baseline] Could not sample:", e.message);
  }
}
const timer = setInterval(sample, 3000);
sample();
child.on("error", err => console.error("[build-memory-baseline] Spawn error", err.message));
child.on("close", (code, signal) => {
  clearInterval(timer);
  console.log("[build-memory-baseline] PEAK aggregate process-tree RSS: " + Math.round(peakTotalKb/1024) + " MiB; maximum processes: " + peakChildren + "; samples: " + samples);
  console.log("[build-memory-baseline] Note: RSS includes shared pages, and sampling can miss short spikes.");
  process.exit(code ?? (signal ? 1 : 0));
});
