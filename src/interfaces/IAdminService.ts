import { Post, PostReport } from "./post.interface";

export interface IAdminService {
    getReportedPosts(): Promise<PostReport[] | null>;
    getPostDetails(postID: string): Promise<Post | null>;
    updatePostReportStatus(postID: string, status: string): Promise<PostReport | null>;
    deletePost(postID: string): Promise<boolean>;
    getReportsByPostID(postID: string): Promise<PostReport[] | null>
    updateSingleReportStatus(reportID: string, status: string): Promise<boolean>
    updateReportStatusByPostID(postID: string, status: string): Promise<boolean>
    getPostsCount(): Promise<{ total: number; thisMonth: number; }>
    getTodaysPostReports(): Promise<PostReport[] | null>
}