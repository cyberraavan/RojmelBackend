import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

type CreateOrUpdateShipmentBody = {
    date: string;
    partyId?: string;
    partyName?: string;
    vehicleId?: string;
    vehicle?: string;
    goodsTypeId?: string;
    goodsType: string;
    size: string;
    weight: string;
    weightUnit?: string;
    price: number | string;
    priceType?: string;
    pricePerKg?: number | string;
    deliveryCity: string;
    deliveryType?: string;
    notes?: string;
    status?: string;
    shippedDate?: string | null;
    dispatchedDate?: string | null;
    loadingVehicle?: string | null;
};

// Helper: convert Date to YYYY-MM-DD string for frontend compatibility
const formatDateForClient = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Helper: build DTO expected by frontend
const toShipmentDto = (shipment: any) => {
    return {
        id: shipment.id,
        customId: shipment.customId,
        date: formatDateForClient(shipment.date),
        partyName: shipment.party?.name ?? '',
        goodsType: shipment.goodsType?.name ?? '',
        size: shipment.size,
        weight: shipment.weight,
        weightUnit: shipment.weightUnit ?? 'KG',
        price: shipment.price,
        priceType: shipment.priceType ?? 'TOTAL',
        pricePerKg: shipment.pricePerKg,
        deliveryCity: shipment.deliveryCity,
        deliveryType: shipment.deliveryType ?? 'DD',
        vehicle: shipment.vehicle?.numberPlate ?? '',
        status: shipment.status ?? 'PENDING',
        shippedDate: shipment.shippedDate ? formatDateForClient(shipment.shippedDate) : (shipment.dispatchedDate ? formatDateForClient(shipment.dispatchedDate) : null),
        dispatchedDate: shipment.dispatchedDate ? formatDateForClient(shipment.dispatchedDate) : null,
        loadingVehicle: shipment.loadingVehicle ?? null,
        notes: shipment.notes ?? '',
    };
};

// Helper function to generate YYYYMMDDXXX shipment ID
const generateShipmentId = async (dateStr: string): Promise<string> => {
    const dateObj = new Date(dateStr);
    const yyyy = dateObj.getFullYear().toString();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');

    const prefix = `${yyyy}${mm}${dd}`;

    const latestShipment = await prisma.shipment.findFirst({
        where: {
            customId: {
                startsWith: prefix,
            },
        },
        orderBy: {
            customId: 'desc',
        },
    });

    let sequence = 1;
    if (latestShipment) {
        const lastSequenceStr = latestShipment.customId.slice(-3);
        sequence = parseInt(lastSequenceStr, 10) + 1;
    }

    const sequenceStr = String(sequence).padStart(3, '0');
    return `${prefix}${sequenceStr}`;
};

// Resolve Party ID from either explicit ID or name (creating a placeholder if needed)
const resolvePartyId = async (partyId?: string, partyName?: string): Promise<string> => {
    if (partyId) return partyId;
    if (!partyName) {
        throw new Error('Either partyId or partyName must be provided');
    }

    const existing = await prisma.party.findFirst({ where: { name: partyName } });
    if (existing) return existing.id;

    const created = await prisma.party.create({
        data: {
            name: partyName,
            companyType: 'Imported',
            phone: 'Unknown',
            address: 'Unknown',
        },
    });
    return created.id;
};

// Resolve Vehicle ID from either explicit ID or number plate (creating a placeholder if needed)
const resolveVehicleId = async (vehicleId?: string, vehicle?: string): Promise<string> => {
    if (vehicleId) return vehicleId;
    if (!vehicle) {
        throw new Error('Either vehicleId or vehicle must be provided');
    }

    const existing = await prisma.vehicle.findFirst({ where: { numberPlate: vehicle } });
    if (existing) return existing.id;

    const created = await prisma.vehicle.create({
        data: {
            numberPlate: vehicle,
            ownerName: 'Imported Owner',
            ownerPhone: 'Unknown',
            capacity: 'Unknown',
        },
    });
    return created.id;
};

