import { Post } from "./post.interface";
import { SearchUser } from "./user.interface";

export interface IElasticRepository {
  createNewPost(
    postID: string,
    userID: string,
    content: string,
    imageURL: string | null,
    createdAt: Date,
  ): Promise<any>;
  updatePost(
    postID: string,
    userID: string,
    content: string,
    imageURL: string | null,
  ): Promise<void>;
  searchPostsContent(query: string): Promise<Post[]>;
  searchUsersContent(query: string): Promise<SearchUser[]>;
  indexUser(
    userID: string,
    username: string,
    profilepic: string | null,
  ): Promise<void>;
  deletePost(postID: string): Promise<boolean>;
}
