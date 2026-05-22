import createHttpError from "http-errors";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../helpers/cloudinary.helper";
import compressImage from "../helpers/sharp.helper";
import { IPostsRepository } from "../interfaces/IPostsRepository";
import { Post, ReportReason } from "../interfaces/post.interface";
import { SearchUser } from "../interfaces/user.interface";
import { IElasticRepository } from "../interfaces/IElasticRepository";
import { IPostService } from "../interfaces/IPostService";
import { PostComment } from "../interfaces/comment.interface";
import RedisHelper from "../helpers/redis";
import {
  sendPostCreatedEvent,
  sendPostDeletedEvent,
  sendPostEditedEvent,
} from "../messaging/kafka/post-events.producer";
import sendPostRelatedNotification from "../messaging/kafka/post-notifs.producer";
import { publishInteractionEvent } from "../messaging/kafka/interaction-events.producer";
import type {
  AddCommentResult,
  DeleteCommentResult,
  InteractionEventType,
  ToggleLikeResult,
} from "../interfaces/interaction.interface";
class PostsService implements IPostService {
  private postsRepository: IPostsRepository;

  private esRepository: IElasticRepository;

  constructor(
    postsRepository: IPostsRepository,
    esRepository: IElasticRepository,
  ) {
    this.postsRepository = postsRepository;

    this.esRepository = esRepository;
  }

