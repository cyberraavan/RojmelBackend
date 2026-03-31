import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

type GoodsTypeBody = {
    name: string;
    notes?: string;
};

export const getGoodsTypes = async (req: Request, res: Response) => {
    try {
        const goodsTypes = await prisma.goodsType.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(goodsTypes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch goods types' });
    }
};

export const createGoodsType = async (
    req: Request<unknown, unknown, GoodsTypeBody>,
    res: Response
) => {
    try {
        const { name, notes } = req.body;
        const goodsType = await prisma.goodsType.create({
            data: { name, notes },
        });
        res.status(201).json(goodsType);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create goods type' });
    }
};

export const updateGoodsType = async (
    req: Request<{ id: string }, unknown, GoodsTypeBody>,
    res: Response
) => {
    try {
        const { id } = req.params;
        const { name, notes } = req.body;
        const goodsType = await prisma.goodsType.update({
            where: { id: id as string },
            data: { name, notes },
        });
        res.json(goodsType);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update goods type' });
    }
};

export const deleteGoodsType = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.goodsType.delete({ where: { id: id as string } });
        res.json({ success: true, message: 'Goods type deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to delete goods type' });
    }
};

