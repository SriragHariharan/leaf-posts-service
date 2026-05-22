import createHttpError from "http-errors";
import { IAdminRepository } from "../interfaces/IAdminRepository";
import { Post, PostReport } from "../interfaces/post.interface";
import prisma from "../helpers/prisma";
class AdminRepository implements IAdminRepository {
  // Get all reported posts with status "pending"
  async getReportedPosts(): Promise<PostReport[] | null> {
    try {
      const reportedPosts = await prisma.postReport.findMany({
        where: {
          status: "pending",
        },
        distinct: ["postID"],
        include: {
          post: true,
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      return reportedPosts;
    } catch (error) {
      if (error instanceof Error) {
        throw createHttpError(error.message);
      } else {
        throw createHttpError("Something went wrong");
      }
    }
  }

  // Get details of a specific post by postID
  async getPostDetails(postID: string): Promise<Post | null> {
    try {
      const postDetails = await prisma.post.findUnique({
        where: {
          id: postID,
        },
        include: {
          user: true,
        },
      });
      return postDetails;
    } catch (error) {
      if (error instanceof Error) {
        throw createHttpError(error.message);
      } else {
        throw createHttpError("Something went wrong");
      }
    }
  }

  // Update the status of a post report
  async updatePostReportStatus(
    postID: string,
    status: "pending" | "rejected" | "resolved",
  ): Promise<PostReport | null> {
    try {
      // First, find the post report by postID
      const postReport = await prisma.postReport.findFirst({
        where: {
          postID: postID,
        },
      });

      // If no report is found, throw an error
      if (!postReport) {
        throw createHttpError(404, "Post report not found");
      }

      // Now update the post report using its id
      const updatedPostReport = await prisma.postReport.update({
        where: {
          id: postReport.id, // Use the id of the found post report
        },
        data: {
          status: status,
        },
      });
      return updatedPostReport;
    } catch (error) {
      if (error instanceof Error) {
        throw createHttpError(error.message);
      } else {
        throw createHttpError("Something went wrong");
      }
    }
  }

  // Soft delete a post and update its reports to "resolved"
  async deletePost(postID: string): Promise<boolean> {
    try {
      await prisma.post.update({
        where: {
          id: postID,
        },
        data: {
          isDeleted: true,
        },
      });

      await prisma.postReport.updateMany({
        where: {
          postID: postID,
        },
        data: {
          status: "resolved",
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw createHttpError(error.message);
      } else {
        throw createHttpError("Something went wrong");
      }
    }
  }

  // Get all reports for a specific post by postID
  async getReportsByPostID(postID: string): Promise<PostReport[] | null> {
    try {
      const reports = await prisma.postReport.findMany({
        where: {
          postID: postID,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return reports;
    } catch (error) {
      if (error instanceof Error) {
        throw createHttpError(error.message);
      } else {
        throw createHttpError("Something went wrong");
      }
    }
  }

  // Update the status of a single report by reportID
  async updateSingleReportStatus(
    reportID: string,
    status: "pending" | "rejected" | "resolved",
  ): Promise<boolean> {
    try {
      await prisma.postReport.update({
        where: {
          id: Number(reportID),
        },
        data: {
          status: status,
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw createHttpError(error.message);
      } else {
        throw createHttpError("Something went wrong");
      }
    }
  }

  // Update the status of all reports for a specific post by postID
  async updateReportStatusByPostID(
    postID: string,
    status: "pending" | "rejected" | "resolved",
  ): Promise<boolean> {
    try {
      await prisma.postReport.updateMany({
        where: {
          postID: postID,
        },
        data: {
          status: "rejected",
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw createHttpError(error.message);
      } else {
        throw createHttpError("Something went wrong");
      }
    }
  }

  // Get the total number of posts and posts added this month
  async getPostsCount(): Promise<{ total: number; thisMonth: number }> {
    try {
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
      return { total: totalPosts, thisMonth: thisMonthPosts };
    } catch (error) {
      throw createHttpError(500, "Something went wrong");
    }
  }

  // Get today's post reports with status "pending"
  async getTodaysPostReports(): Promise<PostReport[] | null> {
    try {
      const now = new Date();

      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      const reports = await prisma.postReport.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
          },
          status: "pending",
        },
        include: {
          post: true,
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      return reports;
    } catch (error) {
      if (error instanceof Error) {
        throw createHttpError(error.message);
      } else {
        throw createHttpError("Something went wrong");
      }
    }
  }
}

export default AdminRepository;
