import createHttpError from "http-errors";
import esClient from "../helpers/elastic-search";
import { Post } from "../interfaces/post.interface";
import { IElasticRepository } from "../interfaces/IElasticRepository";
import { IDeleteElasticRepository } from "../interfaces/IDeleteElasticRepository";
import { SearchUser } from "../interfaces/user.interface";
class ElasticSearchRepository
  implements IElasticRepository, IDeleteElasticRepository
{
  /* Save post to Elasticsearch */
  async createNewPost(
    postID: string,
    userID: string,
    content: string,
    imageURL: string | null,
    createdAt: Date,
  ): Promise<any> {
    try {
      const newPost = await esClient.index({
        index: "posts",
        id: postID.toString(),
        body: {
          userID: userID,
          content: content,
          imageURL: imageURL,
          createdAt: createdAt.toISOString(),
        },
      });
      return newPost;
    } catch (error) {
      throw createHttpError(500, "Unable to save post");
    }
  }

  /* Update a post in Elasticsearch */
  async updatePost(
    postID: string,
    userID: string,
    content: string,
    imageURL: string | null,
  ): Promise<void> {
    try {
      await esClient.update({
        index: "posts",
        id: postID.toString(),
        body: {
          doc: {
            userID,
            content,
            imageURL,
          },
        },
      });
    } catch (error) {
      throw createHttpError(500, "Unable to update post");
    }
  }

  /* Search for posts by content */
  async searchPostsContent(query: string): Promise<Post[]> {
    try {
      // Search for posts containing the query in the content
      const result = await esClient.search({
        index: "posts",
        body: {
          query: {
            match_phrase: {
              content: query,
            },
          },
          size: 100, // Return the first 100 results
        },
      });

      // ✅ Fix: Ensure result.body.hits.hits is properly accessed
      const hits = result.body?.hits?.hits;

      if (!hits) {
        throw new Error("Elasticsearch response does not contain hits.");
      }

      // Extract post IDs and user IDs from the search results
      const postIDs = hits.map((hit: any) => hit._id); // Use _id for the post ID
      const userIDs = hits.map((hit: any) => hit._source.userID); // Extract user IDs

      // Search for users associated with the posts
      const userResult = await esClient.search({
        index: "users",
        body: {
          query: {
            terms: {
              userID: userIDs, // Match user IDs from the posts
            },
          },
          size: 100,
        },
      });

      // ✅ Fix: Ensure userResult.body.hits.hits exists
      const userHits = userResult.body?.hits?.hits;

      if (!userHits) {
        throw new Error("Elasticsearch user response does not contain hits.");
      }

      // Create a map of users for quick lookup
      const users: { [key: string]: any } = userHits.reduce(
        (acc: { [key: string]: any }, hit: any) => {
          acc[hit._source.userID] = hit._source;

          return acc;
        },
        {},
      );
      // Return the posts with their IDs, content, and associated user details
      return hits.map((hit: any) => ({
        id: hit._id, // Include the post ID
        ...hit._source, // Include the post content and other fields
        user: users[hit._source.userID] || null, // Include the user details
      }));
    } catch (error) {
      console.error("Elasticsearch error:", error);
      throw createHttpError(500, "Unable to search. Please try again.");
    }
  }

  /* Search for users by username */
  async searchUsersContent(query: string): Promise<SearchUser[]> {
    try {
      const result = await esClient.search({
        index: "users",
        body: {
          query: {
            match_phrase_prefix: {
              username: query,
            },
          },
          size: 100,
        },
      });

      const hits = result.body?.hits?.hits ?? [];

      return hits.map((hit: { _source: SearchUser }) => ({
        userID: hit._source.userID,
        username: hit._source.username,
        profilepic: hit._source.profilepic ?? null,
      }));
    } catch (error) {
      throw createHttpError(500, "Unable to search. Please try again.");
    }
  }

  /* Index a user in Elasticsearch */
  async indexUser(
    userID: string,
    username: string,
    profilepic: string | null,
  ): Promise<void> {
    try {
      await esClient.index({
        index: "users",
        id: userID,
        body: {
          userID,
          username,
          profilepic,
        },
      });
    } catch (error) {
      throw createHttpError(500, "Unable to index user");
    }
  }

  /* Delete a post from Elasticsearch */
  async deletePost(postID: string): Promise<boolean> {
    try {
        await esClient.delete({
          index: "posts",
          id: postID,
        });

        return true;
    } catch (error) {
        throw createHttpError(500, "Unable to delete post.");
    }
  }
}

export default ElasticSearchRepository;
