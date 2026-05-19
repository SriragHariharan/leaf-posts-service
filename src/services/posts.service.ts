import createHttpError from "http-errors";
import { uploadToCloudinary, deleteFromCloudinary } from "../helpers/cloudinary.helper";
import compressImage from "../helpers/sharp.helper";
import { IPostsRepository } from "../interfaces/IPostsRepository";
import { Post, ReportReason } from "../interfaces/post.interface";
import { SearchUser } from "../interfaces/user.interface";
import { IElasticRepository } from "../interfaces/IElasticRepository";
import { IPostService } from "../interfaces/IPostService";
import { PostComment } from "../interfaces/comment.interface";
import RedisHelper from "../helpers/redis";
import { sendPostCreatedEvent, sendPostDeletedEvent, sendPostEditedEvent } from "../messaging/kafka/post-events.producer";
import sendPostRelatedNotification from "../messaging/kafka/post-notifs.producer";
import { publishInteractionEvent } from "../messaging/kafka/interaction-events.producer";
import type {
    AddCommentResult,
    DeleteCommentResult,
    InteractionEventType,
    ToggleLikeResult,
} from "../interfaces/interaction.interface";
import logger from "../helpers/logger";

class PostsService implements IPostService {

    private postsRepository: IPostsRepository;
    private esRepository: IElasticRepository;

    constructor(postsRepository: IPostsRepository, esRepository: IElasticRepository) {
        this.postsRepository = postsRepository;
        this.esRepository = esRepository;
    }

