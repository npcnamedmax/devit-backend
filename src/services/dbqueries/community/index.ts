import { DatabaseQuery } from '../index.ts';
import { sql } from 'kysely';
import type { Community, Communityrole } from 'src/services/database/types';

export class CommunityQuery extends DatabaseQuery {
    static async getCommunityUserData(
        userId: string,
        communityId: string,
    ): Promise<Record<any, any> | null> {
        if (!this.validateId(userId) || !this.validateId(communityId))
            return null;

        const res = await this.db
            .selectFrom('Community')
            .leftJoin(
                'UserCommunity',
                'Community.id',
                'UserCommunity.community_id',
            )
            .selectAll('Community')
            .select((eb) =>
                eb.fn.count('UserCommunity.user_id').as('memberCount'),
            )
            .select(({ exists, selectFrom }) => [
                sql`ARRAY(SELECT user_id FROM "UserCommunity" WHERE community_id = ${communityId} AND role = 'MODERATOR')`.as(
                    'moderators',
                ),
                sql`ARRAY(SELECT json_build_object('communityId', r.community_id, 'title', r.title, 'url', r.url) FROM "Resource" r WHERE community_id = ${communityId})`.as(
                    'resources',
                ),
                exists(
                    selectFrom('UserCommunity')
                        .where('UserCommunity.community_id', '=', communityId)
                        .where('UserCommunity.user_id', '=', userId),
                ).as('joined'),
                exists(
                    selectFrom('UserCommunity')
                        .where('UserCommunity.community_id', '=', communityId)
                        .where('UserCommunity.user_id', '=', userId)
                        .where('UserCommunity.role', '=', 'MODERATOR'),
                ).as('isModerator'),
            ])
            .where('Community.id', '=', communityId)
            .groupBy('Community.id')
            .executeTakeFirst();

        return res ? res : null;
    }

    static async changeUserRole(
        userId: string,
        communityId: string,
        role: Communityrole,
    ): Promise<boolean> {
        if (
            !['MODERATOR', 'MEMBER', 'OWNER'].includes(role) ||
            (await super.isExist(userId, 'User')) ||
            !(await this.isExist(communityId))
        )
            return false;

        const res = await this.db
            .updateTable('UserCommunity')
            .set({
                role,
            })
            .where('UserCommunity.user_id', '=', userId)
            .where('UserCommunity.community_id', '=', communityId)
            .executeTakeFirst();

        return res.numUpdatedRows === 0n ? false : true;
    }

    static async isExist(communityId: string): Promise<boolean> {
        const res = await super.isExist(communityId, 'Community');
        return res;
    }

    static async removeCommunity(communityId: string): Promise<boolean> {
        if (!(await this.isExist(communityId))) return false;

        await this.db
            .deleteFrom('UserCommunity')
            .where('UserCommunity.community_id', '=', communityId)
            .executeTakeFirst();

        const res2 = await this.db
            .deleteFrom('Community')
            .where('id', '=', communityId)
            .executeTakeFirst();

        return res2 && res2.numDeletedRows !== 0n ? true : false;
    }

    static async addCommunity(options: Partial<Community>) {
        if (
            !options.name ||
            !options.description ||
            !this.validateId(options.owner_id) ||
            !(await super.isExist(options.owner_id!, 'User')) //added ! since validateId checks for undefined
        )
            return false;

        const resId = await this.db
            .insertInto('Community')
            .values({
                name: options.name,
                description: options.description,
                owner_id: options.owner_id!,
            })
            .returning('id')
            .executeTakeFirst();

        if (resId == undefined) return null;

        const res = await this.db
            .insertInto('UserCommunity')
            .values({
                community_id: resId.id,
                user_id: options.owner_id!,
                role: 'OWNER',
            })
            .executeTakeFirst();

        return res?.numInsertedOrUpdatedRows === 0n ? false : true;
    }

    static async joinCommunity(
        communityId: string,
        userId: string,
    ): Promise<boolean> {
        if (
            !(await super.isExist(userId, 'User')) ||
            !(await this.isExist(communityId))
        )
            return false;
        const res = await this.db
            .insertInto('UserCommunity')
            .values({
                //role defaults to member
                community_id: communityId,
                user_id: userId,
            })
            .executeTakeFirst();

        return res?.numInsertedOrUpdatedRows === 0n ? false : true;
    }

    static async exitCommunity(
        communityId: string,
        userId: string,
    ): Promise<boolean> {
        if (
            !(await super.isExist(userId, 'User')) ||
            !(await this.isExist(communityId))
        )
            return false;
        const res = await this.db
            .deleteFrom('UserCommunity')
            .where('user_id', '=', userId)
            .where('community_id', '=', communityId)
            .executeTakeFirst();

        return res?.numDeletedRows === 0n ? false : true;
    }
}
