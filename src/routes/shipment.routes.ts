import { Router } from 'express';
import multer from 'multer';
import {
    getShipments,
    createShipment,
    updateShipment,
    getShipmentsByDate,
    getShipmentsByParty,
    getShipmentsByVehicle,
    deleteShipment,
    shipShipment,
} from '../controllers/shipment.controller';
import { exportShipments, importShipments, exportFullDatabase } from '../controllers/excel.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation';
import { createShipmentSchema, shipShipmentSchema } from '../validation/schemas';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken); // Protect all shipment routes

router.get('/export', exportShipments);
router.get('/export-db', requireAdmin, exportFullDatabase);
router.post('/import', requireAdmin, upload.single('file'), importShipments);
router.get('/', getShipments);
router.post('/', requireAdmin, validateBody(createShipmentSchema), createShipment);
router.put('/:id', requireAdmin, validateBody(createShipmentSchema), updateShipment);
router.patch('/:id/ship', requireAdmin, validateBody(shipShipmentSchema), shipShipment);
router.get('/filter/date', getShipmentsByDate);
router.get('/party/:partyId', getShipmentsByParty);
router.get('/vehicle/:vehicleId', getShipmentsByVehicle);
router.delete('/:id', requireAdmin, deleteShipment);

export default router;

