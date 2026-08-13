import { SermonCard } from "@/components/sermons/SermonCard";
import { PageHeader } from "@/components/ui";
import { site } from "@/lib/site";
import Link from "next/link";

export default function SermonsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Messages"
        title="Sermons"
        description="Faith begins, grows, and strengthens through hearing the Word of God."
      />

      <SermonCard />

      <p className="mt-6 text-sm text-night-500">
        All messages at{" "}
        <Link
          href={site.social.youtube}
          target="_blank"
          className="font-semibold text-night-800 hover:underline"
        >
          youtube.com/@ShanahCity
        </Link>
      </p>
    </>
  );
}
