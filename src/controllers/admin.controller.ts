import createHttpError from "http-errors";
import { Request, Response, NextFunction } from "express";
import { IAdminService } from "../interfaces/IAdminService";
class AdminController {
    private adminService: IAdminService;


    constructor(adminService: IAdminService) {

        this.adminService = adminService;
    }

    /* Get all reported posts with status "pending" */
    async getReportedPosts(req: Request, res: Response, next: NextFunction) {
        try {

            const reportedPosts = await this.adminService.getReportedPosts();
            return res.status(200).json({
                success: true,
                message: "Reported posts fetched successfully",
                data: { posts: reportedPosts },
            });
        }
 catch (error) {

            if (error instanceof createHttpError) {
                next(error);
            }
 else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    /* Get details of a specific post by postID */
    async getPostDetails(req: Request, res: Response, next: NextFunction) {
        try {

            const { postID } = req.params;

            if (!postID) {
                throw createHttpError(404, "Post not found");
            }            const postDetails = await this.adminService.getPostDetails(postID);
            return res.status(200).json({
                success: true,
                message: "Post details fetched successfully",
                data: { post: postDetails },
            });
        }
 catch (error) {

            if (error instanceof createHttpError) {
                next(error);
            }
 else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    /* Update the status of a post report */
    async updatePostStatus(req: Request, res: Response, next: NextFunction) {
        try {

            const { postID } = req.params;

            const { status } = req.body;

            if (!postID || !status) {
                throw createHttpError(404, "Post not found");
            }            await this.adminService.updatePostReportStatus(postID, status);
            return res.status(200).json({ success: true, message: "Post status updated successfully", data: null });
        }
 catch (error) {

            if (error instanceof createHttpError) {
                next(error);
            }
 else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    /* Soft delete a post */
    async deletePost(req: Request, res: Response, next: NextFunction) {
        try {

            const { postID } = req.params;

            if (!postID) {
                throw createHttpError(404, "Post not found");
            }            await this.adminService.deletePost(postID);
            return res.status(200).json({ success: true, message: "Post deleted successfully", data: null });
        }
 catch (error) {

            if (error instanceof createHttpError) {
                next(error);
            }
 else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    /* Get all reports for a specific post by postID */
    async getReportsByPostID(req: Request, res: Response, next: NextFunction) {
        try {

            const { postID } = req.params;

            if (!postID) {
                throw createHttpError(404, "Post not found");
            }            const reports = await this.adminService.getReportsByPostID(postID);
            return res.status(200).json({ success: true, message: "Reports fetched successfully", data: { reports } });
        }
 catch (error) {

            if (error instanceof createHttpError) {
                next(error);
            }
 else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    /* Update the status of a single report by reportID */
    async updateSingleReportStatus(req: Request, res: Response, next: NextFunction) {
        try {

            const { reportID } = req.params;

            const { status } = req.body;

            if (!reportID || !status) {
                throw createHttpError(404, "Report not found");
            }            await this.adminService.updateSingleReportStatus(reportID, status);
            return res.status(200).json({ success: true, message: "Report status updated successfully", data: null });
        }
 catch (error) {

            if (error instanceof createHttpError) {
                next(error);
            }
 else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    /* Update the status of all reports for a specific post by postID */
    async updateReportStatusByPostID(req: Request, res: Response, next: NextFunction) {
        try {

            const { postID } = req.params;

            const { status } = req.body;

            if (!postID || !status) {
                throw createHttpError(404, "Post not found");
            }            await this.adminService.updateReportStatusByPostID(postID, status);
            return res.status(200).json({ success: true, message: "Report status updated successfully", data: null });
        }
 catch (error) {

            if (error instanceof createHttpError) {
                next(error);
            }
 else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    /* Get the count of all posts and posts created in the current month */
    async getPostsCount(req: Request, res: Response, next: NextFunction) {
        try {

            const count = await this.adminService.getPostsCount();
            return res.status(200).json({ success: true, message: "Posts count fetched successfully", data: { count } });
        }
 catch (error) {

            if (error instanceof createHttpError) {
                next(error);
            }
 else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }

    /* Get today's post reports with status "pending" */
    async getTodaysPostReports(req: Request, res: Response, next: NextFunction) {
        try {

            const reports = await this.adminService.getTodaysPostReports();
            return res.status(200).json({ success: true, message: "Todays post reports fetched successfully", data: { reports } });
        }
 catch (error) {

            if (error instanceof createHttpError) {
                next(error);
            }
 else {
                next(createHttpError(500, "An unexpected error occurred"));
            }
        }
    }
}

export default AdminController;