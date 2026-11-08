import { test, expect, devices } from "@playwright/test";
import {
  storyMusicClipTimelineDragMove,
  storyMusicClipTimelineDragStart,
} from "../src/lib/story-music/story-music-clip-timeline";

test.use({ ...devices["iPhone 13"] });

test.beforeEach(async ({ page }) => {
  await page.setContent(`<!DOCTYPE html>
<html lang="en">
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<style>
  body { margin: 0; padding: 16px; font-family: system-ui; touch-action: pan-y; }
  .story-music-clip-timeline { touch-action: manipulation; }
  .story-music-clip-timeline-rail {
    position: relative;
    width: 320px;
    height: 52px;
    border-radius: 999px;
    background: #f2ebe3;
    border: 1px solid #d8cfc4;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
  }
  .story-music-clip-timeline-window {
    position: absolute;
    top: 4px;
    bottom: 4px;
    width: 25%;
    left: 0;
    border: 2px solid #b65d3a;
    border-radius: 999px;
    background: rgba(182, 93, 58, 0.18);
    touch-action: none;
    -webkit-touch-callout: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
  }
</style>
</head>
<body>
  <div class="story-music-clip-timeline">
    <p id="start" aria-live="polite">0</p>
    <div id="rail" class="story-music-clip-timeline-rail">
      <div id="window" class="story-music-clip-timeline-window">30s</div>
    </div>
  </div>
  <script>
    const rail = document.getElementById("rail");
    const windowEl = document.getElementById("window");
    const startEl = document.getElementById("start");
    let grabOffset = 0;
    let startSec = 0;
    const trackDuration = 120;
    const clipDuration = 30;

    function positionWindow() {
      const maxStart = Math.max(0, trackDuration - clipDuration);
      const ratio = maxStart > 0 ? startSec / maxStart : 0;
      const maxLeftPct = 100 - 25;
      windowEl.style.left = (ratio * maxLeftPct) + "%";
      startEl.textContent = String(startSec);
    }

    let disposeDocDrag = null;
    const endDrag = () => {
      if (disposeDocDrag) {
        disposeDocDrag();
        disposeDocDrag = null;
      }
    };

    windowEl.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      void (async () => {
      const rect = rail.getBoundingClientRect();
      grabOffset = await window.__grab(e.clientX, rect.left, rect.width, startSec);
      try { windowEl.setPointerCapture(e.pointerId); } catch (_) {}
      const pointerId = e.pointerId;
      const onMove = (ev) => {
        if (ev.pointerId !== pointerId) return;
        ev.preventDefault();
        void (async () => {
        const r = rail.getBoundingClientRect();
        startSec = await window.__drag(ev.clientX, r.left, r.width, grabOffset);
        positionWindow();
        })();
      };
      const onUp = (ev) => {
        if (ev.pointerId !== pointerId) return;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        endDrag();
        try {
          if (windowEl.hasPointerCapture(pointerId)) windowEl.releasePointerCapture(pointerId);
        } catch (_) {}
      };
      document.addEventListener("pointermove", onMove, { passive: false });
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
      disposeDocDrag = endDrag;
      })();
    });
    positionWindow();
  </script>
</body>
</html>`);

  await page.exposeFunction("__grab", (clientX: number, trackLeft: number, trackWidth: number, startAt: number) =>
    storyMusicClipTimelineDragStart(clientX, trackLeft, trackWidth, startAt, 120, 30),
  );
  await page.exposeFunction(
    "__drag",
    (clientX: number, trackLeft: number, trackWidth: number, grab: number) =>
      storyMusicClipTimelineDragMove(clientX, trackLeft, trackWidth, grab, 120, 30),
  );
});

test("iOS WebKit touch drag moves clip start without blocking on metadata", async ({ page }) => {
  await expect(page.locator("#start")).toHaveText("0");
  const handle = page.locator("#window");
  const rail = page.locator("#rail");
  const railBox = await rail.boundingBox();
  assertBox(railBox);

  const handleBox = await handle.boundingBox();
  assertBox(handleBox);
  const startX = handleBox!.x + handleBox!.width / 2;
  const startY = handleBox!.y + handleBox!.height / 2;
  const endX = railBox!.x + railBox!.width - 30;
  const endY = railBox!.y + railBox!.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 12 });
  await page.mouse.up();

  await page.waitForFunction(() => {
    const text = document.getElementById("start")?.textContent ?? "0";
    return Number(text) > 0;
  });

  const startText = await page.locator("#start").textContent();
  const startSec = Number(startText ?? "0");
  expect(startSec).toBeGreaterThan(0);
});

function assertBox(box: { x: number; y: number; width: number; height: number } | null): asserts box is {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (!box) throw new Error("missing bounding box");
}
