import { Router, Request, Response, NextFunction } from "express";
import AdminRepository from "../repositories/admin.repository";
import AdminService from "../services/admin.service";
import AdminController from "../controllers/admin.controller";
import { validateAdminToken } from "../helpers/jwt.helper";
import ElasticSearchRepository from "../repositories/elastic.repository";

//DI
const adminRepository = new AdminRepository();
const elasticRepository = new ElasticSearchRepository();
const adminService = new AdminService(adminRepository, elasticRepository);
const adminController = new AdminController(adminService);

const adminRouter = Router();

//get reported posts
adminRouter.get("/reported", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.getReportedPosts(req, res, next);
})

//get post details
adminRouter.get("/post/:postID", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.getPostDetails(req, res, next);
})

//update post status
adminRouter.put("/post/:postID", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.updatePostStatus(req, res, next);
});

//soft delete post
adminRouter.delete("/post/:postID", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.deletePost(req, res, next);
});

//get all reports of a specific post
adminRouter.get("/post/:postID/reports", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.getReportsByPostID(req, res, next);
});

//update the status of a single report
adminRouter.put("/report/:reportID", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.updateSingleReportStatus(req, res, next);
});

//update the status of all reports of a post
adminRouter.put("/post/:postID/reports", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.updateReportStatusByPostID(req, res, next);
});

//get posts count
adminRouter.get("/count", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.getPostsCount(req, res, next);
});

//get todays post reports
adminRouter.get("/reports/today", validateAdminToken, (req: Request, res: Response, next: NextFunction) => {
    adminController.getTodaysPostReports(req, res, next);
});

export default adminRouter;