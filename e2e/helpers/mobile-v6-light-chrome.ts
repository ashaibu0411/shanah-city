import { expect, type Page } from "@playwright/test";

const LIGHT_RGB = "rgb(255, 255, 255)";

export async function assertCommunityV6LightChrome(page: Page) {
  await expect(page.locator("body")).toHaveClass(/community-v6-light-shell/);
  const chrome = await page.evaluate(() => {
    const header = document.querySelector("header.mobile-app-header");
    const nav = document.querySelector("nav.app-mobile-bottom-nav");
    const headerStyle = header ? getComputedStyle(header) : null;
    const navStyle = nav ? getComputedStyle(nav) : null;
    return {
      headerBackdrop: headerStyle?.backdropFilter ?? "",
      navBackdrop: navStyle?.backdropFilter ?? "",
      headerBg: headerStyle?.backgroundColor ?? "",
      navBg: navStyle?.backgroundColor ?? "",
    };
  });

  expect(chrome.headerBackdrop, "header backdrop-filter").toBe("none");
  expect(chrome.navBackdrop, "nav backdrop-filter").toBe("none");
  expect(chrome.headerBg, "header background").toBe(LIGHT_RGB);
  expect(chrome.navBg, "nav background").toBe(LIGHT_RGB);
}
