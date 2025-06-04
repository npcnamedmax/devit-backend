import express from 'express';
//import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
//import { PostQuery } from './services/dbqueries/post/index.ts';

import authRouter from './routes/auth/authRoutes.ts';

import './strategies/local-strategy.mjs';
import { DatabaseQuery } from './services/dbqueries/index.ts';
//import { PostQuery } from './services/dbqueries/post/index.ts';
import { CommunityQuery } from './services/dbqueries/community/index.ts';

const app = express();

app.use(express.json());
//app.use(cookieParser());
app.use(
    session({
        name: 'sessionID', //override default session cookie name to avoid fingerprinting
        secret: 'default',
        saveUninitialized: false,
        resave: false,
        cookie: {
            maxAge: 900000,
        },
    }),
);
app.use(passport.initialize());
app.use(passport.session());

app.use(authRouter);

const PORT = process.env.PORT || 3000;

const mainDB = new DatabaseQuery();

/*
app.get('/test', (req: express.Request, res: express.Response) => {
    
    PostQuery.addPost('472f0ad2-3f09-4391-a6d0-7616f5005bad')
        .then((result) => {
            res.status(200).send(result);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send(err);
        });
        
});
*/

app.post('/testcom', (req: express.Request, res: express.Response) => {
    const options = req.body;
    if (!options.name || !options.description || !options.owner_id) {
        res.status(500).send('invalid');
    } else {
        CommunityQuery.addCommunity({
            name: options.name,
            description: options.description,
            owner_id: options.owner_id,
        })
            .then((result) => {
                res.status(200).send(result);
            })
            .catch((err) => {
                res.status(500).send(err);
            });
    }
});

const server = app.listen(PORT, (err) => {
    if (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
    console.log('Server is running on port', PORT);
});

const cleanup = async () => {
    try {
        server.closeAllConnections();
        await mainDB.destroy(); //clean up db
        process.exit(0);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

process.stdin.resume();

//on termination signals, do cleanup first
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

/*
app.get('/api/test', (req, res) => {
    if (!req.body.id) {
        return res.status(400).send('error, no body');
    }
    console.log(req.body);
    dbClient
        .findUserById(req.body.id)
        .then((result) => {
            console.log(result);
            res.status(200).send(result);
        })
        .catch((err) => {
            console.error('Error fetching person:', err);
            res.status(500).send('Error fetching person');
        });
});

app.get('/api/testCom', (req, res) => {
    if (!req.body.userId || !req.body.communityId) {
        return res.status(400).send('error, no body');
    }
    console.log(req.body);
    dbClient
        .getCommunityUserData(req.body.userId, req.body.communityId)
        .then((result) => {
            console.log(result);
            res.status(200).send(result);
        })
        .catch((err) => {
            console.error('Error fetching person:', err);
            res.status(500).send('Error fetching person');
        });
});

app.get('/api/testPost', (req, res) => {
    if (req.body && req.body.userId) {
        dbClient
            .getPosts(req.body.userId, req.body.cursor, req.body.limit)
            .then((result) => {
                console.log(result);
                return res.status(200).send(result);
            })
            .catch((err) => {
                console.error('Error fetching person:', err);
                res.status(500).send('Error fetching person');
            });
        //return res.status(400).send('error, no body');
    } else {
        dbClient.getUserPost(req.body.userId, req.body);
    }
});

app.get('/', (req, res) => {
    const {
        query: { filter, value },
    } = req;
    if (!filter && !value) {
        res.cookie('name', 'value', {
            //additional cookie
            maxAge: 900000,
        });
        console.log(req.session);
        console.log(req.cookies);
        console.log(req.session.id);
        req.session.visited = true;
        console.log(res.cookie);
        res.status(200).send(mockUsers);
    } else if (filter && value) {
        const filteredUsers = mockUsers.filter((user) =>
            user[filter].includes(value),
        );
        res.status(200).send(filteredUsers);
    } else res.status(400).send('error');
});

app.post('/', (req, res) => {
    console.log('POST request received', req.body);
    res.status(200).send(req);
});

app.post('/users', (req, res) => {
    const { name, displayName } = req.body;
    if (!name || !displayName) {
        res.status(400).send('error');
    } else {
        const newUserId = mockUsers[mockUsers.length - 1].id + 1;
        mockUsers.push({ newUserId, name, displayName });
        res.status(201).send(req.body);
    }
});

app.get('/:id', (req, res) => {
    const { id, name } = req.params;
    console.log(req.session.id);
    res.status(200).send(`Hello ${id} and ${name}`);
});
*/
