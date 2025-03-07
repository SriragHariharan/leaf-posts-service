import createHttpError from "http-errors";
import { IAdminRepository } from "../interfaces/IAdminRepository";
import { Post, PostReport } from "../interfaces/post.interface";
import prisma from "../helpers/prisma";

class AdminRepository implements IAdminRepository {

    //get all the posts that are reported
    async getReportedPosts(): Promise<PostReport[] | null> {
        try {
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
                    createdAt: "asc" // Optional: Fetch the oldest report per post
                }
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


    //get the post details
    async getPostDetails(postID: string): Promise<Post | null> {
        try {
            const postDetails = await prisma.post.findUnique({
                where: {
                    id: postID
                },
                include: {
                    user: true
                }
            });
            return postDetails;
        } catch (error) {
            if (error instanceof Error) {
                throw createHttpError(error.message)
            } else {
                throw createHttpError("Something went wrong")
            }
        }
    }

    //update the post report status
    async updatePostReportStatus(postID: string, status: string): Promise<PostReport | null> {
        try {
            const updatedPostReport = await prisma.postReport.update({
                where: {
                    postID: postID
                },
                data: {
                    status: status
                }
            });
            return updatedPostReport;
        } catch (error) {
            if (error instanceof Error) {
                throw createHttpError(error.message)
            } else {
                throw createHttpError("Something went wrong")
            }
        }
    }

    //soft delete the post
    async deletePost(postID: string): Promise<boolean> {
        try {
            await prisma.post.update({
                where: {
                    id: postID
                },
                data: {
                    isDeleted: true
                }
            });

            //update the status of pending posts to be resolved
            await prisma.postReport.updateMany({
                where: {
                    postID: postID
                },
                data: {
                    status: "resolved"
                }
            })
            return true;
        } catch (error) {
            if (error instanceof Error) {
                throw createHttpError(error.message)
            } else {
                throw createHttpError("Something went wrong")
            }
        }
    }

    //get all reports of a specific post
    async getReportsByPostID(postID: string): Promise<PostReport[] | null> {
        try {
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
            return reports;
        } catch (error) {
            if (error instanceof Error) {
                throw createHttpError(error.message)
            } else {
                throw createHttpError("Something went wrong")
            }
        }
    }

    //update status of a single report
    async updateSingleReportStatus(reportID: string, status: string): Promise<boolean> {
        try {
            await prisma.postReport.update({
                where: {
                    id: Number(reportID)
                },
                data: {
                    status: status
                }
            });
            return true;
        } catch (error) {
            if (error instanceof Error) {
                throw createHttpError(error.message)
            } else {
                throw createHttpError("Something went wrong")
            }   
        }
    }

    //update the status of all reports of a post
    async updateReportStatusByPostID(postID: string, status: string): Promise<boolean> {
        try {
            await prisma.postReport.updateMany({
                where: {
                    postID: postID
                },
                data: {
                    status: "rejected"
                }
            });
            return true;
        } catch (error) {
            if (error instanceof Error) {
                throw createHttpError(error.message)
            } else {
                throw createHttpError("Something went wrong")
            }   
        }
    }

    //get the total number of posts and posts added this month
    async getPostsCount(): Promise<{ total: number; thisMonth: number; }> {
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

    //get todays post reports
    async getTodaysPostReports(): Promise<PostReport[] | null> {
        try {
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
            return reports;
        } catch (error) {
            if (error instanceof Error) {
                throw createHttpError(error.message)
            } else {
                throw createHttpError("Something went wrong")
            }
        }
    }
}

export default AdminRepository;