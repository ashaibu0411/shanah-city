import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { AppShell } from "@/components/app/AppShell";
import { brandLogos, site } from "@/lib/site";
import "./globals.css";

const bootLogoSrc = `${brandLogos.light}?boot=2`;

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const homeHero = Fraunces({
  subsets: ["latin"],
  variable: "--font-home-hero",
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} App`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#faf7f2",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href={bootLogoSrc} />
        <style
          dangerouslySetInnerHTML={{
            __html: `#native-boot-splash{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:#faf7f2;pointer-events:none}html.native-app-boot #native-boot-splash{display:flex}html.native-app-boot #native-boot-splash img{display:block;width:min(58vw,280px);height:auto}`,
          }}
        />
      </head>
      <body className={`${sans.variable} ${display.variable} ${homeHero.variable} font-sans`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function m(){document.documentElement.classList.add("native-app-boot")}function n(){try{var c=window.Capacitor;return!!(c&&(c.isNativePlatform?c.isNativePlatform():c.isNative))}catch(e){return!1}}if(n())m();else document.addEventListener("DOMContentLoaded",function(){if(n())m()})})();`,
          }}
        />
        <div id="native-boot-splash" className="native-boot-splash" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bootLogoSrc}
            alt=""
            width={280}
            height={112}
            decoding="sync"
            fetchPriority="high"
          />
        </div>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
