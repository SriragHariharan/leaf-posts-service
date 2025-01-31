export interface PostComment { 
    id: number;
    postID: string;
    userID: string;
    createdAt: Date;
    comment: string;
    updatedAt: Date;
}