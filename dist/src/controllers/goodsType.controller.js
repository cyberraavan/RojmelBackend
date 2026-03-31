"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGoodsType = exports.updateGoodsType = exports.createGoodsType = exports.getGoodsTypes = void 0;
const prisma_1 = require("../config/prisma");
const getGoodsTypes = async (req, res) => {
    try {
        const goodsTypes = await prisma_1.prisma.goodsType.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(goodsTypes);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch goods types' });
    }
};
exports.getGoodsTypes = getGoodsTypes;
const createGoodsType = async (req, res) => {
    try {
        const { name, notes } = req.body;
        const goodsType = await prisma_1.prisma.goodsType.create({
            data: { name, notes },
        });
        res.status(201).json(goodsType);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create goods type' });
    }
};
exports.createGoodsType = createGoodsType;
const updateGoodsType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, notes } = req.body;
        const goodsType = await prisma_1.prisma.goodsType.update({
            where: { id: id },
            data: { name, notes },
        });
        res.json(goodsType);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update goods type' });
    }
};
exports.updateGoodsType = updateGoodsType;
const deleteGoodsType = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.goodsType.delete({ where: { id: id } });
        res.json({ success: true, message: 'Goods type deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to delete goods type' });
    }
};
exports.deleteGoodsType = deleteGoodsType;
