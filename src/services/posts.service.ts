import createHttpError from "http-errors";
import { uploadToS3 } from "../helpers/s3.helper";
import compressImage from "../helpers/sharp.helper";
import { IPostsRepository } from "../interfaces/IPostsRepository";
import { Post, ReportReason } from "../interfaces/post.interface";
import { IElasticRepository } from "../interfaces/IElasticRepository";
import { IPostService } from "../interfaces/IPostService";
import { PostComment } from "../interfaces/comment.interface";
import RedisHelper from "../helpers/redis";
import sendPostEvents from "../messaging/rabbitmq/post-events.producer";

class PostsService implements IPostService {

    private postsRepository: IPostsRepository;
    private esRepository: IElasticRepository;

    constructor(postsRepository: IPostsRepository, esRepository: IElasticRepository) {
        this.postsRepository = postsRepository;
        this.esRepository = esRepository;
    }

    async createNewPost(userID: string, imageBuffer: Buffer|null, content: string): Promise<Post> {
        try {
            const newPost = await this.postsRepository.createNewPost(userID, content);
            const newPostID = newPost.id!;

            if (imageBuffer) {
                const compressedImageBufferString = await compressImage(imageBuffer);
                const imageName = `posts/${newPostID}.jpg`;
                const imageURL = await uploadToS3(compressedImageBufferString, imageName);
                await this.postsRepository.updateImageURL(newPostID, imageURL);
                await this.esRepository.createNewPost(newPostID, userID, content, imageURL, newPost.createdAt!);
            } else {
                await this.esRepository.createNewPost(newPostID, userID, content, null, newPost.createdAt!);
            }

            const postDetails = await this.postsRepository.getPostDetails(newPostID);
            
            /* send messages to rabbitMQ => feeds service */
            sendPostEvents(postDetails?.id!, postDetails?.imageURL!, postDetails?.content!, userID!);
            
            return postDetails
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    async savePost(postID: string, userID: string): Promise<{ id: number; userID: string; createdAt: Date; postID: string; }> {
        try {
            const postSavedResponse = await this.postsRepository.savePost(postID, userID);
            return postSavedResponse;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    async unsavePost(postID: string, userID: string): Promise<boolean>{
        try {
            const response = await this.postsRepository.unsavePost(postID, userID);
            return response;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    async getSavedPostsOfUser(userID: string): Promise<Promise<{ post: Post }[]>>{
        try {
            let savedPosts = await this.postsRepository.getSavedPostsByUser(userID);
            return savedPosts;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* like or unlike a post */
    async toggleLike(postID: string, userID: string): Promise<boolean> {
        try {
            const response = await this.postsRepository.toggleLike(postID, userID);
            return response;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* comment on a post */
    async addComments(postID: string, userID: string, comment: string): Promise<PostComment>
        {
        try {
            const newComment = await this.postsRepository.addComments(postID, userID, comment);
            return newComment;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* get comments of a post */
    async getComments(postID: string): Promise<PostComment[]> {
        try {
            const comments = await this.postsRepository.getComments(postID);
            return comments;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
            
        } 
    }

    /* report a post */
    async reportPost(postID: string, userID: string, reason: ReportReason, description: string): Promise<boolean> {
        try {
            const response = await this.postsRepository.reportPost(postID, userID, reason, description);
            return response;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }

    /* get likes and comments count(count only) for a specific post */
    async getInteractionCount(postID: string): Promise<{ likesCount: number; commentsCount: number } | null> {
        try {
            const cacheKey = `post:${postID}:interactions`;

            const cachedData = await RedisHelper.get(cacheKey);
            if (cachedData) {
                return JSON.parse(cachedData);
            }

            const interactions = await this.postsRepository.getInteractionCount(postID);

            if (interactions) {
                await RedisHelper.set(cacheKey, JSON.stringify(interactions), 60);
            }

            return interactions;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                throw error;
            } else {
                throw createHttpError(500, "An unexpected error occurred");
            }
        }
    }
};

export default PostsService;