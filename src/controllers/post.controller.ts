import { Request, Response, NextFunction } from "express"
import { IPostService } from "../interfaces/IPostService";
import createHttpError from "http-errors";

class PostController {
    private postsService: IPostService;
    constructor(postsService: IPostService){
        this.postsService = postsService;
    }

    async createPost(req: Request, res: Response, next: NextFunction){
        try {
            const userID = req?.user?.aud;
            const file = req?.file ? req.file.buffer : null;
            const content = req?.body?.content;
            const post = await this.postsService.createNewPost(userID, file, content )
            return res.status(201).json({ message: "", data: { post }});
        } catch (error) {
            next(error);
        }
    }

    async savePost(req: Request, res: Response, next: NextFunction){
        try {
            const postID = req.params.postID;
            const userID = req?.user?.aud;
            if(!postID) throw createHttpError(400, "No post ID provided");
            await this.postsService.savePost(postID, userID);
            return res.status(201).json({ success: true, message: "Post saved", data: null});
        } catch (error) {
            next(error);
        }
    }

    async unsavePost(req: Request, res: Response, next: NextFunction){
        try {
            const userID = req?.user?.aud;
            const postID = req.params.postID;
            if(!postID) throw createHttpError(400, "No post ID provided");
            let response = await this.postsService.unsavePost(postID, userID);
            return res.status(200).json({ success: response, message: "Unsaved post", data: null});
        } catch (error) {
            next(error);
        }
    }

    async getSavedPostsByUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userID = req?.user?.aud;
            const savedPosts = await this.postsService.getSavedPostsOfUser(userID);
            return res.status(200).json({ success: true, message: null, data: { posts: savedPosts}});
        } catch (error) {
            next(error);
        }
    }

    /* unlike or like on a post(single route for both) */
    async toggleLike(req: Request, res: Response, next: NextFunction){
        try {
            const postID = req.params.postID;
            const userID = req?.user?.aud;
            if(!postID) throw createHttpError(400, "No post ID provided");
            let response = await this.postsService.toggleLike(postID, userID);
            return res.status(200).json({ success: true, message: response ? "Post liked" : "Post unliked", data: null});
        } catch (error) {
            next(error);
        }
    }

    /* add comments to a post */
    async addComments(req: Request, res: Response, next: NextFunction){
        try {
            const userID = req?.user?.aud;
            const postID = req.params.postID;
            const comment = req.body.comment;
            if(!postID) throw createHttpError(400, "No post ID provided");
            if(!comment) throw createHttpError(400, "No comment provided");
            let response = await this.postsService.addComments(postID, userID, comment);
            return res.status(201).json({ success: true, message: "Comment added", data: { comment: response}});
        } catch (error) {
            next(error);
        }
    }

    /* get all comments for a specific post */
    async getComments(req: Request, res: Response, next: NextFunction){
        try {
            const postID = req.params.postID;
            if(!postID) throw createHttpError(400, "No post ID provided");
            let comments = await this.postsService.getComments(postID);
            return res.status(200).json({ success: true, message: null, data: { comments }});
        } catch (error) {
            next(error);
        }
    }
}

export default PostController;
