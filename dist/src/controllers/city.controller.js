"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCity = exports.updateCity = exports.createCity = exports.getCities = void 0;
const prisma_1 = require("../config/prisma");
const getCities = async (req, res) => {
    try {
        const cities = await prisma_1.prisma.city.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(cities);
    }
    catch (error) {
        console.error('Failed to get cities:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch cities' });
    }
};
exports.getCities = getCities;
const createCity = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            res.status(400).json({ success: false, message: 'City name is required' });
            return;
        }
        const city = await prisma_1.prisma.city.create({
            data: { name }
        });
        res.status(201).json(city);
    }
    catch (error) {
        console.error('Failed to create city:', error);
        res.status(500).json({ success: false, message: 'Failed to create city' });
    }
};
exports.createCity = createCity;
const updateCity = async (req, res) => {
    try {
        const id = req.params.id;
        const { name } = req.body;
        if (!name) {
            res.status(400).json({ success: false, message: 'City name is required' });
            return;
        }
        const city = await prisma_1.prisma.city.update({
            where: { id },
            data: { name }
        });
        res.json(city);
    }
    catch (error) {
        console.error('Failed to update city:', error);
        res.status(500).json({ success: false, message: 'Failed to update city' });
    }
};
exports.updateCity = updateCity;
const deleteCity = async (req, res) => {
    try {
        const id = req.params.id;
        await prisma_1.prisma.city.delete({
            where: { id }
        });
        res.json({ success: true, message: 'City deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete city:', error);
        res.status(500).json({ success: false, message: 'Failed to delete city' });
    }
};
exports.deleteCity = deleteCity;
