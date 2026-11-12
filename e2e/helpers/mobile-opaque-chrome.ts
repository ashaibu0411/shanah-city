import { expect, type Page } from "@playwright/test";

const NAVY_RGB = "rgb(6, 19, 41)";

export async function assertOpaqueMobileChrome(page: Page) {
  const chrome = await page.evaluate((navyRgb) => {
    const header = document.querySelector("header.mobile-app-header");
    const nav = document.querySelector("nav.app-mobile-bottom-nav");
    const headerStyle = header ? getComputedStyle(header) : null;
    const navStyle = nav ? getComputedStyle(nav) : null;
    return {
      headerOpacity: headerStyle?.opacity ?? "",
      navOpacity: navStyle?.opacity ?? "",
      headerBackdrop: headerStyle?.backdropFilter ?? "",
      navBackdrop: navStyle?.backdropFilter ?? "",
      headerBg: headerStyle?.backgroundColor ?? "",
      navBg: navStyle?.backgroundColor ?? "",
      navyRgb,
    };
  }, NAVY_RGB);

  expect(parseFloat(chrome.headerOpacity || "0"), "header opacity").toBe(1);
  expect(parseFloat(chrome.navOpacity || "0"), "bottom nav opacity").toBe(1);
  expect(chrome.headerBackdrop, "header backdrop-filter").toBe("none");
  expect(chrome.navBackdrop, "nav backdrop-filter").toBe("none");
  expect(chrome.headerBg, "header background").toBe(NAVY_RGB);
  expect(chrome.navBg, "nav background").toBe(NAVY_RGB);
}
