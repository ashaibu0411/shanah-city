import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { DM_Sans, Fraunces } from "next/font/google";
import { AppShell } from "@/components/app/AppShell";
import { brandLogos, site } from "@/lib/site";
import "./globals.css";

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
        <link rel="preload" as="image" href={brandLogos.light} />
      </head>
      <body className={`${sans.variable} ${display.variable} ${homeHero.variable} font-sans`}>
        <div id="native-boot-splash" className="native-boot-splash" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brandLogos.light}
            alt=""
            width={280}
            height={112}
            decoding="sync"
            fetchPriority="high"
          />
        </div>
        <Script id="native-boot-detect" strategy="beforeInteractive">
          {`(function(){try{var c=window.Capacitor;var n=c&&(c.isNativePlatform?c.isNativePlatform():c.isNative);if(n){document.documentElement.classList.add("native-app-boot");return;}var el=document.getElementById("native-boot-splash");if(el)el.remove();}catch(e){}})();`}
        </Script>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
