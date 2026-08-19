import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Playfair_Display } from "next/font/google";
import { AppShell } from "@/components/app/AppShell";
import { site } from "@/lib/site";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

const homeHero = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} ${homeHero.variable} font-sans`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
