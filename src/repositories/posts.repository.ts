import createHttpError from "http-errors";
import prisma from "../helpers/prisma";
import { IPostsRepository } from "../interfaces/IPostsRepository";
import { Post } from "../interfaces/post.interface";

class PostsRepository implements IPostsRepository {

    /* save posts to mysql */
    async createNewPost( userID: string, content: string): Promise<Post> {
        try {
            const newPost = await prisma.post.create({
                data: {
                    userID,
                    content,
                },
            });
            return newPost;
        } catch (error) {
            throw createHttpError(500, "Unable to create post");
        }
    }

    /* update post's image URL to mysql */
    async updateImageURL(postID: string, imageURL: string): Promise<boolean> {
        try {
            await prisma.post.update({
                where: {
                    id: postID,
                },
                data: {
                    imageURL: imageURL,
                },
            });
            return true;
        } catch (error) {
            throw createHttpError(500, "Unable to update image URL");
        }
    }

    /*get post details*/
    async getPostDetails(postID: string): Promise<Post> {
        try {
            const post = await prisma.post.findUnique({
                where: {
                    id: postID,
                },
                select: {
                    id: true,
                    imageURL: true,
                    content: true,
                    createdAt: true,
                    likesCount: true,
                    commentsCount: true,
                    user: {
                        select: {
                            userID: true,
                            username: true,
                            profilepic: true,
                        },
                    },
                },
            });

            if (!post) {
                throw createHttpError(404, "Post not found");
            }

            return post;
        } catch (error) {
            console.error("Error fetching post details:", error);
            throw createHttpError(500, "Unable to fetch post details");
        }
    }
}

export default PostsRepository;