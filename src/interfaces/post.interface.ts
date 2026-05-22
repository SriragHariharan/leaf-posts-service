export interface Post {
  id?: string;

  userID?: string;

  imageURL?: string | null;

  content?: string;

  createdAt?: Date;

  updatedAt?: Date;

  likesCount?: number;

  commentsCount?: number;

  status?: "active" | "blocked" | "deleted";

  isReported?: boolean;

  groupID?: string | null;

  user: { userID: string; username: string };
}

export interface PostReport {
  id: number;

  postID: string;

  userID: string;

  reason: ReportReason;

  description: string;

  createdAt: Date;

  status: ReportStatus;
}

export type ReportReason =
  | "adult_content"
  | "irrelevant_content"
  | "spam"
  | "other";

type ReportStatus = "pending" | "resolved" | "rejected" | "reviewed";
