"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const shipment_controller_1 = require("../controllers/shipment.controller");
const excel_controller_1 = require("../controllers/excel.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.use(auth_middleware_1.authenticateToken); // Protect all shipment routes
router.get('/export', excel_controller_1.exportShipments);
router.post('/import', upload.single('file'), excel_controller_1.importShipments);
router.get('/', shipment_controller_1.getShipments);
router.post('/', (0, validation_1.validateBody)(schemas_1.createShipmentSchema), shipment_controller_1.createShipment);
router.put('/:id', (0, validation_1.validateBody)(schemas_1.createShipmentSchema), shipment_controller_1.updateShipment);
router.patch('/:id/ship', (0, validation_1.validateBody)(schemas_1.shipShipmentSchema), shipment_controller_1.shipShipment);
router.get('/filter/date', shipment_controller_1.getShipmentsByDate);
router.get('/party/:partyId', shipment_controller_1.getShipmentsByParty);
router.get('/vehicle/:vehicleId', shipment_controller_1.getShipmentsByVehicle);
router.delete('/:id', shipment_controller_1.deleteShipment);
exports.default = router;
