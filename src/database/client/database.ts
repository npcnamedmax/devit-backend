import type { Database } from './types.ts';
import pg from 'pg';

import { Kysely, PostgresDialect } from 'kysely';
import 'dotenv/config';

const dialect = new PostgresDialect({
    pool: new pg.Pool({
        database: process.env.PGDB,
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        port: Number(process.env.PGPORT),
        max: 10,
        password: process.env.PGPASSWORD,
    }),
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<Database>({
    dialect,
});
