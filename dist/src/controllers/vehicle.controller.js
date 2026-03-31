"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicle = exports.updateVehicle = exports.createVehicle = exports.getVehicleById = exports.getVehicles = void 0;
const prisma_1 = require("../config/prisma");
const getVehicles = async (req, res) => {
    try {
        const vehicles = await prisma_1.prisma.vehicle.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(vehicles);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch vehicles' });
    }
};
exports.getVehicles = getVehicles;
const getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await prisma_1.prisma.vehicle.findUnique({ where: { id: id } });
        if (!vehicle) {
            res.status(404).json({ success: false, message: 'Vehicle not found' });
            return;
        }
        res.json(vehicle);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch vehicle' });
    }
};
exports.getVehicleById = getVehicleById;
const createVehicle = async (req, res) => {
    try {
        const { numberPlate, ownerName, ownerPhone, capacity, notes } = req.body;
        const vehicle = await prisma_1.prisma.vehicle.create({
            data: { numberPlate, ownerName, ownerPhone, capacity, notes },
        });
        res.status(201).json(vehicle);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create vehicle' });
    }
};
exports.createVehicle = createVehicle;
const updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const { numberPlate, ownerName, ownerPhone, capacity, notes } = req.body;
        const vehicle = await prisma_1.prisma.vehicle.update({
            where: { id: id },
            data: { numberPlate, ownerName, ownerPhone, capacity, notes },
        });
        res.json(vehicle);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update vehicle' });
    }
};
exports.updateVehicle = updateVehicle;
const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.vehicle.delete({ where: { id: id } });
        res.json({ success: true, message: 'Vehicle deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to delete vehicle' });
    }
};
exports.deleteVehicle = deleteVehicle;
