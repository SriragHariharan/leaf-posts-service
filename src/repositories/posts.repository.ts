import createHttpError from "http-errors";
import prisma from "../helpers/prisma";
import { IPostsRepository } from "../interfaces/IPostsRepository";
import { Post, ReportReason } from "../interfaces/post.interface";
import { PostComment } from "../interfaces/comment.interface";
import {
  AddCommentResult,
  DeleteCommentResult,
  ToggleLikeResult,
} from "../interfaces/interaction.interface";
class PostsRepository implements IPostsRepository {
  /* Save a new post to MySQL */
  async createNewPost(userID: string, content: string): Promise<Post | any> {
    try {
      const newPost = await prisma.post.create({
        data: {
          userID,
          content,
        },
      });
      return newPost;
    } catch (error) {
      throw createHttpError(500, "Unable to create post");
    }
  }

  /* Delete a post by marking it as deleted */
  async deletePost(postID: string): Promise<boolean> {
    try {
      await prisma.post.update({
        where: { id: postID },
        data: { isDeleted: true },
      });
      return true;
    } catch (error) {
      throw createHttpError(500, "Unable to delete post.");
    }
  }

  /* Update post content */
  async updatePost(postID: string, content: string): Promise<boolean> {
    try {
      await prisma.post.update({
        where: { id: postID },
        data: { content },
      });

      return true;
    } catch (error) {
      throw createHttpError(500, "Unable to update post");
    }
  }

  /* Update the image URL of a post */
  async updateImageURL(postID: string, imageURL: string): Promise<boolean> {
    try {
      await prisma.post.update({
        where: {
          id: postID,
        },
        data: {
          imageURL: imageURL,
        },
      });
      return true;
    } catch (error) {
      throw createHttpError(500, "Unable to update image URL");
    }
  }

  /* Get details of a specific post */
  async getPostDetails(postID: string): Promise<Post> {
    try {
      const post = await prisma.post.findUnique({
        where: {
          id: postID,
        },
        select: {
          id: true,
          imageURL: true,
          content: true,
          createdAt: true,
          likesCount: true,
          commentsCount: true,
          user: {
            select: {
              userID: true,
              username: true,
              profilepic: true,
            },
          },
        },
      });

      if (!post) {
        throw createHttpError(404, "Post not found");
      }
      return post;
    } catch (error) {
      if (error instanceof createHttpError.HttpError) {
        throw error;
      }
      throw createHttpError(500, "Unable to save post");
    }
  }

  /* Save a post for a user */
  async savePost(
    postID: string,
    userID: string,
  ): Promise<{ id: number; userID: string; createdAt: Date; postID: string }> {
    try {
      const existingSave = await prisma.postSave.findFirst({
        where: {
          postID,
          userID,
        },
      });

      if (existingSave) {
        throw createHttpError(400, "Post already saved");
      }

      const savedPost = await prisma.postSave.create({
        data: {
          postID,
          userID,
        },
      });
      return savedPost;
    } catch (error) {
      if (error instanceof createHttpError.HttpError) {
        throw error;
      }
      throw createHttpError(500, "Unable to save post");
    }
  }

  /* Unsave a post for a user */
  async unsavePost(postID: string, userID: string): Promise<boolean> {
    try {
      const deleteResult = await prisma.postSave.deleteMany({
        where: {
          postID,
          userID,
        },
      });

      if (deleteResult.count === 0) {
        throw createHttpError(404, "Post not found or already unsaved");
      }
      return true;
    } catch (error) {
      if (error instanceof createHttpError.HttpError) {
        throw error;
      }
      throw createHttpError(500, "Unable to save post");
    }
  }

  /* Get all saved posts for a specific user */
  async getSavedPostsByUser(
    userID: string,
  ): Promise<Promise<{ post: Post | any }[]>> {
    try {
      const savedPosts = await prisma.postSave.findMany({
        where: {
          userID,
        },
        include: {
          post: true,
          user: true,
        },
      });
      return savedPosts;
    } catch (error) {
      throw createHttpError(500, "Unable to retrieve saved posts");
    }
  }

