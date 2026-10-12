import { Suspense } from "react";
import { ChoirSongSuggestionsPage } from "@/components/groups/choir/song-suggestions/ChoirSongSuggestionsPage";

type SongSuggestionsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupSongSuggestionsPage({ params }: SongSuggestionsPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading song suggestions…</div>}>
      <ChoirSongSuggestionsPage groupId={id} />
    </Suspense>
  );
}
