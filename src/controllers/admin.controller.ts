import createHttpError from "http-errors";
import { Request, Response, NextFunction } from "express";
import { IAdminService } from "../interfaces/IAdminService";
import logger from "../helpers/logger";

class AdminController {
    private adminService: IAdminService;

    constructor(adminService: IAdminService) {
        this.adminService = adminService;
    }

    /* Get all reported posts with status "pending" */
    async getReportedPosts(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getReportedPosts method.`, { method: "getReportedPosts", layer: "controller" });
        try {
            logger.info(`Fetching all reported posts.`, { layer: "controller" });

            const reportedPosts = await this.adminService.getReportedPosts();

            logger.info(`Successfully fetched all reported posts.`, { layer: "controller" });
            return res.status(200).json({
                success: true,
                message: "Reported posts fetched successfully",
                data: { posts: reportedPosts },
            });
        } catch (error) {
            if (error instanceof createHttpError) {
                logger.error(`HttpError in getReportedPosts: ${error}`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in getReportedPosts.`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting getReportedPosts method.`, { method: "getReportedPosts", layer: "controller" });
        }
    }

    /* Get details of a specific post by postID */
    async getPostDetails(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getPostDetails method. Param: postID=${req.params.postID}`, { method: "getPostDetails", layer: "controller" });
        try {
            const { postID } = req.params;
            if (!postID) {
                logger.error(`Post not found. PostID: ${postID}`, { layer: "controller" });
                throw createHttpError(404, "Post not found");
            }

            logger.info(`Fetching details for post. PostID: ${postID}`, { layer: "controller" });
            const postDetails = await this.adminService.getPostDetails(postID);

            logger.info(`Successfully fetched details for post. PostID: ${postID}`, { layer: "controller" });
            return res.status(200).json({
                success: true,
                message: "Post details fetched successfully",
                data: { post: postDetails },
            });
        } catch (error) {
            if (error instanceof createHttpError) {
                logger.error(`HttpError in getPostDetails: ${error}`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in getPostDetails.`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting getPostDetails method. Param: postID=${req.params.postID}`, { method: "getPostDetails", layer: "controller" });
        }
    }

    /* Update the status of a post report */
    async updatePostStatus(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering updatePostStatus method. Params: postID=${req.params.postID}, status=${req.body.status}`, { method: "updatePostStatus", layer: "controller" });
        try {
            const { postID } = req.params;
            const { status } = req.body;
            if (!postID || !status) {
                logger.error(`Post not found. PostID: ${postID}`, { layer: "controller" });
                throw createHttpError(404, "Post not found");
            }

            logger.info(`Updating post status. PostID: ${postID}, Status: ${status}`, { layer: "controller" });
            await this.adminService.updatePostReportStatus(postID, status);

            logger.info(`Successfully updated post status. PostID: ${postID}, Status: ${status}`, { layer: "controller" });
            return res.status(200).json({ success: true, message: "Post status updated successfully", data: null });
        } catch (error) {
            if (error instanceof createHttpError) {
                logger.error(`HttpError in updatePostStatus: ${error}`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in updatePostStatus.`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting updatePostStatus method. Params: postID=${req.params.postID}, status=${req.body.status}`, { method: "updatePostStatus", layer: "controller" });
        }
    }

    /* Soft delete a post */
    async deletePost(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering deletePost method. Param: postID=${req.params.postID}`, { method: "deletePost", layer: "controller" });
        try {
            const { postID } = req.params;
            if (!postID) {
                logger.error(`Post not found. PostID: ${postID}`, { layer: "controller" });
                throw createHttpError(404, "Post not found");
            }

            logger.info(`Soft deleting post. PostID: ${postID}`, { layer: "controller" });
            await this.adminService.deletePost(postID);

            logger.info(`Successfully soft deleted post. PostID: ${postID}`, { layer: "controller" });
            return res.status(200).json({ success: true, message: "Post deleted successfully", data: null });
        } catch (error) {
            if (error instanceof createHttpError) {
                logger.error(`HttpError in deletePost: ${error}`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in deletePost.`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting deletePost method. Param: postID=${req.params.postID}`, { method: "deletePost", layer: "controller" });
        }
    }

