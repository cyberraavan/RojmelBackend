"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const party_controller_1 = require("../controllers/party.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken); // Protect all party routes
router.get('/', party_controller_1.getParties);
router.get('/:id', party_controller_1.getPartyById);
router.post('/', (0, validation_1.validateBody)(schemas_1.createPartySchema), party_controller_1.createParty);
router.put('/:id', (0, validation_1.validateBody)(schemas_1.createPartySchema), party_controller_1.updateParty);
router.delete('/:id', party_controller_1.deleteParty);
exports.default = router;
