import { Request, Response, NextFunction } from "express";
import { IPostService } from "../interfaces/IPostService";
import createHttpError from "http-errors";
class PostController {
    private postsService: IPostService;


    constructor(postsService: IPostService) {

        this.postsService = postsService;
    }

    /* Create a new post with optional image upload */
    async createPost(req: Request, res: Response, next: NextFunction) {
        try {

            const userID = req?.user?.aud;

            const file = req?.file ? req.file.buffer : null;

            const content = req?.body?.content;
            const post = await this.postsService.createNewPost(userID, file, content);
            return res.status(201).json({ message: "", data: { post } });
        }
 catch (error) {
            next(error);
        }
    }

    /* Update an existing post */
    async updatePost(req: Request, res: Response, next: NextFunction) {
        try {

            const userID = req?.user?.aud;

            const postID = req.params?.postID;

            const file = req?.file ? req.file.buffer : null;

            const content = req?.body?.content;


            if (!postID) {

                throw createHttpError(400, "Post not found");
            }
            if (!content) {

                throw createHttpError(400, "Content is required");
            }

            const post = await this.postsService.updatePost(userID, postID, file, content);

            return res.status(200).json({ message: "", data: { post } });
        }
 catch (error) {
            next(error);
        }
    }

    /* Delete an existing post */
    async deletePost(req: Request, res: Response, next: NextFunction) {
        try {

            const postID = req.params?.postID;

            if (!postID) {
                throw createHttpError(400, "Post not found");
            }            await this.postsService.deletePost(postID);
            return res.status(201).json({ success: true, message: "Post deleted", data: null });
        }
 catch (error) {
            next(error);
        }
    }

    /* Save a post for a user */
    async savePost(req: Request, res: Response, next: NextFunction) {
        try {

            const postID = req.params.postID;

            const userID = req?.user?.aud;

            if (!postID) {
                throw createHttpError(400, "No post ID provided");
            }            await this.postsService.savePost(postID, userID);
            return res.status(201).json({ success: true, message: "Post saved", data: null });
        }
 catch (error) {
            next(error);
        }
    }

    /* Unsave a post for a user */
    async unsavePost(req: Request, res: Response, next: NextFunction) {
        try {

            const userID = req?.user?.aud;

            const postID = req.params.postID;

            if (!postID) {
                throw createHttpError(400, "No post ID provided");
            }            let response = await this.postsService.unsavePost(postID, userID);
            return res.status(200).json({ success: response, message: "Unsaved post", data: null });
        }
 catch (error) {
            next(error);
        }
    }

    /* Get all saved posts for a user */
    async getSavedPostsByUser(req: Request, res: Response, next: NextFunction) {
        try {

            const userID = req?.user?.aud;
            const savedPosts = await this.postsService.getSavedPostsOfUser(userID);
            return res.status(200).json({ success: true, message: null, data: { posts: savedPosts } });
        }
 catch (error) {
            next(error);
        }
    }

    /* Like or unlike a post */
    async toggleLike(req: Request, res: Response, next: NextFunction) {
        try {

            const postID = req.params.postID;

            const userID = req?.user?.aud;

            if (!postID) {
                throw createHttpError(400, "No post ID provided");
            }            let response = await this.postsService.toggleLike(postID, userID);
            return res.status(200).json({
                success: true,
                message: response.isLiked ? "Post liked" : "Post unliked",
                data: { likesCount: response.likesCount, isLiked: response.isLiked },
            });
        }
 catch (error) {
            next(error);
        }
    }

    /* Add a comment to a post */
    async addComments(req: Request, res: Response, next: NextFunction) {
        try {

            const userID = req?.user?.aud;

            const postID = req.params.postID;

            const comment = req.body.comment;

            if (!postID) {
                throw createHttpError(400, "No post ID provided");
            }
            if (!comment) {
                throw createHttpError(400, "No comment provided");
            }            let response = await this.postsService.addComments(postID, userID, comment);
            return res.status(201).json({
                success: true,
                message: "Comment added",
                data: {
                    comment: response.comment,
                    commentsCount: response.commentsCount,
                    isCommented: response.isCommented,
                },
            });
        }
 catch (error) {
            next(error);
        }
    }

