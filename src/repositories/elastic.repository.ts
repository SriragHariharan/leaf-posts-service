import createHttpError from "http-errors";
import esClient from "../helpers/elastic-search";
import { Post } from "../interfaces/post.interface";
import { IElasticRepository } from "../interfaces/IElasticRepository";
import { IDeleteElasticRepository } from "../interfaces/IDeleteElasticRepository";
import logger from "../helpers/logger";

class ElasticSearchRepository implements IElasticRepository, IDeleteElasticRepository {

    /* Save post to Elasticsearch */
    async createNewPost(postID: string, userID: string, content: string, imageURL: string | null, createdAt: Date): Promise<any> {
        logger.debug(`Entering createNewPost method. Params: postID=${postID}, userID=${userID}`, { method: "createNewPost", layer: "repository" });
        try {
            logger.info(`Indexing new post in Elasticsearch. PostID: ${postID}`, { layer: "repository" });

            const newPost = await esClient.index({
                index: 'posts',
                id: postID.toString(),
                body: {
                    userID: userID,
                    content: content,
                    imageURL: imageURL,
                    createdAt: createdAt.toISOString(),
                },
            });

            logger.info(`Successfully indexed new post. PostID: ${postID}`, { layer: "repository" });
            return newPost;
        } catch (error) {
            logger.error(`Error in createNewPost: Unable to save post. PostID: ${postID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to save post");
        } finally {
            logger.debug(`Exiting createNewPost method. Params: postID=${postID}, userID=${userID}`, { method: "createNewPost", layer: "repository" });
        }
    }

    /* Search for posts by content */
    async searchPostsContent(query: string): Promise<Post[]> {
        logger.debug(`Entering searchPostsContent method. Param: query=${query}`, {
            method: "searchPostsContent",
            layer: "repository",
        });

        try {
            logger.info(`Searching for posts containing query: ${query}`, { layer: "repository" });

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
                {}
            );

            logger.info(`Successfully searched for posts containing query: ${query}`, {
                layer: "repository",
            });

            // Return the posts with their IDs, content, and associated user details
            return hits.map((hit: any) => ({
                id: hit._id, // Include the post ID
                ...hit._source, // Include the post content and other fields
                user: users[hit._source.userID] || null, // Include the user details
            }));
        } catch (error) {
            console.error("Elasticsearch error:", error);
            logger.error(`Error in searchPostsContent: Unable to search for query: ${query}`, {
                error,
                layer: "repository",
            });
            throw createHttpError(500, "Unable to search. Please try again.");
        } finally {
            logger.debug(`Exiting searchPostsContent method. Param: query=${query}`, {
                method: "searchPostsContent",
                layer: "repository",
            });
        }
    }



    /* Delete a post from Elasticsearch */
    async deletePost(postID: string): Promise<boolean> {
        logger.debug(`Entering deletePost method. Param: postID=${postID}`, { method: "deletePost", layer: "repository" });
        try {
            logger.info(`Deleting post from Elasticsearch. PostID: ${postID}`, { layer: "repository" });

            const deletedResponse = await esClient.delete({
                index: 'posts',
                id: postID
            });

            logger.info(`Successfully deleted post. PostID: ${postID}`, { layer: "repository" });
            return deletedResponse;
        } catch (error) {
            logger.error(`Error in deletePost: Unable to delete post. PostID: ${postID}`, { error, layer: "repository" });
            throw createHttpError(500, "Unable to delete post.");
        } finally {
            logger.debug(`Exiting deletePost method. Param: postID=${postID}`, { method: "deletePost", layer: "repository" });
        }
    }
}

export default ElasticSearchRepository;