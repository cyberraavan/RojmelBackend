import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation';
import { createUserSchema } from '../validation/schemas';
import { getUsers, createUser, deleteUser } from '../controllers/user.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', requireAdmin, getUsers);
router.post('/', requireAdmin, validateBody(createUserSchema), createUser);
router.delete('/:id', requireAdmin, deleteUser);

export default router;

