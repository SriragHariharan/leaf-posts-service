import { Post } from "./post.interface";

export interface IPostsRepository {
    createNewPost( userID: string, content: string): Promise<Post>
    updateImageURL(postID: string, imageURL: string): Promise<boolean>
    getPostDetails(postID: string): Promise<Post>
    savePost(postID: string, userID: string): Promise<{ id: number; userID: string; createdAt: Date; postID: string; }>
    unsavePost(postID: string, userID: string): Promise<boolean>
    getSavedPostsByUser (userID: string): Promise<Promise<{ post: Post }[]>>
}