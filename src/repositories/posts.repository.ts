import createHttpError from "http-errors";
import prisma from "../helpers/prisma";
import { IPostsRepository } from "../interfaces/IPostsRepository";
import { Post, ReportReason } from "../interfaces/post.interface";
import { PostComment } from "../interfaces/comment.interface";
import logger from "../helpers/logger";

class PostsRepository implements IPostsRepository {

    /* Save a new post to MySQL */
    async createNewPost(userID: string, content: string): Promise<Post | any> {
        logger.debug(`Entering createNewPost method. Params: userID=${userID}`, { method: "createNewPost", layer: "repository" });
        try {
            logger.info(`Creating new post for userID: ${userID}`, { layer: "repository" });

            const newPost = await prisma.post.create({
                data: {
                    userID,
                    content,
                },
            });

            logger.info(`Successfully created new post. PostID: ${newPost.id}`, { layer: "repository" });
            return newPost;
        } catch (error) {
            logger.error(`Error in createNewPost: Unable to create post for userID: ${userID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to create post");
        } finally {
            logger.debug(`Exiting createNewPost method. Params: userID=${userID}`, { method: "createNewPost", layer: "repository" });
        }
    }

    /* Delete a post by marking it as deleted */
    async deletePost(postID: string): Promise<boolean> {
        logger.debug(`Entering deletePost method. Param: postID=${postID}`, { method: "deletePost", layer: "repository" });
        try {
            logger.info(`Soft deleting post. PostID: ${postID}`, { layer: "repository" });

            await prisma.post.update({
                where: { id: postID },
                data: { isDeleted: true },
            });

            logger.info(`Successfully soft deleted post. PostID: ${postID}`, { layer: "repository" });
            return true;
        } catch (error) {
            logger.error(`Error in deletePost: Unable to delete post. PostID: ${postID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to delete post.");
        } finally {
            logger.debug(`Exiting deletePost method. Param: postID=${postID}`, { method: "deletePost", layer: "repository" });
        }
    }

    /* Update the image URL of a post */
    async updateImageURL(postID: string, imageURL: string): Promise<boolean> {
        logger.debug(`Entering updateImageURL method. Params: postID=${postID}, imageURL=${imageURL}`, { method: "updateImageURL", layer: "repository" });
        try {
            logger.info(`Updating image URL for post. PostID: ${postID}`, { layer: "repository" });

            await prisma.post.update({
                where: {
                    id: postID,
                },
                data: {
                    imageURL: imageURL,
                },
            });

            logger.info(`Successfully updated image URL for post. PostID: ${postID}`, { layer: "repository" });
            return true;
        } catch (error) {
            logger.error(`Error in updateImageURL: Unable to update image URL for post. PostID: ${postID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to update image URL");
        } finally {
            logger.debug(`Exiting updateImageURL method. Params: postID=${postID}, imageURL=${imageURL}`, { method: "updateImageURL", layer: "repository" });
        }
    }

    /* Get details of a specific post */
    async getPostDetails(postID: string): Promise<Post> {
        logger.debug(`Entering getPostDetails method. Param: postID=${postID}`, { method: "getPostDetails", layer: "repository" });
        try {
            logger.info(`Fetching details for post. PostID: ${postID}`, { layer: "repository" });

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
                logger.error(`Post not found. PostID: ${postID}`, { layer: "repository" });
                throw createHttpError(404, "Post not found");
            }

            logger.info(`Successfully fetched details for post. PostID: ${postID}`, { layer: "repository" });
            return post;
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                logger.error(`HttpError in getPostDetails: ${error.message}`, { error, layer: "repository" });
                throw error;
            }
            logger.error(`Error in getPostDetails: Unable to fetch details for post. PostID: ${postID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to save post");
        } finally {
            logger.debug(`Exiting getPostDetails method. Param: postID=${postID}`, { method: "getPostDetails", layer: "repository" });
        }
    }

    /* Save a post for a user */
    async savePost(postID: string, userID: string): Promise<{ id: number; userID: string; createdAt: Date; postID: string; }> {
        logger.debug(`Entering savePost method. Params: postID=${postID}, userID=${userID}`, { method: "savePost", layer: "repository" });
        try {
            logger.info(`Saving post for user. PostID: ${postID}, UserID: ${userID}`, { layer: "repository" });

            const existingSave = await prisma.postSave.findFirst({
                where: {
                    postID,
                    userID,
                },
            });

            if (existingSave) {
                logger.error(`Post already saved. PostID: ${postID}, UserID: ${userID}`, { layer: "repository" });
                throw createHttpError(400, "Post already saved");
            }

            const savedPost = await prisma.postSave.create({
                data: {
                    postID,
                    userID,
                },
            });

            logger.info(`Successfully saved post. PostID: ${postID}, UserID: ${userID}`, { layer: "repository" });
            return savedPost;
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                logger.error(`HttpError in savePost: ${error.message}`, { error, layer: "repository" });
                throw error;
            }
            logger.error(`Error in savePost: Unable to save post. PostID: ${postID}, UserID: ${userID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to save post");
        } finally {
            logger.debug(`Exiting savePost method. Params: postID=${postID}, userID=${userID}`, { method: "savePost", layer: "repository" });
        }
    }

    /* Unsave a post for a user */
    async unsavePost(postID: string, userID: string): Promise<boolean> {
        logger.debug(`Entering unsavePost method. Params: postID=${postID}, userID=${userID}`, { method: "unsavePost", layer: "repository" });
        try {
            logger.info(`Unsaving post for user. PostID: ${postID}, UserID: ${userID}`, { layer: "repository" });

            const deleteResult = await prisma.postSave.deleteMany({
                where: {
                    postID,
                    userID,
                },
            });

            if (deleteResult.count === 0) {
                logger.error(`Post not found or already unsaved. PostID: ${postID}, UserID: ${userID}`, { layer: "repository" });
                throw createHttpError(404, "Post not found or already unsaved");
            }

            logger.info(`Successfully unsaved post. PostID: ${postID}, UserID: ${userID}`, { layer: "repository" });
            return true;
        } catch (error) {
            if (error instanceof createHttpError.HttpError) {
                logger.error(`HttpError in unsavePost: ${error.message}`, { error, layer: "repository" });
                throw error;
            }
            logger.error(`Error in unsavePost: Unable to unsave post. PostID: ${postID}, UserID: ${userID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to save post");
        } finally {
            logger.debug(`Exiting unsavePost method. Params: postID=${postID}, userID=${userID}`, { method: "unsavePost", layer: "repository" });
        }
    }

    /* Get all saved posts for a specific user */
    async getSavedPostsByUser(userID: string): Promise<Promise<{ post: Post | any }[]>> {
        logger.debug(`Entering getSavedPostsByUser method. Param: userID=${userID}`, { method: "getSavedPostsByUser", layer: "repository" });
        try {
            logger.info(`Fetching saved posts for user. UserID: ${userID}`, { layer: "repository" });

            const savedPosts = await prisma.postSave.findMany({
                where: {
                    userID,
                },
                include: {
                    post: true,
                    user: true,
                },
            });

            logger.info(`Successfully fetched saved posts for user. UserID: ${userID}`, { layer: "repository" });
            return savedPosts;
        } catch (error) {
            logger.error(`Error in getSavedPostsByUser: Unable to retrieve saved posts for user. UserID: ${userID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to retrieve saved posts");
        } finally {
            logger.debug(`Exiting getSavedPostsByUser method. Param: userID=${userID}`, { method: "getSavedPostsByUser", layer: "repository" });
        }
    }

    /* Toggle like/unlike for a post */
    async toggleLike(postID: string, userID: string): Promise<boolean> {
        logger.debug(`Entering toggleLike method. Params: postID=${postID}, userID=${userID}`, { method: "toggleLike", layer: "repository" });
        try {
            logger.info(`Toggling like for post. PostID: ${postID}, UserID: ${userID}`, { layer: "repository" });

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

                    logger.info(`Successfully unliked post. PostID: ${postID}, UserID: ${userID}`, { layer: "repository" });
                    return false;
                } else {
                    await tx.postLike.create({
                        data: { postID, userID },
                    });

                    await tx.post.update({
                        where: { id: postID },
                        data: { likesCount: { increment: 1 } },
                    });

                    logger.info(`Successfully liked post. PostID: ${postID}, UserID: ${userID}`, { layer: "repository" });
                    return true;
                }
            });
        } catch (error) {
            logger.error(`Error in toggleLike: Unable to toggle like for post. PostID: ${postID}, UserID: ${userID}`, { error, layer: "repository" });
            throw createHttpError(500, "Something went wrong");
        } finally {
            logger.debug(`Exiting toggleLike method. Params: postID=${postID}, userID=${userID}`, { method: "toggleLike", layer: "repository" });
        }
    }

    /* Add a comment to a post */
    async addComments(postID: string, userID: string, comment: string): Promise<PostComment> {
        logger.debug(`Entering addComments method. Params: postID=${postID}, userID=${userID}`, { method: "addComments", layer: "repository" });
        try {
            logger.info(`Adding comment to post. PostID: ${postID}, UserID: ${userID}`, { layer: "repository" });

            return await prisma.$transaction(async (tx) => {
                const newComment = await tx.postComment.create({
                    data: {
                        postID,
                        userID,
                        comment,
                        status: "active",
                    },
                    include: {
                        user: {
                            select: {
                                userID: true,
                                username: true,
                                profilepic: true,
                            },
                        },
                    },
                });

                await tx.post.update({
                    where: { id: postID },
                    data: { commentsCount: { increment: 1 } },
                });

                logger.info(`Successfully added comment to post. PostID: ${postID}, UserID: ${userID}`, { layer: "repository" });
                return newComment;
            });
        } catch (error) {
            logger.error(`Error in addComments: Unable to comment on post. PostID: ${postID}, UserID: ${userID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to comment on post");
        } finally {
            logger.debug(`Exiting addComments method. Params: postID=${postID}, userID=${userID}`, { method: "addComments", layer: "repository" });
        }
    }

    /* Get all comments for a post */
    async getComments(postID: string): Promise<PostComment[]> {
        logger.debug(`Entering getComments method. Param: postID=${postID}`, { method: "getComments", layer: "repository" });
        try {
            logger.info(`Fetching comments for post. PostID: ${postID}`, { layer: "repository" });

            const comments = await prisma.postComment.findMany({
                where: {
                    postID,
                    status: "active",
                },
                include: {
                    user: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            logger.info(`Successfully fetched comments for post. PostID: ${postID}`, { layer: "repository" });
            return comments;
        } catch (error) {
            logger.error(`Error in getComments: Unable to fetch comments for post. PostID: ${postID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to fetch comments");
        } finally {
            logger.debug(`Exiting getComments method. Param: postID=${postID}`, { method: "getComments", layer: "repository" });
        }
    }

    /* Report a post */
    async reportPost(postID: string, userID: string, reason: ReportReason, description: string): Promise<boolean> {
        logger.debug(`Entering reportPost method. Params: postID=${postID}, userID=${userID}`, { method: "reportPost", layer: "repository" });
        try {
            logger.info(`Reporting post. PostID: ${postID}, UserID: ${userID}`, { layer: "repository" });

            await prisma.postReport.create({
                data: {
                    postID,
                    userID,
                    reason,
                    description,
                    status: "pending",
                },
            });

            logger.info(`Successfully reported post. PostID: ${postID}, UserID: ${userID}`, { layer: "repository" });
            return true;
        } catch (error) {
            logger.error(`Error in reportPost: Unable to report post. PostID: ${postID}, UserID: ${userID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to report post");
        } finally {
            logger.debug(`Exiting reportPost method. Params: postID=${postID}, userID=${userID}`, { method: "reportPost", layer: "repository" });
        }
    }

    /* Get interaction count (likes and comments) for a post */
    async getInteractionCount(postID: string): Promise<{ likesCount: number; commentsCount: number; } | null> {
        logger.debug(`Entering getInteractionCount method. Param: postID=${postID}`, { method: "getInteractionCount", layer: "repository" });
        try {
            logger.info(`Fetching interaction count for post. PostID: ${postID}`, { layer: "repository" });

            const interactions = await prisma.post.findUnique({
                where: { id: postID },
                select: {
                    likesCount: true,
                    commentsCount: true,
                },
            });

            logger.info(`Successfully fetched interaction count for post. PostID: ${postID}`, { layer: "repository" });
            return interactions;
        } catch (error) {
            logger.error(`Error in getInteractionCount: Unable to fetch interaction count for post. PostID: ${postID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to fetch interaction count");
        } finally {
            logger.debug(`Exiting getInteractionCount method. Param: postID=${postID}`, { method: "getInteractionCount", layer: "repository" });
        }
    }

    /* Fetch user timeline (all posts by the user) */
    async fetchTimeline(userID: string, page: number): Promise<Post[]> {
        logger.debug(`Entering fetchTimeline method. Params: userID=${userID}, page=${page}`, { method: "fetchTimeline", layer: "repository" });
        try {
            logger.info(`Fetching timeline for user. UserID: ${userID}, Page: ${page}`, { layer: "repository" });

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
                take: 3,
                skip: (page - 1) * 3,
            });

            logger.info(`Successfully fetched timeline for user. UserID: ${userID}, Page: ${page}`, { layer: "repository" });
            return posts;
        } catch (error) {
            logger.error(`Error in fetchTimeline: Unable to fetch timeline for user. UserID: ${userID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to fetch timeline");
        } finally {
            logger.debug(`Exiting fetchTimeline method. Params: userID=${userID}, page=${page}`, { method: "fetchTimeline", layer: "repository" });
        }
    }
}

export default PostsRepository;