// Resolve GoodsType ID from either explicit ID or name (creating if needed)
const resolveGoodsTypeId = async (goodsTypeId?: string, goodsTypeName?: string): Promise<string> => {
    if (goodsTypeId) return goodsTypeId;
    if (!goodsTypeName) {
        throw new Error('goodsType (name) is required');
    }

    const existing = await prisma.goodsType.findFirst({ where: { name: goodsTypeName } });
    if (existing) return existing.id;

    const created = await prisma.goodsType.create({
        data: {
            name: goodsTypeName,
        },
    });
    return created.id;
};

// Create shipment with retry on customId unique constraint collision
const createShipmentWithRetry = async (data: Omit<CreateOrUpdateShipmentBody, 'partyName' | 'vehicle' | 'goodsType'> & {
    partyId: string;
    vehicleId: string;
    goodsTypeId: string;
}): Promise<any> => {
    const maxAttempts = 5;
    let attempt = 0;
    // We assume data.date is the original date string
    // eslint-disable-next-line no-constant-condition
    while (true) {
        attempt += 1;
        const customId = await generateShipmentId(data.date);
        try {
            const shipment = await prisma.shipment.create({
                data: {
                    customId,
                    date: new Date(data.date),
                    partyId: data.partyId,
                    vehicleId: data.vehicleId,
                    goodsTypeId: data.goodsTypeId,
                    size: data.size,
                    weight: data.weight,
                    weightUnit: data.weightUnit,
                    price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
                    priceType: data.priceType,
                    pricePerKg: data.pricePerKg ? (typeof data.pricePerKg === 'string' ? parseFloat(data.pricePerKg) : data.pricePerKg) : null,
                    deliveryCity: data.deliveryCity,
                    deliveryType: data.deliveryType,
                    status: data.status || 'PENDING',
                    shippedDate: data.shippedDate ? new Date(data.shippedDate) : null,
                    dispatchedDate: data.dispatchedDate ? new Date(data.dispatchedDate) : null,
                    loadingVehicle: data.loadingVehicle || null,
                    notes: data.notes,
                },
                include: {
                    party: true,
                    vehicle: true,
                    goodsType: true,
                },
            });
            return shipment;
        } catch (error: unknown) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                Array.isArray((error.meta as any)?.target) &&
                (error.meta as any).target.includes('customId')
            ) {
                if (attempt >= maxAttempts) {
                    throw new Error('Failed to generate unique shipment ID after multiple attempts');
                }
                continue;
            }
            throw error;
        }
    }
};

export const getShipments = async (req: Request, res: Response) => {
    try {
        const pageRaw = req.query.page as string | undefined;
        const limitRaw = req.query.limit as string | undefined;

        const baseQuery = {
            include: {
                party: true,
                vehicle: true,
                goodsType: true,
            },
            orderBy: { createdAt: 'desc' as const },
        };

        if (pageRaw && limitRaw) {
            const page = Math.max(parseInt(pageRaw, 10) || 1, 1);
            const limit = Math.max(parseInt(limitRaw, 10) || 1, 1);
            const skip = (page - 1) * limit;

            const [items, total] = await Promise.all([
                prisma.shipment.findMany({
                    ...baseQuery,
                    skip,
                    take: limit,
                }),
                prisma.shipment.count(),
            ]);

            res.json({
                success: true,
                data: items.map(toShipmentDto),
                page,
                limit,
                total,
            });
            return;
        }

        const shipments = await prisma.shipment.findMany(baseQuery);
        res.json(shipments.map(toShipmentDto));
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch shipments' });
    }
};

