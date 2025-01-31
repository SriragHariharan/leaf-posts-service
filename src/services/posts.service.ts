import createHttpError from "http-errors";
import { uploadToS3 } from "../helpers/s3.helper";
import compressImage from "../helpers/sharp.helper";
import { IPostsRepository } from "../interfaces/IPostsRepository";
import { Post } from "../interfaces/post.interface";
import { IElasticRepository } from "../interfaces/IElasticRepository";

class PostsService {

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

            return await this.postsRepository.getPostDetails(newPostID);
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
};

export default PostsService;