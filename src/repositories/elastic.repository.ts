import createHttpError from "http-errors";
import esClient from "../helpers/elastic-search";
import { Post } from "../interfaces/post.interface";
import { IElasticRepository } from "../interfaces/IElasticRepository";
import { IDeleteElasticRepository } from "../interfaces/IDeleteElasticRepository";

class ElasticSearchRepository implements IElasticRepository, IDeleteElasticRepository {

    /* Save post to Elasticsearch */
    async createNewPost(postID: string, userID: string, content: string, imageURL: string | null, createdAt: Date): Promise<any> {
        try {
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
            return newPost;
        } catch (error) {
            throw createHttpError(500, "Unable to save post");
        }
    }

    /* Search for posts by content */
    async searchPostsContent(query: string): Promise<Post[]> {
        try {
            // Search for posts containing the query in the content
            const result = await esClient.search({
                index: 'posts',
                body: {
                    query: {
                        wildcard: {
                            content: `*${query}*`, // Use wildcards to match any substring
                        },
                    },
                    size: 100, // Return the first 100 results
                },
            });

            // Extract post IDs and user IDs from the search results
            const postIDs = result.hits.hits.map((hit: any) => hit._id); // Use _id for the post ID
            const userIDs = result.hits.hits.map((hit: any) => hit._source.userID); // Extract user IDs

            // Search for users associated with the posts
            const userResult = await esClient.search({
                index: 'users',
                body: {
                    query: {
                        terms: {
                            userID: userIDs, // Match user IDs from the posts
                        },
                    },
                    size: 100,
                },
            });

            // Create a map of users for quick lookup
            const users: { [key: string]: any } = userResult.hits.hits.reduce((acc: { [key: string]: any }, hit: any) => {
                acc[hit._source.userID] = hit._source;
                return acc;
            }, {});

            // Return the posts with their IDs, content, and associated user details
            return result.hits.hits.map((hit: any) => ({
                id: hit._id, // Include the post ID
                ...hit._source, // Include the post content and other fields
                user: users[hit._source.userID], // Include the user details
            }));
        } catch (error) {
            console.log(error)
            throw createHttpError(500, "Unable to search. Please try again.");
        }
    }

    //delete a post
    async deletePost(postID: string): Promise<boolean> {
        try {
            const deletedResponse = await esClient.delete({
                index: 'posts',
                id: postID
            });
            return deletedResponse;
        } catch (error) {
            throw createHttpError(500, "Unable to delete post.");
        }   
    }
}

export default ElasticSearchRepository;