import { Comments, Post } from 'src/services/database/types';
import { DatabaseQuery } from '../index.ts';
import type * as types from './types';

export class PostQuery extends DatabaseQuery {
    static async isExist(postId: string): Promise<boolean> {
        return await super.isExist(postId, 'Post');
    }

    static async getPostsAsGuest(
        cursor:
            | Partial<Record<types.CursorOption, any>>
            | undefined = undefined,
        limit = 2,
        communityId: string,
    ): Promise<Record<string, any> | null> {
        if (!super.validateId(communityId)) return null;
        const res = await this.getPosts(limit, cursor, communityId);
        return res;
    }

    static async getPosts(
        //clustering?
        //gets posts based on cursor, which is based on post id and created_at
        limit = 2,
        cursor:
            | Partial<Record<types.CursorOption, any>>
            | undefined = undefined,
        communityId: string | undefined = undefined,
        userId: string | null = null,
    ): Promise<Record<string, any> | null> {
        let res: any[] | null = null;

        let baseQuery = this.db
            .selectFrom('Post')
            .selectAll('Post')
            .leftJoin('User', 'Post.author_id', 'User.id')
            .select(['User.username', 'User.profile_url'])
            .leftJoin(
                //gives null if no match
                (qb) =>
                    qb
                        .selectFrom('UserPost')
                        .selectAll()
                        .where('UserPost.user_id', '=', userId)
                        .as('UserPost'),
                (join) => join.onRef('UserPost.post_id', '=', 'Post.id'),
            )
            .selectAll('UserPost')
            .where('isDeleted', '=', false)
            .limit(limit);

        if (communityId) baseQuery.where('Post.community_id', '=', communityId);

        if (cursor) {
            //there is a cursor
            cursor.post_id = cursor.post_id || '0'; //default

            if (cursor.created_at) {
                //based on created at, and if tie, based on id
                res = await baseQuery
                    .orderBy('Post.created_at', 'desc') //newest to oldest
                    .orderBy('Post.id', 'asc') //smallest to biggest
                    .where((eb) =>
                        eb.and([
                            eb('Post.created_at', '>=', cursor.created_at),
                            eb('Post.id', '>', cursor.post_id),
                        ]),
                    )
                    .execute();
            } else if (cursor.num_likes) {
                res = await baseQuery
                    .orderBy('Post.created_at', 'desc') //newest to oldest
                    .orderBy('Post.id', 'asc') //smallest to biggest
                    .where((eb) =>
                        eb.and([
                            eb('Post.num_likes', '>=', cursor.num_likes),
                            eb('Post.id', '>', cursor.post_id),
                        ]),
                    )
                    .execute();
            }
        } else {
            res = await baseQuery
                .orderBy('Post.created_at', 'desc')
                .orderBy('Post.id', 'asc')
                .execute();
        }

        let lastPost: Record<string, any> | null = null,
            finalResult: Record<string, any> | null = null;
        if (res && res.length > 0) {
            lastPost = res[0];
            finalResult = lastPost
                ? {
                      cursor: {
                          post_id: lastPost.id,
                          created_at: lastPost.created_at,
                      },
                      result: res,
                  }
                : { result: res };
        }
        return finalResult;
    }
    static async getPost(
        postId: string,
        userId: string | null = null,
    ): Promise<Record<string, any> | null> {
        if (!this.validateId(postId)) return null;
        let baseQuery = this.db
            .selectFrom('Post')
            .selectAll('Post')
            .leftJoin('User', 'Post.author_id', 'User.id')
            .select(['User.username', 'User.profile_url'])
            .leftJoin(
                //gives null if no match
                (qb) =>
                    qb
                        .selectFrom('UserPost')
                        .selectAll()
                        .where('UserPost.user_id', '=', userId)
                        .as('UserPost'),
                (join) => join.onRef('UserPost.post_id', '=', 'Post.id'),
            )
            .selectAll('UserPost');

        const res = await baseQuery
            .where('Post.id', '=', postId)
            .executeTakeFirst();

        if (res && res.isDeleted) {
            res.author_id = res.description = res.username = '[deleted]';
            res.img_url = res.profile_url = null;
        }

        return res ? res : null;
    }
    static async deletePost(postId: string, userId: string): Promise<boolean> {
        if (!this.validateId(postId) || !this.validateId(userId)) return false;

        const res = await this.db
            .updateTable('Post')
            .set({
                isDeleted: true,
            })
            .where('id', '=', postId)
            .where('author_id', '=', userId) //deletable only by author
            .executeTakeFirst();

        return res.numUpdatedRows === 0n ? false : true;
    }
    static async getComments(
        postId: string,
        limit: number = 2,
        userId: string | null = null,
        parentCmtId: string | null = null,
    ): Promise<Record<any, any> | null> {
        let res: any[] | null = null;
        if (
            !this.validateId(postId) ||
            (userId && !this.validateId(userId)) ||
            (parentCmtId && !this.validateId(parentCmtId))
        )
            return null;

        let query = this.db
            .selectFrom('Comments')
            .where('Comments.post_id', '=', postId)
            .leftJoin('User', 'Comments.author_id', 'User.id')
            .select(['User.username', 'User.profile_url'])
            .leftJoin(
                (qb) =>
                    qb
                        .selectFrom('UserComments')
                        .where('UserComments.user_id', '=', userId)
                        .selectAll()
                        .as('UserComments'),
                (join) =>
                    join.onRef(
                        'UserComments.user_id',
                        '=',
                        'Comments.author_id',
                    ),
            )
            .selectAll('Comments')
            .limit(limit);

        if (parentCmtId) query.where('parent_id', '=', parentCmtId);

        res = await query.execute();

        for (let cmt of res) {
            if (cmt.isDeleted) {
                cmt.author_id = cmt.description = cmt.username = '[deleted]';
                cmt.img_url = cmt.profile_url = null;
            }
        }

        return res;
    }
    static async addPost(
        userId: string,
        communityId: string,
        options: Partial<Post>,
    ): Promise<boolean> {
        if (
            !this.validateId(userId) ||
            !this.validateId(communityId) ||
            !options.community_id ||
            !options.description ||
            !options.title
        )
            return false;

        let imgUrl: string[] | null = null;
        if (options.img_url) {
            imgUrl = Array.isArray(options.img_url)
                ? options.img_url.filter((url) => !!url)
                : [options.img_url].filter((url) => !!url); //check for null/undefined

            if (imgUrl.length === 0) {
                imgUrl = [];
            }
        }
        const res = await this.db
            .insertInto('Post')
            .values({
                author_id: userId,
                community_id: communityId,
                description: options.description,
                title: options.title,
                img_url: imgUrl,
            })
            .executeTakeFirst();

        return res.numInsertedOrUpdatedRows === 0n ? false : true;
    }

    static async addComment(
        userId: string,
        postId: string,
        options: Partial<Comments>,
        parentComment: string | null = null,
    ): Promise<boolean> {
        if (
            !super.validateId(userId) ||
            !super.validateId(postId) ||
            !options.description
        )
            return false;

        let imgUrl: string[] | null = null;
        if (options.img_url) {
            imgUrl = Array.isArray(options.img_url)
                ? options.img_url.filter((url) => !!url)
                : [options.img_url].filter((url) => !!url);
        }

        const res = await this.db
            .insertInto('Comments')
            .values({
                author_id: userId,
                description: options.description,
                img_url: imgUrl,
                post_id: postId,
                parent_id: parentComment,
            })
            .executeTakeFirst();

        return res.numInsertedOrUpdatedRows === 0n ? false : true;
    }

    static async deleteComment(commentId: string): Promise<boolean> {
        if (!this.validateId(commentId)) return false;
        const res = await this.db
            .updateTable('Comments')
            .set({
                isDeleted: true,
            })
            .where('id', '=', commentId)
            .executeTakeFirst();

        return res.numUpdatedRows === 0n ? false : true;
    }
}
