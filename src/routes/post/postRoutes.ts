import { Router } from 'express';
import passport from 'passport';
import ctrls from './postController.ts';

const router = Router();

router.get('/posts', ctrls.getPostsFact());

export default router;
