import type { Metadata } from "next";
import { AboutPageView } from "@/components/about/AboutPageView";

/**
 * The custom church domain rewrites /about to /church-site/about.
 * Reuse the exact canonical content shown on the app's /about route.
 */
export const metadata: Metadata = {
  title: "About Shanah City | Our Story, Our Faith, Our Purpose",
  description: "Shanah City's founding story, Christ-centered mission, ten core values, eight foundational beliefs, and developing community initiatives.",
  alternates: { canonical: "https://shanahcity.org/about" },
};

export default function AboutWebsite() {
  return <AboutPageView />;
}
