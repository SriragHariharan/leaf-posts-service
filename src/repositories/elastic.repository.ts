import createHttpError from "http-errors";
import esClient from "../helpers/elastic-search";
import { Post } from "../interfaces/post.interface";
import { IElasticRepository } from "../interfaces/IElasticRepository";

class ElasticSearchRepository implements IElasticRepository {

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
            const { body } = await esClient.search({
                index: 'posts',
                body: {
                    query: {
                        multi_match: {
                            query: query,
                            fields: ['content'],
                        },
                    },
                    sort: [
                        { _score: { order: 'desc' } },
                        { createdAt: { order: 'desc' } },
                    ],
                    size: 100,
                },
            });

            // Map results to Post interface
            const results: Post[] = body.hits.hits.map((hit: any) => ({
                id: hit._id,
                userID: hit._source.userID,
                content: hit._source.content,
                imageURL: hit._source.imageURL,
                createdAt: new Date(hit._source.createdAt), // Convert ISO string back to Date
            }));

            return results;
        } catch (error) {
            throw createHttpError(500, "Unable to search. Please try again.");
        }
    }
}

export default ElasticSearchRepository;