export const createShipment = async (req: Request<unknown, unknown, CreateOrUpdateShipmentBody>, res: Response) => {
    try {
        const body = req.body;

        const partyId = await resolvePartyId(body.partyId, body.partyName);
        const vehicleId = await resolveVehicleId(body.vehicleId, body.vehicle);
        const goodsTypeId = await resolveGoodsTypeId(body.goodsTypeId, body.goodsType);

        const shipment = await createShipmentWithRetry({
            date: body.date,
            partyId,
            vehicleId,
            goodsTypeId,
            size: body.size,
            weight: body.weight,
            weightUnit: body.weightUnit,
            price: body.price,
            priceType: body.priceType,
            pricePerKg: body.pricePerKg,
            deliveryCity: body.deliveryCity,
            deliveryType: body.deliveryType,
            notes: body.notes,
        });

        res.status(201).json(toShipmentDto(shipment));
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create shipment' });
    }
};

export const updateShipment = async (req: Request<{ id: string }, unknown, CreateOrUpdateShipmentBody>, res: Response) => {
    try {
        const { id } = req.params;
        const body = req.body;

        const partyId = await resolvePartyId(body.partyId, body.partyName);
        const vehicleId = await resolveVehicleId(body.vehicleId, body.vehicle);
        const goodsTypeId = await resolveGoodsTypeId(body.goodsTypeId, body.goodsType);

        const updated = await prisma.shipment.update({
            where: { id },
            data: {
                date: new Date(body.date),
                partyId,
                vehicleId,
                goodsTypeId,
                size: body.size,
                weight: body.weight,
                weightUnit: body.weightUnit,
                price: typeof body.price === 'string' ? parseFloat(body.price) : body.price,
                priceType: body.priceType,
                pricePerKg: body.pricePerKg ? (typeof body.pricePerKg === 'string' ? parseFloat(body.pricePerKg) : body.pricePerKg) : null,
                deliveryCity: body.deliveryCity,
                deliveryType: body.deliveryType,
                status: body.status || 'PENDING',
                shippedDate: body.shippedDate ? new Date(body.shippedDate) : null,
                dispatchedDate: body.dispatchedDate ? new Date(body.dispatchedDate) : null,
                loadingVehicle: body.loadingVehicle || null,
                notes: body.notes,
            },
            include: {
                party: true,
                vehicle: true,
                goodsType: true,
            },
        });

        res.json(toShipmentDto(updated));
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update shipment' });
    }
};

export const shipShipment = async (req: Request<{ id: string }, unknown, { vehicle: string; shippedDate: string; notes?: string }>, res: Response) => {
    try {
        const { id } = req.params;
        const { vehicle, shippedDate, notes } = req.body;

        const vehicleId = await resolveVehicleId(undefined, vehicle);

        const updated = await prisma.shipment.update({
            where: { id },
            data: {
                status: 'SHIPPED',
                vehicleId,
                shippedDate: new Date(shippedDate),
                notes: notes !== undefined ? notes : undefined
            },
            include: {
                party: true,
                vehicle: true,
                goodsType: true,
            },
        });

        res.json(toShipmentDto(updated));
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to ship shipment' });
    }
};

export const getShipmentsByDate = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        if (!date || typeof date !== 'string') {
            res.status(400).json({ success: false, message: 'Valid date query required' });
            return;
        }

        const startDate = new Date(date);
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setUTCHours(23, 59, 59, 999);

        const shipments = await prisma.shipment.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: { party: true, vehicle: true, goodsType: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(shipments.map(toShipmentDto));
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch shipments for date' });
    }
};

export const getShipmentsByParty = async (req: Request, res: Response) => {
    try {
        const { partyId } = req.params;
        const shipments = await prisma.shipment.findMany({
            where: { partyId: partyId as string },
            include: { party: true, vehicle: true, goodsType: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(shipments.map(toShipmentDto));
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch shipments for party' });
    }
};

export const getShipmentsByVehicle = async (req: Request, res: Response) => {
    try {
        const { vehicleId } = req.params;
        const shipments = await prisma.shipment.findMany({
            where: { vehicleId: vehicleId as string },
            include: { party: true, vehicle: true, goodsType: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(shipments.map(toShipmentDto));
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch shipments for vehicle' });
    }
};

export const deleteShipment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.shipment.delete({ where: { id: id as string } });
        res.json({ success: true, message: 'Shipment deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to delete shipment' });
    }
};

