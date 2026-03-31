import { Router } from 'express';
import { getCities, createCity, updateCity, deleteCity } from '../controllers/city.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Temporarily loosely authenticated or use authenticate if applied to others.
// The existing routes seem to require authenticate (or maybe not based on server.ts).
// I will not apply middleware unless I'm sure, but I will prepare the routes.

router.use(authenticateToken); // Protect all city routes

router.get('/', getCities);
router.post('/', requireAdmin, createCity);
router.put('/:id', requireAdmin, updateCity);
router.delete('/:id', requireAdmin, deleteCity);

export default router;
