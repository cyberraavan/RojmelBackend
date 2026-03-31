import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getCities = async (req: Request, res: Response) => {
    try {
        const cities = await prisma.city.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(cities);
    } catch (error) {
        console.error('Failed to get cities:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch cities' });
    }
};

export const createCity = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) {
            res.status(400).json({ success: false, message: 'City name is required' });
            return;
        }

        const city = await prisma.city.create({
            data: { name }
        });
        res.status(201).json(city);
    } catch (error) {
        console.error('Failed to create city:', error);
        res.status(500).json({ success: false, message: 'Failed to create city' });
    }
};

export const updateCity = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ success: false, message: 'City name is required' });
            return;
        }

        const city = await prisma.city.update({
            where: { id },
            data: { name }
        });
        res.json(city);
    } catch (error) {
        console.error('Failed to update city:', error);
        res.status(500).json({ success: false, message: 'Failed to update city' });
    }
};

export const deleteCity = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.city.delete({
            where: { id }
        });
        res.json({ success: true, message: 'City deleted successfully' });
    } catch (error) {
        console.error('Failed to delete city:', error);
        res.status(500).json({ success: false, message: 'Failed to delete city' });
    }
};
