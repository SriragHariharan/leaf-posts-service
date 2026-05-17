import logger from "../helpers/logger";
import { IAdminRepository } from "../interfaces/IAdminRepository";
import { IAdminService } from "../interfaces/IAdminService";
import { IDeleteElasticRepository } from "../interfaces/IDeleteElasticRepository";
import { Post, PostReport } from "../interfaces/post.interface";
import { sendPostDeletedEvent } from "../messaging/kafka/post-events.producer";

class AdminService implements IAdminService {
    private adminRepository: IAdminRepository;
    private elasticRepository: IDeleteElasticRepository;

    constructor(adminRepository: IAdminRepository, elasticRepository: IDeleteElasticRepository) {
        this.adminRepository = adminRepository;
        this.elasticRepository = elasticRepository;
    }

    /* Get all reported posts with status "pending" */
    async getReportedPosts(): Promise<PostReport[] | null> {
        logger.debug(`Entering getReportedPosts method.`, { method: "getReportedPosts", layer: "service" });
        try {
            logger.info(`Fetching all reported posts.`, { layer: "service" });

            const reportedPosts = await this.adminRepository.getReportedPosts();

            logger.info(`Successfully fetched all reported posts.`, { layer: "service" });
            return reportedPosts;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in getReportedPosts: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getReportedPosts.`, { error, layer: "service" });
                throw new Error("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting getReportedPosts method.`, { method: "getReportedPosts", layer: "service" });
        }
    }

    /* Get details of a specific post by postID */
    async getPostDetails(postID: string): Promise<Post | null> {
        logger.debug(`Entering getPostDetails method. Param: postID=${postID}`, { method: "getPostDetails", layer: "service" });
        try {
            logger.info(`Fetching details for post. PostID: ${postID}`, { layer: "service" });

            const postDetails = await this.adminRepository.getPostDetails(postID);

            logger.info(`Successfully fetched details for post. PostID: ${postID}`, { layer: "service" });
            return postDetails;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in getPostDetails: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getPostDetails.`, { error, layer: "service" });
                throw new Error("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting getPostDetails method. Param: postID=${postID}`, { method: "getPostDetails", layer: "service" });
        }
    }

    /* Update the status of a post report */
    async updatePostReportStatus(postID: string, status: string): Promise<PostReport | null> {
        logger.debug(`Entering updatePostReportStatus method. Params: postID=${postID}, status=${status}`, { method: "updatePostReportStatus", layer: "service" });
        try {
            logger.info(`Updating post report status. PostID: ${postID}, Status: ${status}`, { layer: "service" });

            const updatedPostReport = await this.adminRepository.updatePostReportStatus(postID, status);

            logger.info(`Successfully updated post report status. PostID: ${postID}, Status: ${status}`, { layer: "service" });
            return updatedPostReport;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in updatePostReportStatus: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in updatePostReportStatus.`, { error, layer: "service" });
                throw new Error("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting updatePostReportStatus method. Params: postID=${postID}, status=${status}`, { method: "updatePostReportStatus", layer: "service" });
        }
    }

    /* Soft delete a post and delete it from Elasticsearch */
    async deletePost(postID: string): Promise<boolean> {
        logger.debug(`Entering deletePost method. Param: postID=${postID}`, { method: "deletePost", layer: "service" });
        try {
            logger.info(`Soft deleting post. PostID: ${postID}`, { layer: "service" });

            const deletedResponse = await this.adminRepository.deletePost(postID);

            // Delete the post from Elasticsearch
            logger.info(`Deleting post from Elasticsearch. PostID: ${postID}`, { layer: "service" });
            this.elasticRepository.deletePost(postID);

            // Emit an event to delete post from feeds service
            logger.info(`Emitting post deleted event. PostID: ${postID}`, { layer: "service" });
            sendPostDeletedEvent(postID);

            logger.info(`Successfully soft deleted post. PostID: ${postID}`, { layer: "service" });
            return deletedResponse;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in deletePost: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in deletePost.`, { error, layer: "service" });
                throw new Error("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting deletePost method. Param: postID=${postID}`, { method: "deletePost", layer: "service" });
        }
    }

    /* Get all reports for a specific post by postID */
    async getReportsByPostID(postID: string): Promise<PostReport[] | null> {
        logger.debug(`Entering getReportsByPostID method. Param: postID=${postID}`, { method: "getReportsByPostID", layer: "service" });
        try {
            logger.info(`Fetching reports for post. PostID: ${postID}`, { layer: "service" });

            const reports = await this.adminRepository.getReportsByPostID(postID);

            logger.info(`Successfully fetched reports for post. PostID: ${postID}`, { layer: "service" });
            return reports;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in getReportsByPostID: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getReportsByPostID.`, { error, layer: "service" });
                throw new Error("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting getReportsByPostID method. Param: postID=${postID}`, { method: "getReportsByPostID", layer: "service" });
        }
    }

    /* Update the status of a single report by reportID */
    async updateSingleReportStatus(reportID: string, status: string): Promise<boolean> {
        logger.debug(`Entering updateSingleReportStatus method. Params: reportID=${reportID}, status=${status}`, { method: "updateSingleReportStatus", layer: "service" });
        try {
            logger.info(`Updating single report status. ReportID: ${reportID}, Status: ${status}`, { layer: "service" });

            const result = await this.adminRepository.updateSingleReportStatus(reportID, status);

            logger.info(`Successfully updated single report status. ReportID: ${reportID}, Status: ${status}`, { layer: "service" });
            return result;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in updateSingleReportStatus: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in updateSingleReportStatus.`, { error, layer: "service" });
                throw new Error("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting updateSingleReportStatus method. Params: reportID=${reportID}, status=${status}`, { method: "updateSingleReportStatus", layer: "service" });
        }
    }

    /* Update the status of all reports for a specific post by postID */
    async updateReportStatusByPostID(postID: string, status: string): Promise<boolean> {
        logger.debug(`Entering updateReportStatusByPostID method. Params: postID=${postID}, status=${status}`, { method: "updateReportStatusByPostID", layer: "service" });
        try {
            logger.info(`Updating report status for all reports of post. PostID: ${postID}, Status: ${status}`, { layer: "service" });

            const result = await this.adminRepository.updateReportStatusByPostID(postID, status);

            logger.info(`Successfully updated report status for all reports of post. PostID: ${postID}, Status: ${status}`, { layer: "service" });
            return result;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in updateReportStatusByPostID: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in updateReportStatusByPostID.`, { error, layer: "service" });
                throw new Error("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting updateReportStatusByPostID method. Params: postID=${postID}, status=${status}`, { method: "updateReportStatusByPostID", layer: "service" });
        }
    }

    /* Get the count of all posts and posts created in the current month */
    async getPostsCount(): Promise<{ total: number; thisMonth: number; }> {
        logger.debug(`Entering getPostsCount method.`, { method: "getPostsCount", layer: "service" });
        try {
            logger.info(`Fetching posts count.`, { layer: "service" });

            const postsCount = await this.adminRepository.getPostsCount();

            logger.info(`Successfully fetched posts count.`, { layer: "service" });
            return postsCount;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in getPostsCount: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getPostsCount.`, { error, layer: "service" });
                throw new Error("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting getPostsCount method.`, { method: "getPostsCount", layer: "service" });
        }
    }

    /* Get today's post reports with status "pending" */
    async getTodaysPostReports(): Promise<PostReport[] | null> {
        logger.debug(`Entering getTodaysPostReports method.`, { method: "getTodaysPostReports", layer: "service" });
        try {
            logger.info(`Fetching today's post reports.`, { layer: "service" });

            const todaysReports = await this.adminRepository.getTodaysPostReports();

            logger.info(`Successfully fetched today's post reports.`, { layer: "service" });
            return todaysReports;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error in getTodaysPostReports: ${error.message}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getTodaysPostReports.`, { error, layer: "service" });
                throw new Error("Something went wrong");
            }
        } finally {
            logger.debug(`Exiting getTodaysPostReports method.`, { method: "getTodaysPostReports", layer: "service" });
        }
    }
}

export default AdminService;