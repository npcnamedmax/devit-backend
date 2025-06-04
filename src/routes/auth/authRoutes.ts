import { Router } from 'express';
import passport from 'passport';
import ctrls from './authControllers.ts';

const router = Router();

router.post(
    '/auth/login',
    passport.authenticate('local', {
        failWithError: true,
    }),
    ctrls.validateUser,
);
router.get('/auth/validate', ctrls.validateUser);
router.get('/auth/logout', ctrls.logout);

export default router;
