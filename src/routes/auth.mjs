import { Router } from 'express';

const router = Router();

router.post('/auth/login', (req, res) => {
    const {
        body: { name, displayName },
    } = req;
});
