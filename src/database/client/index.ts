import { join } from 'path';
import { db } from './database.ts';
import { sql } from 'kysely';
import { jsonBuildObject } from 'kysely/helpers/postgres';

export class DatabaseClient {
    private db: any;

    constructor() {
        this.db = db;
    }

    async getUserById(id: string) {
        const res = await db
            .selectFrom('User')
            .where('id', '=', id)
            .selectAll()
            .executeTakeFirst();

        db.destroy();
        return res;
    }

    async getCommunityUserData(userId: string, communityId: string) {
        const res = await db
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

        return res;
    }

    async getPostData(userId: string, postId: string, limit: number) {
        const res = await db
            .selectFrom('Post')
            .selectAll('Post')
            .leftJoin('User', 'Post.author_id', 'User.id')
            .leftJoin(
                (eb) =>
                    eb
                        .selectFrom('UserPost')
                        .selectAll()
                        .where('UserPost.user_id', '=', userId)
                        .where('UserPost.post_id', '=', postId)
                        .as('userPost'),
                (join) => join.onRef('userPost.post_id', '=', 'Post.id'),
            )
            .select([
                'userPost.user_id',
                'userPost.has_liked',
                'userPost.has_disliked',
            ])
            .select((eb) => [
                'id',
                jsonBuildObject({
                    username: eb.ref('username'),
                    profilePic: eb.ref('profile_url'),
                }).as('author'),
            ])
            .where('Post.id', '=', postId)
            .execute();
        return res;
    }

    destructor() {
        this.db.destroy();
    }
}

/*
{
        id: '1',
        name: 'Tech Enthusiasts',
        description: 'A place for tech lovers to discuss the latest trends.',
        createdAt: '2023-01-10T12:00:00Z',
        banner_image_url: 'https://loremflickr.com/800/300/technology',
        memberCount: 120, count frm usecommunity table
        type: 'public',
        resources: [
            {
                name: 'Tech News',
                url: 'https://technews.com',
            },
            {
                name: 'Gadget Reviews',
                url: 'https://gadgetreviews.com',
            },
            {
                name: 'Programming Tutorials',
                url: 'https://programmingtutorials.com',
            },
        ],
        rules: [
            'Be respectful to all members.', //add opt desc to each rule
            'No spamming or self-promotion.',
            'Stay on topic and keep discussions relevant.',
            'No hate speech or personal attacks.',
            'Use appropriate language and avoid offensive content.',
        ],
        moderators: [ select from usercommunity 
            {
                id: '1',
                name: 'Alice Johnson',
            },
        ],
        joined: true, select exists from user community
        isModerator: true
    },
*/

/*
{
        id: '1',
        title: 'Morning Adventure',
        description:
            'Had a great time hiking and exploring the trail asdadwae1dawdawdawd1awdawdassdasdasdasdasd!',
        author: {
            id: '1',
            profilePic: 'https://example.com/profiles/john.jpg',
            username: 'john_doe',
        },
        timePosted: '2023-03-21T08:30:00Z',
        photos: [
            'https://example.com/photos/hike1.jpg',
            'https://example.com/photos/hike2.jpg',
        ],
        comments: [
            { username: 'alice', comment: 'Looks amazing!', numLikes: 3, hasLiked: true, hasDisliked: false },
            { username: 'bob', comment: 'Great pictures!', numLikes: 2 },
        ],
        numLikes: 150,
        numShares: 20,
        numViews: 1200,
        communityId: '1',
        hasLiked: false,
        hasDisliked: false,
    },
*/

/*
const user = {
    username: 'John Doe',
    profilePic: 'https://example.com/profiles/johndoe.jpg',
    bio: 'Just a regular guy who loves to explore the world and share experiences.',
    joined: [{ communityId: 1 }, { communityId: 2 }, { communityId: 3 }],
};
*/
