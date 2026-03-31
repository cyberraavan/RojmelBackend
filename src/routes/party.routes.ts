import { Router } from 'express';
import { getParties, getPartyById, createParty, updateParty, deleteParty } from '../controllers/party.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation';
import { createPartySchema } from '../validation/schemas';

const router = Router();

router.use(authenticateToken); // Protect all party routes

router.get('/', getParties);
router.get('/:id', getPartyById);
router.post('/', requireAdmin, validateBody(createPartySchema), createParty);
router.put('/:id', requireAdmin, validateBody(createPartySchema), updateParty);
router.delete('/:id', requireAdmin, deleteParty);

export default router;

