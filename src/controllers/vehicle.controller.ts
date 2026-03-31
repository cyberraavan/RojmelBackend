import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

type VehicleBody = {
    numberPlate: string;
    ownerName: string;
    ownerPhone: string;
    capacity: string;
    notes?: string;
};

export const getVehicles = async (req: Request, res: Response) => {
    try {
        const vehicles = await prisma.vehicle.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch vehicles' });
    }
};

export const getVehicleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const vehicle = await prisma.vehicle.findUnique({ where: { id: id as string } });
        if (!vehicle) {
            res.status(404).json({ success: false, message: 'Vehicle not found' });
            return;
        }
        res.json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch vehicle' });
    }
};

export const createVehicle = async (req: Request<unknown, unknown, VehicleBody>, res: Response) => {
    try {
        const { numberPlate, ownerName, ownerPhone, capacity, notes } = req.body;
        const vehicle = await prisma.vehicle.create({
            data: { numberPlate, ownerName, ownerPhone, capacity, notes },
        });
        res.status(201).json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create vehicle' });
    }
};

export const updateVehicle = async (
    req: Request<{ id: string }, unknown, VehicleBody>,
    res: Response
) => {
    try {
        const { id } = req.params;
        const { numberPlate, ownerName, ownerPhone, capacity, notes } = req.body;
        const vehicle = await prisma.vehicle.update({
            where: { id: id as string },
            data: { numberPlate, ownerName, ownerPhone, capacity, notes },
        });
        res.json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update vehicle' });
    }
};

export const deleteVehicle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.vehicle.delete({ where: { id: id as string } });
        res.json({ success: true, message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to delete vehicle' });
    }
};