  /* Toggle like/unlike for a post */
  async toggleLike(postID: string, userID: string): Promise<ToggleLikeResult> {
    try {
      return await prisma.$transaction(async (tx) => {
        const post = await tx.post.findUnique({
          where: { id: postID },
          select: { id: true },
        });

        if (!post) {
          throw createHttpError(404, "Post not found");
        }

        const existingLike = await tx.postLike.findFirst({
          where: { postID, userID },
        });

        let isLiked: boolean;

        if (existingLike) {
          await tx.postLike.delete({
            where: { id: existingLike.id },
          });

          await tx.post.update({
            where: { id: postID },
            data: { likesCount: { decrement: 1 } },
          });

          isLiked = false;
        } else {
          await tx.postLike.create({
            data: { postID, userID },
          });

          await tx.post.update({
            where: { id: postID },
            data: { likesCount: { increment: 1 } },
          });

          isLiked = true;
        }

        const updatedPost = await tx.post.findUnique({
          where: { id: postID },
          select: { likesCount: true },
        });

        return {
          isLiked,
          likesCount: updatedPost?.likesCount ?? 0,
        };
      });
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }
      throw createHttpError(500, "Something went wrong");
    }
  }

  /* Add a comment to a post */
  async addComments(
    postID: string,
    userID: string,
    comment: string,
  ): Promise<AddCommentResult> {
    try {
      return await prisma.$transaction(async (tx) => {
        const post = await tx.post.findUnique({
          where: { id: postID },
          select: { id: true },
        });

        if (!post) {
          throw createHttpError(404, "Post not found");
        }

        const newComment = await tx.postComment.create({
          data: {
            postID,
            userID,
            comment,
            status: "active",
          },
          include: {
            user: {
              select: {
                userID: true,
                username: true,
                profilepic: true,
              },
            },
          },
        });

        await tx.post.update({
          where: { id: postID },
          data: { commentsCount: { increment: 1 } },
        });

        const updatedPost = await tx.post.findUnique({
          where: { id: postID },
          select: { commentsCount: true },
        });
        return {
          comment: newComment,
          commentsCount: updatedPost?.commentsCount ?? 0,
          isCommented: true,
        };
      });
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }
      throw createHttpError(500, "Unable to comment on post");
    }
  }

  /* Soft-delete a comment authored by the user */
  async deleteComment(
    postID: string,
    commentID: number,
    userID: string,
  ): Promise<DeleteCommentResult> {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingComment = await tx.postComment.findFirst({
          where: { id: commentID, postID, status: "active" },
        });

        if (!existingComment) {
          throw createHttpError(404, "Comment not found");
        }
        if (existingComment.userID !== userID) {
          throw createHttpError(403, "Not allowed to delete this comment");
        }

        await tx.postComment.update({
          where: { id: commentID },
          data: { status: "deleted" },
        });

        await tx.post.update({
          where: { id: postID },
          data: { commentsCount: { decrement: 1 } },
        });

        const remainingComments = await tx.postComment.count({
          where: { postID, userID, status: "active" },
        });

        const updatedPost = await tx.post.findUnique({
          where: { id: postID },
          select: { commentsCount: true },
        });

        return {
          commentsCount: updatedPost?.commentsCount ?? 0,
          isCommented: remainingComments > 0,
        };
      });
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }
      throw createHttpError(500, "Unable to delete comment");
    }
  }

  /* Get all comments for a post */
  async getComments(postID: string): Promise<PostComment[]> {
    try {
      const comments = await prisma.postComment.findMany({
        where: {
          postID,
          status: "active",
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return comments;
    } catch (error) {
      throw createHttpError(500, "Unable to fetch comments");
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
      await prisma.postReport.create({
        data: {
          postID,
          userID,
          reason,
          description,
          status: "pending",
        },
      });
      return true;
    } catch (error) {
      throw createHttpError(500, "Unable to report post");
    }
  }

  /* Get interaction count (likes and comments) for a post */
  async getInteractionCount(
    postID: string,
  ): Promise<{ likesCount: number; commentsCount: number } | null> {
    try {
      const interactions = await prisma.post.findUnique({
        where: { id: postID },
        select: {
          likesCount: true,
          commentsCount: true,
        },
      });
      return interactions;
    } catch (error) {
      throw createHttpError(500, "Unable to fetch interaction count");
    }
  }

  /* Fetch user timeline (all posts by the user) */
  async fetchTimeline(userID: string, page: number): Promise<Post[]> {
    try {
      const posts = await prisma.post.findMany({
        where: { userID },
        include: {
          user: true,
          likes: true,
          comments: true,
          saves: true,
          reports: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        skip: (page - 1) * 3,
      });
      return posts;
    } catch (error) {
      throw createHttpError(500, "Unable to fetch timeline");
    }
  }
}

export default PostsRepository;
