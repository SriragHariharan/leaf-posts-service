export interface IDeleteElasticRepository {
  deletePost(postID: string): Promise<boolean>;
}
