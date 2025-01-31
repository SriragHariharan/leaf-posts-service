import { Router, Request, Response, NextFunction } from "express";
import upload from "../helpers/multer.helper";
import PostController from "../controllers/post.controller";
import { validateAccessToken } from "../helpers/jwt.helper";
import PostsRepository from "../repositories/posts.repository";
import PostsService from "../services/posts.service";
import ElasticSearchRepository from "../repositories/elastic.repository";

const postsRouter = Router();

/* dependency injection */
const postsRepository = new PostsRepository();
const esRepository = new ElasticSearchRepository();
const postsService = new PostsService(postsRepository, esRepository);
const postsController = new PostController(postsService);

postsRouter.post("/",  validateAccessToken, upload.single("picture"), (req: Request, res: Response, next: NextFunction) => {
    postsController.createPost(req, res, next)
});

/* save post */
postsRouter.post("/save/:postID",  validateAccessToken, upload.single("picture"), (req: Request, res: Response, next: NextFunction) => {
    postsController.savePost(req, res, next)
});

/* unsave post */
postsRouter.delete("/save/:postID",  validateAccessToken, upload.single("picture"), (req: Request, res: Response, next: NextFunction) => {
    postsController.unsavePost(req, res, next)
});

/* view saved posts */
postsRouter.get("/save",  validateAccessToken, upload.single("picture"), (req: Request, res: Response, next: NextFunction) => {
    postsController.getSavedPostsByUser(req, res, next)
});

/* like or unlike a post(single route) */
postsRouter.post("/like/:postID",  validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    postsController.toggleLike(req, res, next);
})

/* add comment to a post */
postsRouter.post("/comment/:postID",  validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    postsController.addComments(req, res, next);
})

/* get all comments for a post */
postsRouter.get("/comment/:postID",  validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    postsController.getComments(req, res, next);
})

export default postsRouter;