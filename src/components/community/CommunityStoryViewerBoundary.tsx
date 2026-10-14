"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type CommunityStoryViewerBoundaryProps = {
  children: ReactNode;
  onClose: () => void;
};

type State = { crashed: boolean };

export class CommunityStoryViewerBoundary extends Component<
  CommunityStoryViewerBoundaryProps,
  State
> {
  state: State = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Story viewer crashed", error, info.componentStack);
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="community-story-viewer" role="alert">
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm text-white/90">
              This moment could not open on your device. Your story may still be shared — close and
              tap your story ring again, or try a shorter MP4/M4A clip.
            </p>
            <button
              type="button"
              className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white"
              onClick={() => {
                this.setState({ crashed: false });
                this.props.onClose();
              }}
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
