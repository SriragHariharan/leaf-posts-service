import createHttpError from "http-errors";
import { IAdminRepository } from "../interfaces/IAdminRepository";
import { Post, PostReport } from "../interfaces/post.interface";
import prisma from "../helpers/prisma";
import logger from "../helpers/logger";

class AdminRepository implements IAdminRepository {

    // Get all reported posts with status "pending"
    async getReportedPosts(): Promise<PostReport[] | null> {
        logger.debug(`Entering getReportedPosts method.`, { method: "getReportedPosts", layer: "repository" });
        try {
            logger.info(`Fetching reported posts with status "pending".`, { layer: "repository" });

            const reportedPosts = await prisma.postReport.findMany({
                where: {
                    status: "pending"
                },
                distinct: ["postID"],
                include: {
                    post: true,
                    user: true
                },
                orderBy: {
                    createdAt: "asc"
                }
            });

            logger.info(`Successfully fetched reported posts.`, { layer: "repository" });
            return reportedPosts;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in getReportedPosts: ${error.message}`, { error, layer: "repository" });
                throw createHttpError(error.message);
            } else {
                logger.error(`Unexpected error in getReportedPosts.`, { error, layer: "repository" });
                throw createHttpError("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting getReportedPosts method.`, { method: "getReportedPosts", layer: "repository" });
        }
    }

    // Get details of a specific post by postID
    async getPostDetails(postID: string): Promise<Post | null> {
        logger.debug(`Entering getPostDetails method. Param: ${postID}`, { method: "getPostDetails", layer: "repository" });
        try {
            logger.info(`Fetching post details for postID: ${postID}.`, { layer: "repository" });

            const postDetails = await prisma.post.findUnique({
                where: {
                    id: postID
                },
                include: {
                    user: true
                }
            });

            logger.info(`Successfully fetched post details for postID: ${postID}.`, { layer: "repository" });
            return postDetails;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in getPostDetails: ${error.message}`, { error, layer: "repository" });
                throw createHttpError(error.message);
            } else {
                logger.error(`Unexpected error in getPostDetails.`, { error, layer: "repository" });
                throw createHttpError("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting getPostDetails method. Param: ${postID}`, { method: "getPostDetails", layer: "repository" });
        }
    }

    // Update the status of a post report
    async updatePostReportStatus(postID: string, status: string): Promise<PostReport | null> {
        logger.debug(`Entering updatePostReportStatus method. Params: postID=${postID}, status=${status}`, { method: "updatePostReportStatus", layer: "repository" });
        try {
            logger.info(`Updating post report status for postID: ${postID} to ${status}.`, { layer: "repository" });

            const updatedPostReport = await prisma.postReport.update({
                where: {
                    postID: postID
                },
                data: {
                    status: status
                }
            });

            logger.info(`Successfully updated post report status for postID: ${postID}.`, { layer: "repository" });
            return updatedPostReport;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in updatePostReportStatus: ${error.message}`, { error, layer: "repository" });
                throw createHttpError(error.message);
            } else {
                logger.error(`Unexpected error in updatePostReportStatus.`, { error, layer: "repository" });
                throw createHttpError("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting updatePostReportStatus method. Params: postID=${postID}, status=${status}`, { method: "updatePostReportStatus", layer: "repository" });
        }
    }

    // Soft delete a post and update its reports to "resolved"
    async deletePost(postID: string): Promise<boolean> {
        logger.debug(`Entering deletePost method. Param: ${postID}`, { method: "deletePost", layer: "repository" });
        try {
            logger.info(`Soft deleting post with postID: ${postID}.`, { layer: "repository" });

            await prisma.post.update({
                where: {
                    id: postID
                },
                data: {
                    isDeleted: true
                }
            });

            await prisma.postReport.updateMany({
                where: {
                    postID: postID
                },
                data: {
                    status: "resolved"
                }
            });

            logger.info(`Successfully soft deleted post with postID: ${postID}.`, { layer: "repository" });
            return true;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in deletePost: ${error.message}`, { error, layer: "repository" });
                throw createHttpError(error.message);
            } else {
                logger.error(`Unexpected error in deletePost.`, { error, layer: "repository" });
                throw createHttpError("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting deletePost method. Param: ${postID}`, { method: "deletePost", layer: "repository" });
        }
    }

    // Get all reports for a specific post by postID
    async getReportsByPostID(postID: string): Promise<PostReport[] | null> {
        logger.debug(`Entering getReportsByPostID method. Param: ${postID}`, { method: "getReportsByPostID", layer: "repository" });
        try {
            logger.info(`Fetching reports for postID: ${postID}.`, { layer: "repository" });

            const reports = await prisma.postReport.findMany({
                where: {
                    postID: postID
                },
                include: {
                    user: true
                },
                orderBy: {
                    createdAt: "desc"
                }
            });

            logger.info(`Successfully fetched reports for postID: ${postID}.`, { layer: "repository" });
            return reports;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in getReportsByPostID: ${error.message}`, { error, layer: "repository" });
                throw createHttpError(error.message);
            } else {
                logger.error(`Unexpected error in getReportsByPostID.`, { error, layer: "repository" });
                throw createHttpError("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting getReportsByPostID method. Param: ${postID}`, { method: "getReportsByPostID", layer: "repository" });
        }
    }

    // Update the status of a single report by reportID
    async updateSingleReportStatus(reportID: string, status: string): Promise<boolean> {
        logger.debug(`Entering updateSingleReportStatus method. Params: reportID=${reportID}, status=${status}`, { method: "updateSingleReportStatus", layer: "repository" });
        try {
            logger.info(`Updating report status for reportID: ${reportID} to ${status}.`, { layer: "repository" });

            await prisma.postReport.update({
                where: {
                    id: Number(reportID)
                },
                data: {
                    status: status
                }
            });

            logger.info(`Successfully updated report status for reportID: ${reportID}.`, { layer: "repository" });
            return true;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in updateSingleReportStatus: ${error.message}`, { error, layer: "repository" });
                throw createHttpError(error.message);
            } else {
                logger.error(`Unexpected error in updateSingleReportStatus.`, { error, layer: "repository" });
                throw createHttpError("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting updateSingleReportStatus method. Params: reportID=${reportID}, status=${status}`, { method: "updateSingleReportStatus", layer: "repository" });
        }
    }

    // Update the status of all reports for a specific post by postID
    async updateReportStatusByPostID(postID: string, status: string): Promise<boolean> {
        logger.debug(`Entering updateReportStatusByPostID method. Params: postID=${postID}, status=${status}`, { method: "updateReportStatusByPostID", layer: "repository" });
        try {
            logger.info(`Updating report status for all reports of postID: ${postID} to ${status}.`, { layer: "repository" });

            await prisma.postReport.updateMany({
                where: {
                    postID: postID
                },
                data: {
                    status: "rejected"
                }
            });

            logger.info(`Successfully updated report status for all reports of postID: ${postID}.`, { layer: "repository" });
            return true;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in updateReportStatusByPostID: ${error.message}`, { error, layer: "repository" });
                throw createHttpError(error.message);
            } else {
                logger.error(`Unexpected error in updateReportStatusByPostID.`, { error, layer: "repository" });
                throw createHttpError("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting updateReportStatusByPostID method. Params: postID=${postID}, status=${status}`, { method: "updateReportStatusByPostID", layer: "repository" });
        }
    }

    // Get the total number of posts and posts added this month
    async getPostsCount(): Promise<{ total: number; thisMonth: number; }> {
        logger.debug(`Entering getPostsCount method.`, { method: "getPostsCount", layer: "repository" });
        try {
            logger.info(`Fetching total posts and posts added this month.`, { layer: "repository" });

            const totalPosts = await prisma.post.count();
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const thisMonthPosts = await prisma.post.count({
                where: {
                    createdAt: {
                        gte: startOfMonth,
                    },
                },
            });

            logger.info(`Successfully fetched posts count.`, { layer: "repository" });
            return { total: totalPosts, thisMonth: thisMonthPosts };
        } catch (error) {
            logger.error(`Error in getPostsCount: ${error}`, { error, layer: "repository" });
            throw createHttpError(500, "Something went wrong");
        } finally {
            logger.debug(`Exiting getPostsCount method.`, { method: "getPostsCount", layer: "repository" });
        }
    }

    // Get today's post reports with status "pending"
    async getTodaysPostReports(): Promise<PostReport[] | null> {
        logger.debug(`Entering getTodaysPostReports method.`, { method: "getTodaysPostReports", layer: "repository" });
        try {
            logger.info(`Fetching today's post reports with status "pending".`, { layer: "repository" });

            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const reports = await prisma.postReport.findMany({
                where: {
                    createdAt: {
                        gte: startOfDay,
                    },
                    status: "pending"
                },
                include: {
                    post: true,
                    user: true
                },
                orderBy: {
                    createdAt: "asc"
                }
            });

            logger.info(`Successfully fetched today's post reports.`, { layer: "repository" });
            return reports;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in getTodaysPostReports: ${error.message}`, { error, layer: "repository" });
                throw createHttpError(error.message);
            } else {
                logger.error(`Unexpected error in getTodaysPostReports.`, { error, layer: "repository" });
                throw createHttpError("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting getTodaysPostReports method.`, { method: "getTodaysPostReports", layer: "repository" });
        }
    }
}

export default AdminRepository;