export type InteractionEventType =
  | "post.liked"
  | "post.unliked"
  | "post.commented"
  | "post.uncommented";

export interface InteractionEvent {
  eventType: InteractionEventType;
  actorUserId: string;
  targetUserId: string;
  postId: string;
  timestamp: string;
  commentId?: string;
}

export interface ToggleLikeResult {
  isLiked: boolean;
  likesCount: number;
}

export interface AddCommentResult {
  comment: unknown;
  commentsCount: number;
  isCommented: boolean;
}

export interface DeleteCommentResult {
  commentsCount: number;
  isCommented: boolean;
}
