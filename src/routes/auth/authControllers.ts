import express from 'express';

declare global {
    namespace Express {
        interface User {
            [key: string]: any;
        }
        interface Request {
            user?: User;
        }
    }
}

export default {
    validateUser: (req: express.Request, res: express.Response) => {
        if (req.user && req.session) {
            console.log('isAuth: ', req.isAuthenticated);
            console.log('user is ', req.user);
            console.log('session is ', req.session);
        }
        res.status(200).send({
            user: req.user,
            sess: req.session,
        });
    },
    checkStatus: (req: express.Request, res: express.Response) => {
        if (req.user && req.session) {
            console.log('user is ', req.user);
            console.log('session is ', req.session);
            res.status(200).send('Logged in');
        }
        res.status(200).send('Not logged in');
    },
    logout: (req: express.Request, res: express.Response) => {
        if (!req.user) {
            res.status(401).send('Unauthorized');
        } else {
            req.logout((err) => {
                //req.logout attached by passport.initialize()
                //req.logout is attached to request after
                if (err) {
                    console.error('Error logging out:', err);
                    res.status(500).send('Error logging out');
                } else {
                    req.session.destroy((err) => {
                        //to prevent session fixation attacks
                        if (err) {
                            console.error('Error destroying session:', err);
                            res.status(500).send('Error logging out');
                        }
                        res.clearCookie('connect.sid'); // Clear the cookie
                        res.status(200).send('Logged out successfully');
                    });
                }
            });
        }
    },
};