    /* Get all reports for a specific post by postID */
    async getReportsByPostID(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getReportsByPostID method. Param: postID=${req.params.postID}`, { method: "getReportsByPostID", layer: "controller" });
        try {
            const { postID } = req.params;
            if (!postID) {
                logger.error(`Post not found. PostID: ${postID}`, { layer: "controller" });
                throw createHttpError(404, "Post not found");
            }

            logger.info(`Fetching reports for post. PostID: ${postID}`, { layer: "controller" });
            const reports = await this.adminService.getReportsByPostID(postID);

            logger.info(`Successfully fetched reports for post. PostID: ${postID}`, { layer: "controller" });
            return res.status(200).json({ success: true, message: "Reports fetched successfully", data: { reports } });
        } catch (error) {
            if (error instanceof createHttpError) {
                logger.error(`HttpError in getReportsByPostID: ${error}`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in getReportsByPostID.`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting getReportsByPostID method. Param: postID=${req.params.postID}`, { method: "getReportsByPostID", layer: "controller" });
        }
    }

    /* Update the status of a single report by reportID */
    async updateSingleReportStatus(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering updateSingleReportStatus method. Params: reportID=${req.params.reportID}, status=${req.body.status}`, { method: "updateSingleReportStatus", layer: "controller" });
        try {
            const { reportID } = req.params;
            const { status } = req.body;
            if (!reportID || !status) {
                logger.error(`Report not found. ReportID: ${reportID}`, { layer: "controller" });
                throw createHttpError(404, "Report not found");
            }

            logger.info(`Updating single report status. ReportID: ${reportID}, Status: ${status}`, { layer: "controller" });
            await this.adminService.updateSingleReportStatus(reportID, status);

            logger.info(`Successfully updated single report status. ReportID: ${reportID}, Status: ${status}`, { layer: "controller" });
            return res.status(200).json({ success: true, message: "Report status updated successfully", data: null });
        } catch (error) {
            if (error instanceof createHttpError) {
                logger.error(`HttpError in updateSingleReportStatus: ${error}`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in updateSingleReportStatus.`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting updateSingleReportStatus method. Params: reportID=${req.params.reportID}, status=${req.body.status}`, { method: "updateSingleReportStatus", layer: "controller" });
        }
    }

    /* Update the status of all reports for a specific post by postID */
    async updateReportStatusByPostID(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering updateReportStatusByPostID method. Params: postID=${req.params.postID}, status=${req.body.status}`, { method: "updateReportStatusByPostID", layer: "controller" });
        try {
            const { postID } = req.params;
            const { status } = req.body;
            if (!postID || !status) {
                logger.error(`Post not found. PostID: ${postID}`, { layer: "controller" });
                throw createHttpError(404, "Post not found");
            }

            logger.info(`Updating report status for all reports of post. PostID: ${postID}, Status: ${status}`, { layer: "controller" });
            await this.adminService.updateReportStatusByPostID(postID, status);

            logger.info(`Successfully updated report status for all reports of post. PostID: ${postID}, Status: ${status}`, { layer: "controller" });
            return res.status(200).json({ success: true, message: "Report status updated successfully", data: null });
        } catch (error) {
            if (error instanceof createHttpError) {
                logger.error(`HttpError in updateReportStatusByPostID: ${error}`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in updateReportStatusByPostID.`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting updateReportStatusByPostID method. Params: postID=${req.params.postID}, status=${req.body.status}`, { method: "updateReportStatusByPostID", layer: "controller" });
        }
    }

    /* Get the count of all posts and posts created in the current month */
    async getPostsCount(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getPostsCount method.`, { method: "getPostsCount", layer: "controller" });
        try {
            logger.info(`Fetching posts count.`, { layer: "controller" });

            const count = await this.adminService.getPostsCount();

            logger.info(`Successfully fetched posts count.`, { layer: "controller" });
            return res.status(200).json({ success: true, message: "Posts count fetched successfully", data: { count } });
        } catch (error) {
            if (error instanceof createHttpError) {
                logger.error(`HttpError in getPostsCount: ${error}`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in getPostsCount.`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting getPostsCount method.`, { method: "getPostsCount", layer: "controller" });
        }
    }

    /* Get today's post reports with status "pending" */
    async getTodaysPostReports(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getTodaysPostReports method.`, { method: "getTodaysPostReports", layer: "controller" });
        try {
            logger.info(`Fetching today's post reports.`, { layer: "controller" });

            const reports = await this.adminService.getTodaysPostReports();

            logger.info(`Successfully fetched today's post reports.`, { layer: "controller" });
            return res.status(200).json({ success: true, message: "Todays post reports fetched successfully", data: { reports } });
        } catch (error) {
            if (error instanceof createHttpError) {
                logger.error(`HttpError in getTodaysPostReports: ${error}`, { error, layer: "controller" });
                next(error);
            } else {
                logger.error(`Unexpected error in getTodaysPostReports.`, { error, layer: "controller" });
                next(createHttpError(500, "An unexpected error occurred"));
            }
        } finally {
            logger.debug(`Exiting getTodaysPostReports method.`, { method: "getTodaysPostReports", layer: "controller" });
        }
    }
}

export default AdminController;