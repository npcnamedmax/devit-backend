//sudo service postgresql start to start server
//sudo service postgresql stop to stop server
//sudo -u postgres psql to access the database
//config at /etc/postgresql/14/main

//to change password, change in psql (pg interactive shell)

/*
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import pg from 'pg';
const { Client } = pg;
const client = new Client();
await client.connect();

try {
    const res = await client.query('SELECT $1::text as message', [
        'Hello world!',
    ]);
    console.log(res.rows[0].message); // Hello world!
} catch (err) {
    console.error(err);
} finally {
    await client.end();
}
*/
