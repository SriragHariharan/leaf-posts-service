import { PostComment } from "./comment.interface";
import { Post } from "./post.interface";

export interface IPostsRepository {
    createNewPost( userID: string, content: string): Promise<Post>
    updateImageURL(postID: string, imageURL: string): Promise<boolean>
    getPostDetails(postID: string): Promise<Post>
    savePost(postID: string, userID: string): Promise<{ id: number; userID: string; createdAt: Date; postID: string; }>
    unsavePost(postID: string, userID: string): Promise<boolean>
    getSavedPostsByUser (userID: string): Promise<Promise<{ post: Post }[]>>
    toggleLike(postID: string, userID: string):Promise<boolean>
    addComments(postID: string, userID: string, comment: string): Promise<PostComment>
    getComments(postID: string): Promise<PostComment[]>
}