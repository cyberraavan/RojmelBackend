import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

type PartyBody = {
    name: string;
    companyType: string;
    phone: string;
    address: string;
    description?: string;
};

export const getParties = async (req: Request, res: Response) => {
    try {
        const parties = await prisma.party.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(parties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch parties' });
    }
};

export const getPartyById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const party = await prisma.party.findUnique({ where: { id: id as string } });
        if (!party) {
            res.status(404).json({ success: false, message: 'Party not found' });
            return;
        }
        res.json(party);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch party' });
    }
};

export const createParty = async (req: Request<unknown, unknown, PartyBody>, res: Response) => {
    try {
        const { name, companyType, phone, address, description } = req.body;
        const party = await prisma.party.create({
            data: { name, companyType, phone, address, description },
        });
        res.status(201).json(party);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create party' });
    }
};

export const updateParty = async (
    req: Request<{ id: string }, unknown, PartyBody>,
    res: Response
) => {
    try {
        const { id } = req.params;
        const { name, companyType, phone, address, description } = req.body;
        const party = await prisma.party.update({
            where: { id: id as string },
            data: { name, companyType, phone, address, description },
        });
        res.json(party);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update party' });
    }
};

export const deleteParty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.party.delete({ where: { id: id as string } });
        res.json({ success: true, message: 'Party deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to delete party' });
    }
};

