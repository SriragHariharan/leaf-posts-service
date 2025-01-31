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
}

export default PostController;
