import { IAdminRepository } from "../interfaces/IAdminRepository";
import { IAdminService } from "../interfaces/IAdminService";
import { IDeleteElasticRepository } from "../interfaces/IDeleteElasticRepository";
import { Post, PostReport } from "../interfaces/post.interface";
import { sendPostDeletedEvent } from "../messaging/rabbitmq/post-events.producer";

class AdminService implements IAdminService{
    private adminRepository: IAdminRepository
    private elasticRepository: IDeleteElasticRepository
    constructor(adminRepository: IAdminRepository, elasticRepository: IDeleteElasticRepository){
        this.adminRepository = adminRepository;
        this.elasticRepository = elasticRepository;
    }

    //get all reported posts
    async getReportedPosts(): Promise<PostReport[] | null> {
        try {
            return await this.adminRepository.getReportedPosts();
        } catch (error) {
            if (error instanceof Error) {
                throw error
            } else {
                throw new Error("Something went wrong")
            }
        }
    }

    //get the details of a post
    async getPostDetails(postID: string): Promise<Post | null> {
        try {
            return await this.adminRepository.getPostDetails(postID);
        } catch (error) {
            if (error instanceof Error) {
                throw error
            } else {
                throw new Error("Something went wrong")
            }
        }
    }

    //update the post report status
    async updatePostReportStatus(postID: string, status: string): Promise<PostReport | null> {
        try {
            return await this.adminRepository.updatePostReportStatus(postID, status);
        } catch (error) {
            if (error instanceof Error) {
                throw error
            } else {
                throw new Error("Something went wrong")
            }
        }
    }

    //soft delete the post
    async deletePost(postID: string): Promise<boolean> {
        try {
            const deletedResponse = await this.adminRepository.deletePost(postID);
            
            //delete the post from elasticsearch
            this.elasticRepository.deletePost(postID);

            //emit an event to delete post from feeds service
            sendPostDeletedEvent(postID);

            return deletedResponse;
        } catch (error) {
            if (error instanceof Error) {
                throw error
            } else {
                throw new Error("Something went wrong")
            }
        }
    }

    //get all reports of a specific post
    async getReportsByPostID(postID: string): Promise<PostReport[] | null> {
        try {
            return await this.adminRepository.getReportsByPostID(postID);
        } catch (error) {
            if (error instanceof Error) {
                throw error
            } else {
                throw new Error("Something went wrong")
            }
        }
    }

    //update the status of a single report
    async updateSingleReportStatus(reportID: string, status: string): Promise<boolean> {
        try {
            return await this.adminRepository.updateSingleReportStatus(reportID, status);
        } catch (error) {
            if (error instanceof Error) {
                throw error
            } else {
                throw new Error("Something went wrong")
            }
        }
    }

    //update the status of all reports of a post
    async updateReportStatusByPostID(postID: string, status: string): Promise<boolean> {
        try {
            return await this.adminRepository.updateReportStatusByPostID(postID, status);
        } catch (error) {
            if (error instanceof Error) {
                throw error
            } else {
                throw new Error("Something went wrong")
            }
        }
    }

    //get the count of all posts and posts created in current month
    async getPostsCount(): Promise<{ total: number; thisMonth: number; }> {
        try {
            return await this.adminRepository.getPostsCount();
        } catch (error) {
            if (error instanceof Error) {
                throw error
            } else {
                throw new Error("Something went wrong")
            }
        }
    }

    //get todays post reports
    async getTodaysPostReports(): Promise<PostReport[] | null> {
        try {
            return await this.adminRepository.getTodaysPostReports();
        } catch (error) {
            if (error instanceof Error) {
                throw error
            } else {
                throw new Error("Something went wrong")
            }
        }
    }

}

export default AdminService;