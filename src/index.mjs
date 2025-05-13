import express, { request } from 'express';
import mockUsers from './util/mockUsers.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { DatabaseClient } from './database/client/index.ts';

import './strategies/local-strategy.mjs';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
    session({
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

const PORT = process.env.PORT || 3000;

const dbClient = new DatabaseClient();

app.listen(PORT, (err) => {
    if (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
    console.log('Server is running on port', PORT);
});

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
        .findCommunityUserData(req.body.userId, req.body.communityId)
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
    if (!req.body.userId || !req.body.communityId || !req.body.postId) {
        return res.status(400).send('error, no body');
    }
});

app.get('/', (req, res) => {
    const {
        query: { filter, value },
    } = req;
    if (!filter && !value) {
        res.cookie('name', 'value', {
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

app.post('/api/auth', passport.authenticate('local'), (req, res) => {
    console.log(req.user);
    console.log(req.session);
    return res.sendStatus(200);
});

app.get('/api/auth/status', (req, res) => {
    console.log(req.user);
    console.log(req.session);
    if (req.user) {
        return res.status(200).send(req.session.user);
    }
    return res.status(401).send('Unauthorized');
});

app.post('/auth', passport.authenticate('local'), (req, res) => {
    const {
        body: { name, password },
    } = req;
    const findUser = mockUsers.find(
        (user) => user.name === name && user.displayName === password,
    );

    if (!findUser) {
        return res.status(401).send('Unauthorized');
    }
    req.session.user = findUser;
    return res.status(200).send(findUser);
});

app.get('/auth/status', (req, res) => {
    console.log(req.session.user);
    if (req.session.user) {
        return res.status(200).send(req.session.user);
    }
    return res.status(401).send('Unauthorized');
});

app.get('/auth/logout', (req, res) => {
    if (!req.user) return res.status(401).send('Unauthorized');
    req.logout((err) => {
        //req.logout attached by passport.initialize()
        //req.logout is attached to request after
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).send('Error logging out');
        }
        req.session.destroy((err) => {
            //to prevent session fixation attacks
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).send('Error logging out');
            }
            res.clearCookie('connect.sid'); // Clear the cookie
            return res.status(200).send('Logged out successfully');
        });
    });
});

app.post('/auth/cart', (req, res) => {
    if (!req.session.user) return res.status(401).send('Unauthorized');
    const {
        body: { item },
    } = req;
    const { cart } = req.session;
    if (!cart) {
        req.session.cart = [item];
    } else {
        cart.push(item);
    }
    console.log(req.session.cart);
    return res.status(200).send(req.session.cart);
});

app.get('/:id', (req, res) => {
    const { id, name } = req.params;
    console.log(req.session.id);
    res.status(200).send(`Hello ${id} and ${name}`);
});
