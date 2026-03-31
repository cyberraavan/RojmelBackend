"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShipment = exports.getShipmentsByVehicle = exports.getShipmentsByParty = exports.getShipmentsByDate = exports.shipShipment = exports.updateShipment = exports.createShipment = exports.getShipments = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
// Helper: convert Date to YYYY-MM-DD string for frontend compatibility
const formatDateForClient = (date) => {
    return date.toISOString().split('T')[0];
};
// Helper: build DTO expected by frontend
const toShipmentDto = (shipment) => {
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
        dispatchedDate: shipment.dispatchedDate ? formatDateForClient(shipment.dispatchedDate) : null,
        loadingVehicle: shipment.loadingVehicle ?? null,
        notes: shipment.notes ?? '',
    };
};
// Helper function to generate YYYYMMDDXXX shipment ID
const generateShipmentId = async (dateStr) => {
    const dateObj = new Date(dateStr);
    const yyyy = dateObj.getFullYear().toString();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const prefix = `${yyyy}${mm}${dd}`;
    const latestShipment = await prisma_1.prisma.shipment.findFirst({
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
const resolvePartyId = async (partyId, partyName) => {
    if (partyId)
        return partyId;
    if (!partyName) {
        throw new Error('Either partyId or partyName must be provided');
    }
    const existing = await prisma_1.prisma.party.findFirst({ where: { name: partyName } });
    if (existing)
        return existing.id;
    const created = await prisma_1.prisma.party.create({
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
const resolveVehicleId = async (vehicleId, vehicle) => {
    if (vehicleId)
        return vehicleId;
    if (!vehicle) {
        throw new Error('Either vehicleId or vehicle must be provided');
    }
    const existing = await prisma_1.prisma.vehicle.findFirst({ where: { numberPlate: vehicle } });
    if (existing)
        return existing.id;
    const created = await prisma_1.prisma.vehicle.create({
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
const resolveGoodsTypeId = async (goodsTypeId, goodsTypeName) => {
    if (goodsTypeId)
        return goodsTypeId;
    if (!goodsTypeName) {
        throw new Error('goodsType (name) is required');
    }
    const existing = await prisma_1.prisma.goodsType.findFirst({ where: { name: goodsTypeName } });
    if (existing)
        return existing.id;
    const created = await prisma_1.prisma.goodsType.create({
        data: {
            name: goodsTypeName,
        },
    });
    return created.id;
};
// Create shipment with retry on customId unique constraint collision
const createShipmentWithRetry = async (data) => {
    const maxAttempts = 5;
    let attempt = 0;
    // We assume data.date is the original date string
    // eslint-disable-next-line no-constant-condition
    while (true) {
        attempt += 1;
        const customId = await generateShipmentId(data.date);
        try {
            const shipment = await prisma_1.prisma.shipment.create({
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
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002' &&
                Array.isArray(error.meta?.target) &&
                error.meta.target.includes('customId')) {
                if (attempt >= maxAttempts) {
                    throw new Error('Failed to generate unique shipment ID after multiple attempts');
                }
                continue;
            }
            throw error;
        }
    }
};
const getShipments = async (req, res) => {
    try {
        const pageRaw = req.query.page;
        const limitRaw = req.query.limit;
        const baseQuery = {
            include: {
                party: true,
                vehicle: true,
                goodsType: true,
            },
            orderBy: { createdAt: 'desc' },
        };
        if (pageRaw && limitRaw) {
            const page = Math.max(parseInt(pageRaw, 10) || 1, 1);
            const limit = Math.max(parseInt(limitRaw, 10) || 1, 1);
            const skip = (page - 1) * limit;
            const [items, total] = await Promise.all([
                prisma_1.prisma.shipment.findMany({
                    ...baseQuery,
                    skip,
                    take: limit,
                }),
                prisma_1.prisma.shipment.count(),
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
        const shipments = await prisma_1.prisma.shipment.findMany(baseQuery);
        res.json(shipments.map(toShipmentDto));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch shipments' });
    }
};
exports.getShipments = getShipments;
const createShipment = async (req, res) => {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create shipment' });
    }
};
exports.createShipment = createShipment;
const updateShipment = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const partyId = await resolvePartyId(body.partyId, body.partyName);
        const vehicleId = await resolveVehicleId(body.vehicleId, body.vehicle);
        const goodsTypeId = await resolveGoodsTypeId(body.goodsTypeId, body.goodsType);
        const updated = await prisma_1.prisma.shipment.update({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update shipment' });
    }
};
exports.updateShipment = updateShipment;
const shipShipment = async (req, res) => {
    try {
        const { id } = req.params;
        const { vehicle, dispatchedDate } = req.body;
        const vehicleId = await resolveVehicleId(undefined, vehicle);
        const updated = await prisma_1.prisma.shipment.update({
            where: { id },
            data: {
                status: 'SHIPPED',
                vehicleId,
                dispatchedDate: new Date(dispatchedDate)
            },
            include: {
                party: true,
                vehicle: true,
                goodsType: true,
            },
        });
        res.json(toShipmentDto(updated));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to ship shipment' });
    }
};
exports.shipShipment = shipShipment;
const getShipmentsByDate = async (req, res) => {
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
        const shipments = await prisma_1.prisma.shipment.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch shipments for date' });
    }
};
exports.getShipmentsByDate = getShipmentsByDate;
const getShipmentsByParty = async (req, res) => {
    try {
        const { partyId } = req.params;
        const shipments = await prisma_1.prisma.shipment.findMany({
            where: { partyId: partyId },
            include: { party: true, vehicle: true, goodsType: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(shipments.map(toShipmentDto));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch shipments for party' });
    }
};
exports.getShipmentsByParty = getShipmentsByParty;
const getShipmentsByVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const shipments = await prisma_1.prisma.shipment.findMany({
            where: { vehicleId: vehicleId },
            include: { party: true, vehicle: true, goodsType: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(shipments.map(toShipmentDto));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch shipments for vehicle' });
    }
};
exports.getShipmentsByVehicle = getShipmentsByVehicle;
const deleteShipment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.shipment.delete({ where: { id: id } });
        res.json({ success: true, message: 'Shipment deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to delete shipment' });
    }
};
exports.deleteShipment = deleteShipment;
