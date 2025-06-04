import { DatabaseQuery } from '../index.ts';

export class UserQuery extends DatabaseQuery {
    static async getUserById(id: string) {
        const res = await this.db
            .selectFrom('User')
            .where('id', '=', id)
            .selectAll()
            .executeTakeFirst();

        return res;
    }
    static async isExist(id: any): Promise<boolean> {
        return await super.isExist(id, 'User');
    }
}