  /* Create a new post with optional image upload */
  async createNewPost(
    userID: string,
    imageBuffer: Buffer | null,
    content: string,
  ): Promise<Post> {
    try {
      const newPost = await this.postsRepository.createNewPost(userID, content);

      const newPostID = newPost.id!;

      if (imageBuffer) {
        const compressedImageBufferString = await compressImage(imageBuffer);

        const publicId = `posts/${newPostID}`;

        const imageURL = await uploadToCloudinary(
          compressedImageBufferString,
          publicId,
        );

        await this.postsRepository.updateImageURL(newPostID, imageURL);

        await this.esRepository.createNewPost(
          newPostID,
          userID,
          content,
          imageURL,
          newPost.createdAt!,
        );
      } else {
        await this.esRepository.createNewPost(
          newPostID,
          userID,
          content,
          null,
          newPost.createdAt!,
        );
      }

      const postDetails = await this.postsRepository.getPostDetails(newPostID);

      /* Send messages to RabbitMQ => feeds service */ sendPostCreatedEvent(
        postDetails?.id!,
        postDetails?.imageURL!,
        postDetails?.content!,
        userID!,
      );

      /* Send notification to notification service */ sendPostRelatedNotification(
        "post_created",
        userID,
        postDetails?.id!,
        userID,
      );
      return postDetails;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "An unexpected error occurred");
      }
    }
  }

  /* Update an existing post */
  async updatePost(
    userID: string,
    postID: string,
    imageBuffer: Buffer | null,
    content: string,
  ): Promise<Post> {
    try {
      const existing = await this.postsRepository.getPostDetails(postID);

      if (existing.user?.userID !== userID) {
        throw createHttpError(403, "Not allowed to update this post");
      }

      await this.postsRepository.updatePost(postID, content);

      let imageURL = existing.imageURL ?? null;

      if (imageBuffer) {
        const compressedImageBufferString = await compressImage(imageBuffer);

        const publicId = `posts/${postID}`;

        imageURL = await uploadToCloudinary(
          compressedImageBufferString,
          publicId,
        );

        await this.postsRepository.updateImageURL(postID, imageURL);
      }

      await this.esRepository.updatePost(postID, userID, content, imageURL);

      const postDetails = await this.postsRepository.getPostDetails(postID);

      sendPostEditedEvent(
        postDetails.id!,
        postDetails.imageURL ?? null,
        postDetails.content!,
        userID,
      );

      return postDetails;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }
      throw createHttpError(500, "An unexpected error occurred");
    }
  }

  /* Delete a post */
  async deletePost(postID: string): Promise<boolean> {
    try {
      await deleteFromCloudinary(`posts/${postID}`);

      await this.postsRepository.deletePost(postID);
      await this.esRepository.deletePost(postID);

      /* Send message to RabbitMQ to delete post from feeds service */ sendPostDeletedEvent(
        postID,
      );
      return true;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "An unexpected error occurred");
      }
    }
  }

  /* Save a post for a user */
  async savePost(
    postID: string,
    userID: string,
  ): Promise<{ id: number; userID: string; createdAt: Date; postID: string }> {
    try {
      const postSavedResponse = await this.postsRepository.savePost(
        postID,
        userID,
      );
      return postSavedResponse;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "An unexpected error occurred");
      }
    }
  }

  /* Unsave a post for a user */
  async unsavePost(postID: string, userID: string): Promise<boolean> {
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

  /* Get all saved posts for a user */
  async getSavedPostsOfUser(
    userID: string,
  ): Promise<Promise<{ post: Post }[]>> {
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

  /* Like or unlike a post */
  async toggleLike(postID: string, userID: string): Promise<ToggleLikeResult> {
    try {
      const result = await this.postsRepository.toggleLike(postID, userID);

      const postDetails = await this.postsRepository.getPostDetails(postID);

      const targetUserId = postDetails?.user?.userID;

      if (targetUserId) {
        const eventType: InteractionEventType = result.isLiked
          ? "post.liked"
          : "post.unliked";

        await publishInteractionEvent({
          eventType,
          actorUserId: userID,
          targetUserId,
          postId: postID,
          timestamp: new Date().toISOString(),
        });
      }
      return result;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "An unexpected error occurred");
      }
    }
  }

  /* Add a comment to a post */
  async addComments(
    postID: string,
    userID: string,
    comment: string,
  ): Promise<AddCommentResult> {
    try {
      const result = await this.postsRepository.addComments(
        postID,
        userID,
        comment,
      );

      const postDetails = await this.postsRepository.getPostDetails(postID);

      const targetUserId = postDetails?.user?.userID;

      const commentRecord = result.comment as { id?: number };

      if (targetUserId && commentRecord.id != null) {
        await publishInteractionEvent({
          eventType: "post.commented",
          actorUserId: userID,
          targetUserId,
          postId: postID,
          commentId: String(commentRecord.id),
          timestamp: new Date().toISOString(),
        });
      }
      return result;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "An unexpected error occurred");
      }
    }
  }

  /* Delete a comment from a post */
  async deleteComment(
    postID: string,
    commentID: number,
    userID: string,
  ): Promise<DeleteCommentResult> {
    try {
      const result = await this.postsRepository.deleteComment(
        postID,
        commentID,
        userID,
      );

      const postDetails = await this.postsRepository.getPostDetails(postID);

      const targetUserId = postDetails?.user?.userID;

      if (targetUserId && !result.isCommented) {
        await publishInteractionEvent({
          eventType: "post.uncommented",
          actorUserId: userID,
          targetUserId,
          postId: postID,
          commentId: String(commentID),
          timestamp: new Date().toISOString(),
        });
      }

      return result;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }
      throw createHttpError(500, "An unexpected error occurred");
    }
  }

  /* Get all comments for a post */
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

  /* Report a post */
  async reportPost(
    postID: string,
    userID: string,
    reason: ReportReason,
    description: string,
  ): Promise<boolean> {
    try {
      const response = await this.postsRepository.reportPost(
        postID,
        userID,
        reason,
        description,
      );
      return response;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "An unexpected error occurred");
      }
    }
  }

  /* Get likes and comments count for a specific post */
  async getInteractionCount(
    postID: string,
  ): Promise<{ likesCount: number; commentsCount: number } | null> {
    try {
      const interactions =
        await this.postsRepository.getInteractionCount(postID);
      return interactions;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "An unexpected error occurred");
      }
    }
  }

  /* Get details of a post (shared to external user) */
  async getPostDetails(postID: string): Promise<Post> {
    try {
      const postDetails = await this.postsRepository.getPostDetails(postID);
      return postDetails;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "An unexpected error occurred");
      }
    }
  }

  /* Search for posts by content */
  async searchPosts(query: string): Promise<Post[]> {
    try {
      const posts = await this.esRepository.searchPostsContent(query);
      return posts;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "An unexpected error occurred");
      }
    }
  }

  /* Search for users by username */
  async searchUsers(
    query: string,
    excludeUserID?: string,
  ): Promise<SearchUser[]> {
    try {
      const users = await this.esRepository.searchUsersContent(query);

      const filtered = excludeUserID
        ? users.filter((u) => u.userID !== excludeUserID)
        : users;
      return filtered;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "An unexpected error occurred");
      }
    }
  }

  /* Fetch user timeline (all posts by the user) */
  async fetchTimeline(userID: string, page: number): Promise<Post[]> {
    try {
      const posts = await this.postsRepository.fetchTimeline(userID, page);
      return posts;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "An unexpected error occurred");
      }
    }
  }
}

export default PostsService;
