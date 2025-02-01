import createHttpError from "http-errors";
import prisma from "../helpers/prisma";
import { IPostsRepository } from "../interfaces/IPostsRepository";
import { Post, ReportReason } from "../interfaces/post.interface";
import { PostComment } from "../interfaces/comment.interface";

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

    /* save a post */
    async savePost(postID: string, userID: string): Promise<{ id: number; userID: string; createdAt: Date; postID: string; }> {
        try {
            const existingSave = await prisma.postSave.findFirst({
                where: {
                    postID,
                    userID,
                },
            });

            if (existingSave) {
                throw createHttpError(400, "Post already saved");
            }

            const savedPost = await prisma.postSave.create({
                data: {
                    postID,
                    userID,
                },
            });

            return savedPost;
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                throw error;
            }
            throw createHttpError(500, "Unable to save post");
        }
    }

    /* unsave a post */
    async unsavePost(postID: string, userID: string): Promise<boolean> {
        try {
            const deleteResult = await prisma.postSave.deleteMany({
                where: {
                    postID,
                    userID,
                },
            });
            if (deleteResult.count === 0) {
                throw createHttpError(404, "Post not found or already unsaved");
            }
            return true;
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                throw error;
            }
            throw createHttpError(500, "Unable to save post");
        }
    }

    /* view all saved posts of a specific user. */
    async getSavedPostsByUser (userID: string): Promise<Promise<{ post: Post }[]>> {
        try {
            const savedPosts = await prisma.postSave.findMany({
                where: {
                    userID,
                },
                include: {
                    post: true,
                    user: true
                },
            });

            return savedPosts;
        } catch (error) {
            throw createHttpError(500, "Unable to retrieve saved posts");
        }
    }

    /* like or unlike a post (single route) */
    async toggleLike(postID: string, userID: string):Promise<boolean> {
        try {
            const existingLike = await prisma.postLike.findFirst({
                where: {
                    postID,
                    userID,
                },
            });
            if (existingLike) {
                await prisma.postLike.delete({
                    where: { id: existingLike.id },
                });
                return false;
            } 
            else {
                await prisma.postLike.create({
                    data: {
                        postID,
                        userID,
                    },
                });
                return true;
            }
        } catch (error) {
            throw createHttpError(500, "Something went wrong");
        }

    }

    /* comment on a post */
    async addComments(postID: string, userID: string, comment: string): Promise<PostComment> {
        try {
            const newComment = await prisma.postComment.create({
                data: {
                    postID,
                    userID,
                    comment,
                    status: "active",
                },
            });
            return newComment;
        } catch (error) {
            throw createHttpError(500, "Unable to comment on post");
        }
    }

    /* get all comments for a post */
    async getComments(postID: string): Promise<PostComment[]> {
            try {
            const comments = await prisma.postComment.findMany({
                where: {
                    postID,
                    status: "active",
                },
                include: {
                    user: true,
                },
            });
            return comments;
        } catch (error) {
            throw createHttpError(500, "Unable to fetch comments");
        }
    }

    /* report a post */
    async reportPost(postID: string, userID: string, reason: ReportReason, description: string): Promise<boolean> {
        try {
            await prisma.postReport.create({
                data: {
                    postID,
                    userID,
                    reason,
                    description,
                    status: "pending",
                },
            });
            return true;
        } catch (error) {
            throw createHttpError(500, "Unable to report post");
        }
    };
}

export default PostsRepository;