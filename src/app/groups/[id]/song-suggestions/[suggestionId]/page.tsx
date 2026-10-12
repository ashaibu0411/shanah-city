import { Suspense } from "react";
import { ChoirSongSuggestionDetailPage } from "@/components/groups/choir/song-suggestions/ChoirSongSuggestionDetailPage";

type SongSuggestionDetailRouteProps = {
  params: Promise<{ id: string; suggestionId: string }>;
};

export default async function GroupSongSuggestionDetailPage({ params }: SongSuggestionDetailRouteProps) {
  const { id, suggestionId } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading suggestion…</div>}>
      <ChoirSongSuggestionDetailPage groupId={id} suggestionId={suggestionId} />
    </Suspense>
  );
}
