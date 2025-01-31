import { Post } from "./post.interface";

export interface IPostService {
    createNewPost(userID: string, imageBuffer: Buffer|null, content: string): Promise<Post>
    savePost(postID: string, userID: string): Promise<{ id: number; userID: string; createdAt: Date; postID: string; }>
    unsavePost(postID: string, userID: string): Promise<boolean>
    getSavedPostsOfUser(userID: string): Promise<Promise<{ post: Post }[]>>
}