import { Suspense } from "react";
import { ChoirSongSuggestionReviewPage } from "@/components/groups/choir/song-suggestions/ChoirSongSuggestionReviewPage";

type SongSuggestionReviewRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupSongSuggestionReviewRoute({ params }: SongSuggestionReviewRouteProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading review queue…</div>}>
      <ChoirSongSuggestionReviewPage groupId={id} />
    </Suspense>
  );
}
