import type { YouTubePlayerInstance } from "@/lib/youtube-iframe-api";

export type ShanahYouTubeController = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate: (rate: number) => void;
  getPlayerState: () => number;
  destroy: () => void;
};

export function wrapYouTubePlayer(player: YouTubePlayerInstance): ShanahYouTubeController {
  return {
    playVideo: () => player.playVideo(),
    pauseVideo: () => player.pauseVideo(),
    seekTo: (seconds) => player.seekTo(seconds, true),
    getCurrentTime: () => player.getCurrentTime(),
    getDuration: () => player.getDuration(),
    setPlaybackRate: (rate) => player.setPlaybackRate(rate),
    getPlayerState: () => player.getPlayerState(),
    destroy: () => player.destroy(),
  };
}
