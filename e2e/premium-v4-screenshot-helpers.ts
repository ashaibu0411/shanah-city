import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export const IGNORABLE_CONSOLE =
  /favicon|third-party|chrome-extension|Failed to load resource.*(401|403|404|500|503)|youtube|facebook|google-analytics/i;

export function attachErrorCollectors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORABLE_CONSOLE.test(text)) return;
    consoleErrors.push(text);
  });
  return { pageErrors, consoleErrors };
}

export async function assertNoRuntimeErrors(
  page: Page,
  pageErrors: string[],
  consoleErrors: string[],
) {
  await expect(page.locator("#devtools-indicator")).toHaveCount(0);
  await expect(page.getByText("1 Issue", { exact: true })).toHaveCount(0);
  expect(
    [...pageErrors, ...consoleErrors],
    [...pageErrors, ...consoleErrors].join("\n"),
  ).toEqual([]);
}

export async function assertNoHorizontalOverflow(page: Page) {
  await page.waitForFunction(() => {
    const doc = document.documentElement;
    return doc.scrollWidth <= doc.clientWidth + 1;
  });
}

export async function waitForImages(
  page: Page,
  rootSelector: string,
  minCount = 2,
) {
  await page.waitForFunction(
    ({ root, min }) => {
      const rootEl = document.querySelector(root);
      if (!rootEl) return false;
      const imgs = Array.from(rootEl.querySelectorAll("img")) as HTMLImageElement[];
      if (imgs.length === 0) return min === 0;
      if (imgs.length < min) return false;
      if (min === 0) {
        return imgs.every((img) => img.complete);
      }
      return imgs.every((img) => img.complete && img.naturalWidth > 0);
    },
    { root: rootSelector, min: minCount },
    { timeout: 60_000 },
  );
}
