import { Post } from "./post.interface"

export interface IElasticRepository {
    createNewPost(postID: string, userID: string, content: string, imageURL: string|null, createdAt: Date): Promise<any>
    searchPostsContent(query: string): Promise<Post[]>
}