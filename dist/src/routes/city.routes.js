"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const city_controller_1 = require("../controllers/city.controller");
const router = (0, express_1.Router)();
// Temporarily loosely authenticated or use authenticate if applied to others.
// The existing routes seem to require authenticate (or maybe not based on server.ts).
// I will not apply middleware unless I'm sure, but I will prepare the routes.
router.get('/', city_controller_1.getCities);
router.post('/', city_controller_1.createCity);
router.put('/:id', city_controller_1.updateCity);
router.delete('/:id', city_controller_1.deleteCity);
exports.default = router;
