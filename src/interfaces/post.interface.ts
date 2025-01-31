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
}
