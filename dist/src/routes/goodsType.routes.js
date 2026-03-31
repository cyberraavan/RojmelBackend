"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const goodsType_controller_1 = require("../controllers/goodsType.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken); // Protect all goods types routes
router.get('/', goodsType_controller_1.getGoodsTypes);
router.post('/', (0, validation_1.validateBody)(schemas_1.createGoodsTypeSchema), goodsType_controller_1.createGoodsType);
router.put('/:id', (0, validation_1.validateBody)(schemas_1.createGoodsTypeSchema), goodsType_controller_1.updateGoodsType);
router.delete('/:id', goodsType_controller_1.deleteGoodsType);
exports.default = router;
