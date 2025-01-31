import { Post } from "./post.interface";

export interface IPostService {
    createNewPost(userID: string, imageBuffer: Buffer|null, content: string): Promise<Post>
}