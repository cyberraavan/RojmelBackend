"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicle_controller_1 = require("../controllers/vehicle.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken); // Protect all vehicle routes
router.get('/', vehicle_controller_1.getVehicles);
router.get('/:id', vehicle_controller_1.getVehicleById);
router.post('/', (0, validation_1.validateBody)(schemas_1.createVehicleSchema), vehicle_controller_1.createVehicle);
router.put('/:id', (0, validation_1.validateBody)(schemas_1.createVehicleSchema), vehicle_controller_1.updateVehicle);
router.delete('/:id', vehicle_controller_1.deleteVehicle);
exports.default = router;
