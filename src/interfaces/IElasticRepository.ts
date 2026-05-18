import { Post } from "./post.interface"

export interface IElasticRepository {
    createNewPost(postID: string, userID: string, content: string, imageURL: string|null, createdAt: Date): Promise<any>
    updatePost(postID: string, userID: string, content: string, imageURL: string | null): Promise<void>
    searchPostsContent(query: string): Promise<Post[]>
    deletePost(postID: string): Promise<boolean>
}