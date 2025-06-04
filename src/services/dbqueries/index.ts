import { Kysely, sql } from 'kysely';
import { db } from '../database/client/index.ts';
import type { DB } from '../database/types.d.ts';
import { version as uuidVersion } from 'uuid';
import { validate as uuidValidate } from 'uuid';

//not used
export class DatabaseQuery {
    protected static db: Kysely<DB> = db;

    async destroy() {
        await db.destroy();
        console.log('db is destroyed');
    }

    static validateId(id: any) {
        //prevent sql injection, even though kysely uses parameterised queries
        if (!id || typeof id !== 'string') return false;

        return uuidValidate(id) && uuidVersion(id) === 4;
    }

    protected static async isExist(
        id: string,
        table: keyof DB,
    ): Promise<boolean> {
        //cannot expose, could be vulnerable to sql injection, but kysely has parameterised query,
        //and this is not exposed

        if (!this.validateId(id)) return false;

        const result = await sql<
            Record<'exists', boolean>
        >`SELECT EXISTS (SELECT 1 FROM "${sql.raw(table)}" WHERE id = ${id})`.execute(
            this.db,
        ); //https://kysely-org.github.io/kysely-apidoc/interfaces/QueryResult.html
        return result.rows[0] ? (result.rows[0].exists ? true : false) : false;
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
