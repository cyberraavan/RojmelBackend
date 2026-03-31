import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', loginRateLimiter, login);

export default router;