    /* Delete a comment from a post */
    async deleteComment(req: Request, res: Response, next: NextFunction) {
        try {

            const userID = req?.user?.aud;

            const postID = req.params.postID;

            const commentID = Number(req.params.commentID);


            if (!postID) {

                throw createHttpError(400, "No post ID provided");
            }
            if (!Number.isInteger(commentID) || commentID <= 0) {

                throw createHttpError(400, "Invalid comment ID");
            }

            const response = await this.postsService.deleteComment(postID, commentID, userID);


            return res.status(200).json({
                success: true,
                message: "Comment deleted",
                data: {
                    commentsCount: response.commentsCount,
                    isCommented: response.isCommented,
                },
            });
        }
 catch (error) {
            next(error);
        }
    }

    /* Get all comments for a specific post */
    async getComments(req: Request, res: Response, next: NextFunction) {
        try {

            const postID = req.params.postID;

            if (!postID) {
                throw createHttpError(400, "No post ID provided");
            }            let comments = await this.postsService.getComments(postID);
            return res.status(200).json({ success: true, message: null, data: { comments } });
        }
 catch (error) {
            next(error);
        }
    }

    /* Report a post */
    async reportPost(req: Request, res: Response, next: NextFunction) {
        try {

            const postID = req.params.postID;

            const userID = req?.user?.aud;

            const reason = req.body.reason;

            const description = req.body.description;

            if (!postID) {
                throw createHttpError(400, "No post ID provided");
            }
            if (!reason) {
                throw createHttpError(400, "No reason provided");
            }            await this.postsService.reportPost(postID, userID, reason, description);
            return res.status(201).json({ success: true, message: "Post reported", data: null });
        }
 catch (error) {
            next(error);
        }
    }

    /* Get interaction count (likes and comments) for a post */
    async getInteractionCount(req: Request, res: Response, next: NextFunction) {
        try {

            const postID = req.params.postID;

            if (!postID) {
                throw createHttpError(400, "No post ID provided");
            }            let interactions = await this.postsService.getInteractionCount(postID);
            return res.status(200).json({ success: true, message: null, data: { ...interactions } });
        }
 catch (error) {
            next(error);
        }
    }

    /* Get details of a post for an external user */
    async getPostDetails(req: Request, res: Response, next: NextFunction) {
        try {

            const postID = req.params.postID;

            if (!postID) {
                throw createHttpError(404, "Post not found");
            }            const postDetails = await this.postsService.getPostDetails(postID);
            return res.status(200).json({ success: true, message: null, data: { post: postDetails } });
        }
 catch (error) {
            next(error);
        }
    }

    /* Search for posts or users */
    async search(req: Request, res: Response, next: NextFunction) {
        try {

            const query = String(req.query.query ?? "").trim();

            if (!query) {
                throw createHttpError(400, "Enter something to search");
            }

            const type = String(req.query.type ?? "user").toLowerCase();

            if (type !== "user" && type !== "post") {

                throw createHttpError(400, "Invalid search type. Use 'user' or 'post'.");
            }

            if (type === "post") {
                const posts = await this.postsService.searchPosts(query);
                return res.status(200).json({ success: true, message: null, data: { posts } });
            }

            const currentUserID = req.user?.aud as string | undefined;
            const users = await this.postsService.searchUsers(query, currentUserID);
            return res.status(200).json({ success: true, message: null, data: { users } });
        }
 catch (error) {
            next(error);
        }
    }

    /* Fetch user timeline (all posts by the user) */
    async fetchTimeline(req: Request, res: Response, next: NextFunction) {
        try {

            const userID = req.params?.userID === "self" ? req.user?.aud : req.params.userID;

            const page = Number(req.query.page) ?? 1;
            const posts = await this.postsService.fetchTimeline(userID, page);
            return res.status(200).json({ success: true, message: null, data: { posts } });
        }
 catch (error) {
            next(error);
        }
    }
}

export default PostController;