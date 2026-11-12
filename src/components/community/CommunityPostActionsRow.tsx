import type { ReactNode } from "react";
import {
  IgCommentIcon,
  IgHeartIcon,
  IgShareIcon,
} from "@/components/community/CommunityPostIcons";

type CommunityPostActionsRowProps = {
  heartActive: boolean;
  reactionBusy: boolean;
  reactionTotal: number;
  reactionSummaryEmojis: string[];
  commentCount: number;
  onToggleHeart: () => void;
  onOpenReactions: () => void;
  onOpenComments: (focusComposer: boolean) => void;
  onShare?: () => void;
  shareLabel?: string;
  extraEnd?: ReactNode;
  /** When engagement stats render above the action row. */
  hideReactionSummary?: boolean;
};

export function CommunityPostActionsRow({
  heartActive,
  reactionBusy,
  reactionTotal,
  reactionSummaryEmojis,
  commentCount,
  onToggleHeart,
  onOpenReactions,
  onOpenComments,
  onShare,
  shareLabel = "Share",
  extraEnd,
  hideReactionSummary = false,
}: CommunityPostActionsRowProps) {
  return (
    <div className="community-post-actions-row">
      <div className="community-post-actions-row__main">
        <button
          type="button"
          disabled={reactionBusy}
          onClick={onToggleHeart}
          className={`community-post-action-btn ${heartActive ? "community-post-action-btn--active" : ""}`}
          aria-label="Like"
          aria-pressed={heartActive}
        >
          <IgHeartIcon filled={heartActive} />
          <span>Like</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenComments(true)}
          className="community-post-action-btn"
          aria-label="Comment"
        >
          <IgCommentIcon />
          <span>Comment</span>
          {commentCount > 0 ? (
            <span className="community-post-action-count tabular-nums">{commentCount}</span>
          ) : null}
        </button>

        {onShare ? (
          <button
            type="button"
            onClick={onShare}
            className="community-post-action-btn"
            aria-label={shareLabel}
          >
            <IgShareIcon />
            <span>{shareLabel}</span>
          </button>
        ) : null}

        {extraEnd}
      </div>

      {!hideReactionSummary && reactionTotal > 0 ? (
        <button
          type="button"
          onClick={onOpenReactions}
          className="community-post-reactions-summary"
          aria-label={`See who reacted, ${reactionTotal} reactions`}
        >
          {reactionSummaryEmojis.length > 0 ? (
            <span className="community-post-reactions-summary__emojis" aria-hidden>
              {reactionSummaryEmojis.map((emoji, index) => (
                <span key={`${emoji}-${index}`}>{emoji}</span>
              ))}
            </span>
          ) : null}
          <span className="tabular-nums">{reactionTotal.toLocaleString()}</span>
        </button>
      ) : null}
    </div>
  );
}
