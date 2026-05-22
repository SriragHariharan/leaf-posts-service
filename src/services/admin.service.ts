import { IAdminRepository } from "../interfaces/IAdminRepository";
import { IAdminService } from "../interfaces/IAdminService";
import { IDeleteElasticRepository } from "../interfaces/IDeleteElasticRepository";
import { Post, PostReport } from "../interfaces/post.interface";
import { sendPostDeletedEvent } from "../messaging/kafka/post-events.producer";

class AdminService implements IAdminService {
  private adminRepository: IAdminRepository;

  private elasticRepository: IDeleteElasticRepository;

  constructor(
    adminRepository: IAdminRepository,
    elasticRepository: IDeleteElasticRepository,
  ) {
    this.adminRepository = adminRepository;

    this.elasticRepository = elasticRepository;
  }

  /* Get all reported posts with status "pending" */
  async getReportedPosts(): Promise<PostReport[] | null> {
    try {
      const reportedPosts = await this.adminRepository.getReportedPosts();
      return reportedPosts;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Something went wrong");
      }
    }
  }

  /* Get details of a specific post by postID */
  async getPostDetails(postID: string): Promise<Post | null> {
    try {
      const postDetails = await this.adminRepository.getPostDetails(postID);
      return postDetails;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Something went wrong");
      }
    }
  }

  /* Update the status of a post report */
  async updatePostReportStatus(
    postID: string,
    status: string,
  ): Promise<PostReport | null> {
    try {
      const updatedPostReport =
        await this.adminRepository.updatePostReportStatus(postID, status);
      return updatedPostReport;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Something went wrong");
      }
    }
  }

  /* Soft delete a post and delete it from Elasticsearch */
  async deletePost(postID: string): Promise<boolean> {
    try {
      const deletedResponse = await this.adminRepository.deletePost(postID);

      // Delete the post from Elasticsearch
      this.elasticRepository.deletePost(postID);

      // Emit an event to delete post from feeds service            sendPostDeletedEvent(postID);

      return deletedResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Something went wrong");
      }
    }
  }

  /* Get all reports for a specific post by postID */
  async getReportsByPostID(postID: string): Promise<PostReport[] | null> {
    try {
      const reports = await this.adminRepository.getReportsByPostID(postID);
      return reports;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Something went wrong");
      }
    }
  }

  /* Update the status of a single report by reportID */
  async updateSingleReportStatus(
    reportID: string,
    status: string,
  ): Promise<boolean> {
    try {
      const result = await this.adminRepository.updateSingleReportStatus(
        reportID,
        status,
      );
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Something went wrong");
      }
    }
  }

  /* Update the status of all reports for a specific post by postID */
  async updateReportStatusByPostID(
    postID: string,
    status: string,
  ): Promise<boolean> {
    try {
      const result = await this.adminRepository.updateReportStatusByPostID(
        postID,
        status,
      );
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Something went wrong");
      }
    }
  }

  /* Get the count of all posts and posts created in the current month */
  async getPostsCount(): Promise<{ total: number; thisMonth: number }> {
    try {
      const postsCount = await this.adminRepository.getPostsCount();
      return postsCount;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Something went wrong");
      }
    }
  }

  /* Get today's post reports with status "pending" */
  async getTodaysPostReports(): Promise<PostReport[] | null> {
    try {
      const todaysReports = await this.adminRepository.getTodaysPostReports();
      return todaysReports;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Something went wrong");
      }
    }
  }
}

export default AdminService;
