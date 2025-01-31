import { Post } from "./post.interface";

export interface IPostsRepository {
    createNewPost( userID: string, content: string): Promise<Post>
    updateImageURL(postID: string, imageURL: string): Promise<boolean>
    getPostDetails(postID: string): Promise<Post>
}