    /* Create a new post with optional image upload */
    async createNewPost(userID: string, imageBuffer: Buffer | null, content: string): Promise<Post> {
        logger.debug(`Entering createNewPost method. Params: userID=${userID}`, { method: "createNewPost", layer: "service" });
        try {
            logger.info(`Creating new post for user. UserID: ${userID}`, { layer: "service" });

            const newPost = await this.postsRepository.createNewPost(userID, content);
            const newPostID = newPost.id!;

            if (imageBuffer) {
                logger.info(`Compressing and uploading image for post. PostID: ${newPostID}`, { layer: "service" });
                const compressedImageBufferString = await compressImage(imageBuffer);
                const publicId = `posts/${newPostID}`;
                const imageURL = await uploadToCloudinary(compressedImageBufferString, publicId);
                await this.postsRepository.updateImageURL(newPostID, imageURL);
                await this.esRepository.createNewPost(newPostID, userID, content, imageURL, newPost.createdAt!);
            } else {
                logger.info(`Creating post in Elasticsearch without image. PostID: ${newPostID}`, { layer: "service" });
                await this.esRepository.createNewPost(newPostID, userID, content, null, newPost.createdAt!);
            }

            const postDetails = await this.postsRepository.getPostDetails(newPostID);

            /* Send messages to RabbitMQ => feeds service */
            logger.info(`Sending post created event to RabbitMQ. PostID: ${newPostID}`, { layer: "service" });
            sendPostCreatedEvent(postDetails?.id!, postDetails?.imageURL!, postDetails?.content!, userID!);

            /* Send notification to notification service */
            logger.info(`Sending post-related notification. PostID: ${newPostID}`, { layer: "service" });
            sendPostRelatedNotification('post_created', userID, postDetails?.id!, userID);

            logger.info(`Successfully created new post. PostID: ${newPostID}`, { layer: "service" });
            return postDetails;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in createNewPost: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in createNewPost.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting createNewPost method. Params: userID=${userID}`, { method: "createNewPost", layer: "service" });
        }
    }

    /* Update an existing post */
    async updatePost(userID: string, postID: string, imageBuffer: Buffer | null, content: string): Promise<Post> {
        logger.debug(`Entering updatePost method. Params: userID=${userID}, postID=${postID}`, { method: "updatePost", layer: "service" });
        try {
            const existing = await this.postsRepository.getPostDetails(postID);
            if (existing.user?.userID !== userID) {
                throw createHttpError(403, "Not allowed to update this post");
            }

            await this.postsRepository.updatePost(postID, content);

            let imageURL = existing.imageURL ?? null;
            if (imageBuffer) {
                const compressedImageBufferString = await compressImage(imageBuffer);
                const publicId = `posts/${postID}`;
                imageURL = await uploadToCloudinary(compressedImageBufferString, publicId);
                await this.postsRepository.updateImageURL(postID, imageURL);
            }

            await this.esRepository.updatePost(postID, userID, content, imageURL);

            const postDetails = await this.postsRepository.getPostDetails(postID);
            sendPostEditedEvent(postDetails.id!, postDetails.imageURL ?? null, postDetails.content!, userID);

            return postDetails;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in updatePost: ${error.message}`, { error, layer: "service" });
                throw error;
            }
            logger.error(`Unexpected error in updatePost.`, { error, layer: "service" });
            throw createHttpError(500, "An unexpected error occurred");
        } finally {
            logger.debug(`Exiting updatePost method. Params: postID=${postID}`, { method: "updatePost", layer: "service" });
        }
    }

    /* Delete a post */
    async deletePost(postID: string): Promise<boolean> {
        logger.debug(`Entering deletePost method. Param: postID=${postID}`, { method: "deletePost", layer: "service" });
        try {
            logger.info(`Deleting post. PostID: ${postID}`, { layer: "service" });

            await deleteFromCloudinary(`posts/${postID}`);
            await this.postsRepository.deletePost(postID);

            logger.info(`Deleting post from Elasticsearch. PostID: ${postID}`, { layer: "service" });
            await this.esRepository.deletePost(postID);

            /* Send message to RabbitMQ to delete post from feeds service */
            logger.info(`Sending post deleted event to RabbitMQ. PostID: ${postID}`, { layer: "service" });
            sendPostDeletedEvent(postID);

            logger.info(`Successfully deleted post. PostID: ${postID}`, { layer: "service" });
            return true;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in deletePost: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in deletePost.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting deletePost method. Param: postID=${postID}`, { method: "deletePost", layer: "service" });
        }
    }

    /* Save a post for a user */
    async savePost(postID: string, userID: string): Promise<{ id: number; userID: string; createdAt: Date; postID: string; }> {
        logger.debug(`Entering savePost method. Params: postID=${postID}, userID=${userID}`, { method: "savePost", layer: "service" });
        try {
            logger.info(`Saving post for user. PostID: ${postID}, UserID: ${userID}`, { layer: "service" });

            const postSavedResponse = await this.postsRepository.savePost(postID, userID);

            logger.info(`Successfully saved post. PostID: ${postID}, UserID: ${userID}`, { layer: "service" });
            return postSavedResponse;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in savePost: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in savePost.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting savePost method. Params: postID=${postID}, userID=${userID}`, { method: "savePost", layer: "service" });
        }
    }

    /* Unsave a post for a user */
    async unsavePost(postID: string, userID: string): Promise<boolean> {
        logger.debug(`Entering unsavePost method. Params: postID=${postID}, userID=${userID}`, { method: "unsavePost", layer: "service" });
        try {
            logger.info(`Unsaving post for user. PostID: ${postID}, UserID: ${userID}`, { layer: "service" });

            const response = await this.postsRepository.unsavePost(postID, userID);

            logger.info(`Successfully unsaved post. PostID: ${postID}, UserID: ${userID}`, { layer: "service" });
            return response;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in unsavePost: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in unsavePost.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting unsavePost method. Params: postID=${postID}, userID=${userID}`, { method: "unsavePost", layer: "service" });
        }
    }

    /* Get all saved posts for a user */
    async getSavedPostsOfUser(userID: string): Promise<Promise<{ post: Post }[]>> {
        logger.debug(`Entering getSavedPostsOfUser method. Param: userID=${userID}`, { method: "getSavedPostsOfUser", layer: "service" });
        try {
            logger.info(`Fetching saved posts for user. UserID: ${userID}`, { layer: "service" });

            let savedPosts = await this.postsRepository.getSavedPostsByUser(userID);

            logger.info(`Successfully fetched saved posts for user. UserID: ${userID}`, { layer: "service" });
            return savedPosts;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getSavedPostsOfUser: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getSavedPostsOfUser.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting getSavedPostsOfUser method. Param: userID=${userID}`, { method: "getSavedPostsOfUser", layer: "service" });
        }
    }

    /* Like or unlike a post */
    async toggleLike(postID: string, userID: string): Promise<ToggleLikeResult> {
        logger.debug(`Entering toggleLike method. Params: postID=${postID}, userID=${userID}`, { method: "toggleLike", layer: "service" });
        try {
            logger.info(`Toggling like for post. PostID: ${postID}, UserID: ${userID}`, { layer: "service" });

            const result = await this.postsRepository.toggleLike(postID, userID);
            const postDetails = await this.postsRepository.getPostDetails(postID);
            const targetUserId = postDetails?.user?.userID;

            if (targetUserId) {
                const eventType: InteractionEventType = result.isLiked ? "post.liked" : "post.unliked";
                await publishInteractionEvent({
                    eventType,
                    actorUserId: userID,
                    targetUserId,
                    postId: postID,
                    timestamp: new Date().toISOString(),
                });
            }

            logger.info(`Successfully toggled like for post. PostID: ${postID}, UserID: ${userID}`, { layer: "service" });
            return result;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in toggleLike: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in toggleLike.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting toggleLike method. Params: postID=${postID}, userID=${userID}`, { method: "toggleLike", layer: "service" });
        }
    }

    /* Add a comment to a post */
    async addComments(postID: string, userID: string, comment: string): Promise<AddCommentResult> {
        logger.debug(`Entering addComments method. Params: postID=${postID}, userID=${userID}`, { method: "addComments", layer: "service" });
        try {
            logger.info(`Adding comment to post. PostID: ${postID}, UserID: ${userID}`, { layer: "service" });

            const result = await this.postsRepository.addComments(postID, userID, comment);
            const postDetails = await this.postsRepository.getPostDetails(postID);
            const targetUserId = postDetails?.user?.userID;
            const commentRecord = result.comment as { id?: number };

            if (targetUserId && commentRecord.id != null) {
                await publishInteractionEvent({
                    eventType: "post.commented",
                    actorUserId: userID,
                    targetUserId,
                    postId: postID,
                    commentId: String(commentRecord.id),
                    timestamp: new Date().toISOString(),
                });
            }

            logger.info(`Successfully added comment to post. PostID: ${postID}, UserID: ${userID}`, { layer: "service" });
            return result;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in addComments: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in addComments.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting addComments method. Params: postID=${postID}, userID=${userID}`, { method: "addComments", layer: "service" });
        }
    }

    /* Delete a comment from a post */
    async deleteComment(postID: string, commentID: number, userID: string): Promise<DeleteCommentResult> {
        logger.debug(`Entering deleteComment method. Params: postID=${postID}, commentID=${commentID}, userID=${userID}`, { method: "deleteComment", layer: "service" });
        try {
            const result = await this.postsRepository.deleteComment(postID, commentID, userID);
            const postDetails = await this.postsRepository.getPostDetails(postID);
            const targetUserId = postDetails?.user?.userID;

            if (targetUserId && !result.isCommented) {
                await publishInteractionEvent({
                    eventType: "post.uncommented",
                    actorUserId: userID,
                    targetUserId,
                    postId: postID,
                    commentId: String(commentID),
                    timestamp: new Date().toISOString(),
                });
            }

            return result;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in deleteComment: ${error.message}`, { error, layer: "service" });
                throw error;
            }
            logger.error(`Unexpected error in deleteComment.`, { error, layer: "service" });
            throw createHttpError(500, "An unexpected error occurred");
        } finally {
            logger.debug(`Exiting deleteComment method. Params: postID=${postID}, commentID=${commentID}`, { method: "deleteComment", layer: "service" });
        }
    }

    /* Get all comments for a post */
    async getComments(postID: string): Promise<PostComment[]> {
        logger.debug(`Entering getComments method. Param: postID=${postID}`, { method: "getComments", layer: "service" });
        try {
            logger.info(`Fetching comments for post. PostID: ${postID}`, { layer: "service" });

            const comments = await this.postsRepository.getComments(postID);

            logger.info(`Successfully fetched comments for post. PostID: ${postID}`, { layer: "service" });
            return comments;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getComments: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getComments.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting getComments method. Param: postID=${postID}`, { method: "getComments", layer: "service" });
        }
    }

    /* Report a post */
    async reportPost(postID: string, userID: string, reason: ReportReason, description: string): Promise<boolean> {
        logger.debug(`Entering reportPost method. Params: postID=${postID}, userID=${userID}`, { method: "reportPost", layer: "service" });
        try {
            logger.info(`Reporting post. PostID: ${postID}, UserID: ${userID}`, { layer: "service" });

            const response = await this.postsRepository.reportPost(postID, userID, reason, description);

            logger.info(`Successfully reported post. PostID: ${postID}, UserID: ${userID}`, { layer: "service" });
            return response;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in reportPost: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in reportPost.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting reportPost method. Params: postID=${postID}, userID=${userID}`, { method: "reportPost", layer: "service" });
        }
    }

    /* Get likes and comments count for a specific post */
    async getInteractionCount(postID: string): Promise<{ likesCount: number; commentsCount: number } | null> {
        logger.debug(`Entering getInteractionCount method. Param: postID=${postID}`, { method: "getInteractionCount", layer: "service" });
        try {
            logger.info(`Fetching interaction count for post. PostID: ${postID}`, { layer: "service" });

            const interactions = await this.postsRepository.getInteractionCount(postID);

            logger.info(`Successfully fetched interaction count for post. PostID: ${postID}`, { layer: "service" });
            return interactions;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getInteractionCount: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getInteractionCount.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting getInteractionCount method. Param: postID=${postID}`, { method: "getInteractionCount", layer: "service" });
        }
    }

    /* Get details of a post (shared to external user) */
    async getPostDetails(postID: string): Promise<Post> {
        logger.debug(`Entering getPostDetails method. Param: postID=${postID}`, { method: "getPostDetails", layer: "service" });
        try {
            logger.info(`Fetching details for post. PostID: ${postID}`, { layer: "service" });

            const postDetails = await this.postsRepository.getPostDetails(postID);

            logger.info(`Successfully fetched details for post. PostID: ${postID}`, { layer: "service" });
            return postDetails;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getPostDetails: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getPostDetails.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting getPostDetails method. Param: postID=${postID}`, { method: "getPostDetails", layer: "service" });
        }
    }

    /* Search for posts by content */
    async searchPosts(query: string): Promise<Post[]> {
        logger.debug(`Entering searchPosts method. Param: query=${query}`, { method: "searchPosts", layer: "service" });
        try {
            logger.info(`Searching for posts containing query: ${query}`, { layer: "service" });

            const posts = await this.esRepository.searchPostsContent(query);

            logger.info(`Successfully fetched posts for query: ${query}`, { layer: "service" });
            return posts;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in searchPosts: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in searchPosts.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting searchPosts method. Param: query=${query}`, { method: "searchPosts", layer: "service" });
        }
    }

    /* Search for users by username */
    async searchUsers(query: string, excludeUserID?: string): Promise<SearchUser[]> {
        logger.debug(`Entering searchUsers method. Param: query=${query}`, { method: "searchUsers", layer: "service" });
        try {
            logger.info(`Searching for users matching query: ${query}`, { layer: "service" });

            const users = await this.esRepository.searchUsersContent(query);
            const filtered = excludeUserID
                ? users.filter((u) => u.userID !== excludeUserID)
                : users;

            logger.info(`Successfully fetched users for query: ${query}`, { layer: "service" });
            return filtered;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in searchUsers: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in searchUsers.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting searchUsers method. Param: query=${query}`, { method: "searchUsers", layer: "service" });
        }
    }

    /* Fetch user timeline (all posts by the user) */
    async fetchTimeline(userID: string, page: number): Promise<Post[]> {
        logger.debug(`Entering fetchTimeline method. Params: userID=${userID}, page=${page}`, { method: "fetchTimeline", layer: "service" });
        try {
            logger.info(`Fetching timeline for user. UserID: ${userID}, Page: ${page}`, { layer: "service" });

            const posts = await this.postsRepository.fetchTimeline(userID, page);

            logger.info(`Successfully fetched timeline for user. UserID: ${userID}, Page: ${page}`, { layer: "service" });
            return posts;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in fetchTimeline: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in fetchTimeline.`, { error, layer: "service" });
                throw createHttpError(500, "An unexpected error occurred");
            }
        } finally {
            logger.debug(`Exiting fetchTimeline method. Params: userID=${userID}, page=${page}`, { method: "fetchTimeline", layer: "service" });
        }
    }
}

export default PostsService;