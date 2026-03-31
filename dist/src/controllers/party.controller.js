"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteParty = exports.updateParty = exports.createParty = exports.getPartyById = exports.getParties = void 0;
const prisma_1 = require("../config/prisma");
const getParties = async (req, res) => {
    try {
        const parties = await prisma_1.prisma.party.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(parties);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch parties' });
    }
};
exports.getParties = getParties;
const getPartyById = async (req, res) => {
    try {
        const { id } = req.params;
        const party = await prisma_1.prisma.party.findUnique({ where: { id: id } });
        if (!party) {
            res.status(404).json({ success: false, message: 'Party not found' });
            return;
        }
        res.json(party);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch party' });
    }
};
exports.getPartyById = getPartyById;
const createParty = async (req, res) => {
    try {
        const { name, companyType, phone, address, description } = req.body;
        const party = await prisma_1.prisma.party.create({
            data: { name, companyType, phone, address, description },
        });
        res.status(201).json(party);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create party' });
    }
};
exports.createParty = createParty;
const updateParty = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, companyType, phone, address, description } = req.body;
        const party = await prisma_1.prisma.party.update({
            where: { id: id },
            data: { name, companyType, phone, address, description },
        });
        res.json(party);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update party' });
    }
};
exports.updateParty = updateParty;
const deleteParty = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.party.delete({ where: { id: id } });
        res.json({ success: true, message: 'Party deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to delete party' });
    }
};
exports.deleteParty = deleteParty;
