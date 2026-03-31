import { Router } from 'express';
import { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicle.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation';
import { createVehicleSchema } from '../validation/schemas';

const router = Router();

router.use(authenticateToken); // Protect all vehicle routes

router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.post('/', requireAdmin, validateBody(createVehicleSchema), createVehicle);
router.put('/:id', requireAdmin, validateBody(createVehicleSchema), updateVehicle);
router.delete('/:id', requireAdmin, deleteVehicle);

export default router;

