import type { Metadata } from "next";
import { AboutPageView } from "@/components/about/AboutPageView";

export const metadata: Metadata = {
  title: "About Shanah City | Our Story, Our Faith, Our Purpose",
  description: "Discover Shanah City's story since October 1, 2017, our mission to change lives to higher levels in God, our core values, foundational beliefs, and vision for serving our community.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutPageView />;
}
