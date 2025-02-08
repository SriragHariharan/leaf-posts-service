import { PostComment } from "./comment.interface";
import { Post, ReportReason } from "./post.interface";

export interface IPostService {
    createNewPost(userID: string, imageBuffer: Buffer|null, content: string): Promise<Post>
    savePost(postID: string, userID: string): Promise<{ id: number; userID: string; createdAt: Date; postID: string; }>
    unsavePost(postID: string, userID: string): Promise<boolean>
    getSavedPostsOfUser(userID: string): Promise<Promise<{ post: Post }[]>>
    toggleLike(postID: string, userID: string): Promise<boolean>
    addComments(postID: string, userID: string, comment: string): Promise<PostComment>
    getComments(postID: string): Promise<PostComment[]>
    reportPost(postID: string, userID: string, reason: ReportReason, description: string): Promise<boolean>
    getInteractionCount(postID: string): Promise<{ likesCount: number; commentsCount: number; } | null>
    getPostDetails(postID: string): Promise<Post>
    searchPosts(query: string): Promise<Post[]>
    fetchTimeline(userID: string, page: number): Promise<Post[]>
    deletePost(postID: string): Promise<boolean>
}