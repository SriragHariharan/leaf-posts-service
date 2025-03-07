import { Request, Response, NextFunction } from "express";
import { IPostService } from "../interfaces/IPostService";
import createHttpError from "http-errors";
import logger from "../helpers/logger";

class PostController {
    private postsService: IPostService;

    constructor(postsService: IPostService) {
        this.postsService = postsService;
    }

    /* Create a new post with optional image upload */
    async createPost(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering createPost method.`, { method: "createPost", layer: "controller" });
        try {
            const userID = req?.user?.aud;
            const file = req?.file ? req.file.buffer : null;
            const content = req?.body?.content;

            logger.info(`Creating new post for user. UserID: ${userID}`, { layer: "controller" });
            const post = await this.postsService.createNewPost(userID, file, content);

            logger.info(`Successfully created new post. PostID: ${post.id}`, { layer: "controller" });
            return res.status(201).json({ message: "", data: { post } });
        } catch (error) {
            logger.error(`Error in createPost: ${error}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting createPost method.`, { method: "createPost", layer: "controller" });
        }
    }

    /* Delete an existing post */
    async deletePost(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering deletePost method. Param: postID=${req.params.postID}`, { method: "deletePost", layer: "controller" });
        try {
            const postID = req.params?.postID;
            if (!postID) {
                logger.error(`Post not found. PostID: ${postID}`, { layer: "controller" });
                throw createHttpError(400, "Post not found");
            }

            logger.info(`Deleting post. PostID: ${postID}`, { layer: "controller" });
            await this.postsService.deletePost(postID);

            logger.info(`Successfully deleted post. PostID: ${postID}`, { layer: "controller" });
            return res.status(201).json({ success: true, message: "Post deleted", data: null });
        } catch (error) {
            logger.error(`Error in deletePost: ${error}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting deletePost method. Param: postID=${req.params.postID}`, { method: "deletePost", layer: "controller" });
        }
    }

    /* Save a post for a user */
    async savePost(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering savePost method. Params: postID=${req.params.postID}, userID=${req?.user?.aud}`, { method: "savePost", layer: "controller" });
        try {
            const postID = req.params.postID;
            const userID = req?.user?.aud;
            if (!postID) {
                logger.error(`No post ID provided.`, { layer: "controller" });
                throw createHttpError(400, "No post ID provided");
            }

            logger.info(`Saving post for user. PostID: ${postID}, UserID: ${userID}`, { layer: "controller" });
            await this.postsService.savePost(postID, userID);

            logger.info(`Successfully saved post. PostID: ${postID}, UserID: ${userID}`, { layer: "controller" });
            return res.status(201).json({ success: true, message: "Post saved", data: null });
        } catch (error) {
            logger.error(`Error in savePost: ${error}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting savePost method. Params: postID=${req.params.postID}, userID=${req?.user?.aud}`, { method: "savePost", layer: "controller" });
        }
    }

    /* Unsave a post for a user */
    async unsavePost(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering unsavePost method. Params: postID=${req.params.postID}, userID=${req?.user?.aud}`, { method: "unsavePost", layer: "controller" });
        try {
            const userID = req?.user?.aud;
            const postID = req.params.postID;
            if (!postID) {
                logger.error(`No post ID provided.`, { layer: "controller" });
                throw createHttpError(400, "No post ID provided");
            }

            logger.info(`Unsaving post for user. PostID: ${postID}, UserID: ${userID}`, { layer: "controller" });
            let response = await this.postsService.unsavePost(postID, userID);

            logger.info(`Successfully unsaved post. PostID: ${postID}, UserID: ${userID}`, { layer: "controller" });
            return res.status(200).json({ success: response, message: "Unsaved post", data: null });
        } catch (error) {
            logger.error(`Error in unsavePost: ${error}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting unsavePost method. Params: postID=${req.params.postID}, userID=${req?.user?.aud}`, { method: "unsavePost", layer: "controller" });
        }
    }

    /* Get all saved posts for a user */
    async getSavedPostsByUser(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getSavedPostsByUser method. Param: userID=${req?.user?.aud}`, { method: "getSavedPostsByUser", layer: "controller" });
        try {
            const userID = req?.user?.aud;

            logger.info(`Fetching saved posts for user. UserID: ${userID}`, { layer: "controller" });
            const savedPosts = await this.postsService.getSavedPostsOfUser(userID);

            logger.info(`Successfully fetched saved posts for user. UserID: ${userID}`, { layer: "controller" });
            return res.status(200).json({ success: true, message: null, data: { posts: savedPosts } });
        } catch (error) {
            logger.error(`Error in getSavedPostsByUser: ${error}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting getSavedPostsByUser method. Param: userID=${req?.user?.aud}`, { method: "getSavedPostsByUser", layer: "controller" });
        }
    }

    /* Like or unlike a post */
    async toggleLike(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering toggleLike method. Params: postID=${req.params.postID}, userID=${req?.user?.aud}`, { method: "toggleLike", layer: "controller" });
        try {
            const postID = req.params.postID;
            const userID = req?.user?.aud;
            if (!postID) {
                logger.error(`No post ID provided.`, { layer: "controller" });
                throw createHttpError(400, "No post ID provided");
            }

            logger.info(`Toggling like for post. PostID: ${postID}, UserID: ${userID}`, { layer: "controller" });
            let response = await this.postsService.toggleLike(postID, userID);

            logger.info(`Successfully toggled like for post. PostID: ${postID}, UserID: ${userID}`, { layer: "controller" });
            return res.status(200).json({ success: true, message: response ? "Post liked" : "Post unliked", data: null });
        } catch (error) {
            logger.error(`Error in toggleLike: ${error}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting toggleLike method. Params: postID=${req.params.postID}, userID=${req?.user?.aud}`, { method: "toggleLike", layer: "controller" });
        }
    }

    /* Add a comment to a post */
    async addComments(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering addComments method. Params: postID=${req.params.postID}, userID=${req?.user?.aud}`, { method: "addComments", layer: "controller" });
        try {
            const userID = req?.user?.aud;
            const postID = req.params.postID;
            const comment = req.body.comment;
            if (!postID) {
                logger.error(`No post ID provided.`, { layer: "controller" });
                throw createHttpError(400, "No post ID provided");
            }
            if (!comment) {
                logger.error(`No comment provided.`, { layer: "controller" });
                throw createHttpError(400, "No comment provided");
            }

            logger.info(`Adding comment to post. PostID: ${postID}, UserID: ${userID}`, { layer: "controller" });
            let response = await this.postsService.addComments(postID, userID, comment);

            logger.info(`Successfully added comment to post. PostID: ${postID}, UserID: ${userID}`, { layer: "controller" });
            return res.status(201).json({ success: true, message: "Comment added", data: { comment: response } });
        } catch (error) {
            logger.error(`Error in addComments: ${error}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting addComments method. Params: postID=${req.params.postID}, userID=${req?.user?.aud}`, { method: "addComments", layer: "controller" });
        }
    }

    /* Get all comments for a specific post */
    async getComments(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getComments method. Param: postID=${req.params.postID}`, { method: "getComments", layer: "controller" });
        try {
            const postID = req.params.postID;
            if (!postID) {
                logger.error(`No post ID provided.`, { layer: "controller" });
                throw createHttpError(400, "No post ID provided");
            }

            logger.info(`Fetching comments for post. PostID: ${postID}`, { layer: "controller" });
            let comments = await this.postsService.getComments(postID);

            logger.info(`Successfully fetched comments for post. PostID: ${postID}`, { layer: "controller" });
            return res.status(200).json({ success: true, message: null, data: { comments } });
        } catch (error) {
            logger.error(`Error in getComments: ${error}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting getComments method. Param: postID=${req.params.postID}`, { method: "getComments", layer: "controller" });
        }
    }

    /* Report a post */
    async reportPost(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering reportPost method. Params: postID=${req.params.postID}, userID=${req?.user?.aud}`, { method: "reportPost", layer: "controller" });
        try {
            const postID = req.params.postID;
            const userID = req?.user?.aud;
            const reason = req.body.reason;
            const description = req.body.description;
            if (!postID) {
                logger.error(`No post ID provided.`, { layer: "controller" });
                throw createHttpError(400, "No post ID provided");
            }
            if (!reason) {
                logger.error(`No reason provided.`, { layer: "controller" });
                throw createHttpError(400, "No reason provided");
            }

            logger.info(`Reporting post. PostID: ${postID}, UserID: ${userID}`, { layer: "controller" });
            await this.postsService.reportPost(postID, userID, reason, description);

            logger.info(`Successfully reported post. PostID: ${postID}, UserID: ${userID}`, { layer: "controller" });
            return res.status(201).json({ success: true, message: "Post reported", data: null });
        } catch (error) {
            logger.error(`Error in reportPost: ${error}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting reportPost method. Params: postID=${req.params.postID}, userID=${req?.user?.aud}`, { method: "reportPost", layer: "controller" });
        }
    }

    /* Get interaction count (likes and comments) for a post */
    async getInteractionCount(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getInteractionCount method. Param: postID=${req.params.postID}`, { method: "getInteractionCount", layer: "controller" });
        try {
            const postID = req.params.postID;
            if (!postID) {
                logger.error(`No post ID provided.`, { layer: "controller" });
                throw createHttpError(400, "No post ID provided");
            }

            logger.info(`Fetching interaction count for post. PostID: ${postID}`, { layer: "controller" });
            let interactions = await this.postsService.getInteractionCount(postID);

            logger.info(`Successfully fetched interaction count for post. PostID: ${postID}`, { layer: "controller" });
            return res.status(200).json({ success: true, message: null, data: { ...interactions } });
        } catch (error) {
            logger.error(`Error in getInteractionCount: ${error}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting getInteractionCount method. Param: postID=${req.params.postID}`, { method: "getInteractionCount", layer: "controller" });
        }
    }

    /* Get details of a post for an external user */
    async getPostDetails(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getPostDetails method. Param: postID=${req.params.postID}`, { method: "getPostDetails", layer: "controller" });
        try {
            const postID = req.params.postID;
            if (!postID) {
                logger.error(`Post not found. PostID: ${postID}`, { layer: "controller" });
                throw createHttpError(404, "Post not found");
            }

            logger.info(`Fetching details for post. PostID: ${postID}`, { layer: "controller" });
            const postDetails = await this.postsService.getPostDetails(postID);

            logger.info(`Successfully fetched details for post. PostID: ${postID}`, { layer: "controller" });
            return res.status(200).json({ success: true, message: null, data: { post: postDetails } });
        } catch (error) {
            logger.error(`Error in getPostDetails: ${error}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting getPostDetails method. Param: postID=${req.params.postID}`, { method: "getPostDetails", layer: "controller" });
        }
    }

    /* Search for posts by content */
    async searchPosts(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering searchPosts method. Param: query=${req.query.query}`, { method: "searchPosts", layer: "controller" });
        try {
            const query = req.query.query as string;
            if (!query) {
                logger.error(`No search query provided.`, { layer: "controller" });
                throw createHttpError(400, "Enter something to search");
            }

            logger.info(`Searching for posts containing query: ${query}`, { layer: "controller" });
            const posts = await this.postsService.searchPosts(query);

            logger.info(`Successfully fetched posts for query: ${query}`, { layer: "controller" });
            return res.status(200).json({ success: true, message: null, data: { posts } });
        } catch (error) {
            logger.error(`Error in searchPosts: ${error}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting searchPosts method. Param: query=${req.query.query}`, { method: "searchPosts", layer: "controller" });
        }
    }

    /* Fetch user timeline (all posts by the user) */
    async fetchTimeline(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering fetchTimeline method. Params: userID=${req.params.userID}, page=${req.query.page}`, { method: "fetchTimeline", layer: "controller" });
        try {
            const userID = req.params?.userID === "self" ? req.user?.aud : req.params.userID;
            const page = Number(req.query.page) ?? 1;

            logger.info(`Fetching timeline for user. UserID: ${userID}, Page: ${page}`, { layer: "controller" });
            const posts = await this.postsService.fetchTimeline(userID, page);

            logger.info(`Successfully fetched timeline for user. UserID: ${userID}, Page: ${page}`, { layer: "controller" });
            return res.status(200).json({ success: true, message: null, data: { posts } });
        } catch (error) {
            logger.error(`Error in fetchTimeline: ${error}`, { error, layer: "controller" });
            next(error);
        } finally {
            logger.debug(`Exiting fetchTimeline method. Params: userID=${req.params.userID}, page=${req.query.page}`, { method: "fetchTimeline", layer: "controller" });
        }
    }
}

export default PostController;