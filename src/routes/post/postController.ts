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

type PostOption = {
    sortBy: 'newest' | 'most_viewed' | 'most_liked' | undefined;
};

export default {
    getPostsFact: () => {
        //closure
        return (req: express.Request, res: express.Response) => {
            const options = req.query;
            if (
                !options ||
                !['newest', 'most_viewed', 'most_liked'].includes(options)
            )
                res.status(400).send('Invalid req options');

            options.sortBy = options.sortBy || 'newest';

            res.status(200).send({
                user: req.user,
                sess: req.session,
            });
        };
    },
};
