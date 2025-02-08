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

    /* delete a created post */
    async deletePost(postID: string): Promise<boolean> {
        try {
            await prisma.post.delete({
                where: { id: postID },
            });
            return true;
        } catch (error) {
            console.error("Error deleting post:", error);
            throw createHttpError(500, "Unable to delete post.");
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
            if (error instanceof createHttpError.HttpError) {
                throw error;
            }
            throw createHttpError(500, "Unable to save post");
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
    async toggleLike(postID: string, userID: string): Promise<boolean> {
        try {
            return await prisma.$transaction(async (tx) => {
                const existingLike = await tx.postLike.findFirst({
                    where: { postID, userID },
                });

                if (existingLike) {
                    await tx.postLike.delete({
                        where: { id: existingLike.id },
                    });

                    await tx.post.update({
                        where: { id: postID },
                        data: { likesCount: { decrement: 1 } },
                    });

                    return false;
                } else {
                    await tx.postLike.create({
                        data: { postID, userID },
                    });

                    await tx.post.update({
                        where: { id: postID },
                        data: { likesCount: { increment: 1 } },
                    });

                    return true;
                }
            });
        } catch (error) {
            throw createHttpError(500, "Something went wrong");
        }
    }

    /* comment on a post */
    async addComments(postID: string, userID: string, comment: string): Promise<PostComment> {
        try {
            return await prisma.$transaction(async (tx) => {
                const newComment = await tx.postComment.create({
                    data: {
                        postID,
                        userID,
                        comment,
                        status: "active",
                    },
                });

                await tx.post.update({
                    where: { id: postID },
                    data: { commentsCount: { increment: 1 } },
                });

                return newComment;
            });
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
            console.log(error)
            throw createHttpError(500, "Unable to report post");
        }
    };

    async getInteractionCount(postID: string): Promise<{ likesCount: number; commentsCount: number; } | null> {
        try {
            const interactions = await prisma.post.findUnique({
                where: { id: postID },
                select: {
                    likesCount: true,
                    commentsCount: true,
                },
            });
            return interactions;
        } catch (error) {
            throw createHttpError(500, "Unable to fetch interaction count");
            
        }
    }

    /* get user timeline(ie all the posts he has posted) */
    async fetchTimeline(userID: string, page: number): Promise<Post[]> {
        try {
            const posts = await prisma.post.findMany({
                where: { userID },
                include: {
                    user: true,
                    likes: true,
                    comments: true,
                    saves: true,
                    reports: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 3, // posts per fetch, three given below also mentions the same
                skip: (page - 1) * 3
            });
            return posts;
        }catch(error) {
            throw createHttpError(500, "Unable to fetch timeline");
        }
    }
}

export default PostsRepository;