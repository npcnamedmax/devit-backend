import { DatabaseQuery } from '..';

export class TestQuery extends DatabaseQuery {
    static async testFc() {
        const userId = 'user-1';
        const res = await this.db
            .selectFrom('Post')
            .leftJoin(
                (qb) =>
                    qb
                        .selectFrom('UserPost')
                        .selectAll()
                        .where('UserPost.user_id', '=', userId)
                        .as('newCol'),
                (join) => join.onRef('newCol.user_id', '=', 'Post.author_id'),
            )
            .selectAll()
            .execute();

        return res;
    }
}
