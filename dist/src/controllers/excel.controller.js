"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.importShipments = exports.exportShipments = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
const xlsx = __importStar(require("xlsx"));
const REQUIRED_COLUMNS = ['Date', 'Party', 'Vehicle', 'Goods Type', 'Price'];
const exportShipments = async (req, res) => {
    try {
        const shipments = await prisma_1.prisma.shipment.findMany({
            include: {
                party: true,
                vehicle: true,
                goodsType: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const excelData = shipments.map((s) => ({
            'Shipment ID': s.customId,
            Date: s.date.toISOString().split('T')[0],
            Party: s.party.name,
            Vehicle: s.vehicle.numberPlate,
            'Goods Type': s.goodsType.name,
            Size: s.size,
            Weight: s.weight,
            Price: s.price,
            'Delivery City': s.deliveryCity,
            Notes: s.notes || '',
        }));
        const worksheet = xlsx.utils.json_to_sheet(excelData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Shipments');
        const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename="shipments.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to export shipments' });
    }
};
exports.exportShipments = exportShipments;
const importShipments = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No Excel file uploaded' });
            return;
        }
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(worksheet);
        if (rows.length === 0) {
            res.status(400).json({ success: false, message: 'Excel file is empty' });
            return;
        }
        const headerRow = Object.keys(rows[0] ?? {});
        const missingColumns = REQUIRED_COLUMNS.filter((col) => !headerRow.includes(col));
        if (missingColumns.length > 0) {
            res.status(400).json({
                success: false,
                message: `Excel file is missing required columns: ${missingColumns.join(', ')}`,
            });
            return;
        }
        let successCount = 0;
        const errors = [];
        const partyCache = new Map();
        const vehicleCache = new Map();
        const goodsTypeCache = new Map();
        const getOrCreateParty = async (name) => {
            const trimmed = name.trim();
            if (partyCache.has(trimmed))
                return partyCache.get(trimmed);
            const existing = await prisma_1.prisma.party.findFirst({ where: { name: trimmed } });
            if (existing) {
                partyCache.set(trimmed, { id: existing.id });
                return { id: existing.id };
            }
            const created = await prisma_1.prisma.party.create({
                data: {
                    name: trimmed,
                    companyType: 'Imported',
                    phone: 'Unknown',
                    address: 'Unknown',
                },
            });
            partyCache.set(trimmed, { id: created.id });
            return { id: created.id };
        };
        const getOrCreateVehicle = async (numberPlate) => {
            const trimmed = numberPlate.trim();
            if (vehicleCache.has(trimmed))
                return vehicleCache.get(trimmed);
            const existing = await prisma_1.prisma.vehicle.findFirst({ where: { numberPlate: trimmed } });
            if (existing) {
                vehicleCache.set(trimmed, { id: existing.id });
                return { id: existing.id };
            }
            const created = await prisma_1.prisma.vehicle.create({
                data: {
                    numberPlate: trimmed,
                    ownerName: 'Imported Owner',
                    ownerPhone: 'Unknown',
                    capacity: 'Unknown',
                },
            });
            vehicleCache.set(trimmed, { id: created.id });
            return { id: created.id };
        };
        const getOrCreateGoodsType = async (name) => {
            const trimmed = name.trim();
            if (goodsTypeCache.has(trimmed))
                return goodsTypeCache.get(trimmed);
            const existing = await prisma_1.prisma.goodsType.findFirst({ where: { name: trimmed } });
            if (existing) {
                goodsTypeCache.set(trimmed, { id: existing.id });
                return { id: existing.id };
            }
            const created = await prisma_1.prisma.goodsType.create({
                data: { name: trimmed },
            });
            goodsTypeCache.set(trimmed, { id: created.id });
            return { id: created.id };
        };
        for (const [index, row] of rows.entries()) {
            const rowNumber = index + 2; // header is row 1
            try {
                const dateRaw = row['Date'];
                const partyRaw = row['Party'];
                const vehicleRaw = row['Vehicle'];
                const goodsTypeRaw = row['Goods Type'];
                const priceRaw = row['Price'];
                if (!dateRaw || !partyRaw || !vehicleRaw || !goodsTypeRaw) {
                    errors.push(`Row ${rowNumber}: Missing required fields (Date, Party, Vehicle, or Goods Type).`);
                    continue;
                }
                const dateObj = new Date(String(dateRaw));
                if (Number.isNaN(dateObj.getTime())) {
                    errors.push(`Row ${rowNumber}: Invalid date value "${dateRaw}".`);
                    continue;
                }
                const priceNum = Number(priceRaw);
                if (Number.isNaN(priceNum)) {
                    errors.push(`Row ${rowNumber}: Price is not a valid number ("${priceRaw}").`);
                    continue;
                }
                const party = await getOrCreateParty(String(partyRaw));
                const vehicle = await getOrCreateVehicle(String(vehicleRaw));
                const goodsType = await getOrCreateGoodsType(String(goodsTypeRaw));
                const yyyy = dateObj.getFullYear().toString();
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                const prefix = `${yyyy}${mm}${dd}`;
                let customId = null;
                let attempt = 0;
                const maxAttempts = 5;
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    attempt += 1;
                    if (!customId) {
                        const latestShipment = await prisma_1.prisma.shipment.findFirst({
                            where: { customId: { startsWith: prefix } },
                            orderBy: { customId: 'desc' },
                        });
                        let sequence = 1;
                        if (latestShipment) {
                            const lastSequenceStr = latestShipment.customId.slice(-3);
                            sequence = parseInt(lastSequenceStr, 10) + 1;
                        }
                        const sequenceStr = String(sequence).padStart(3, '0');
                        customId = `${prefix}${sequenceStr}`;
                    }
                    try {
                        await prisma_1.prisma.shipment.create({
                            data: {
                                customId,
                                date: dateObj,
                                partyId: party.id,
                                vehicleId: vehicle.id,
                                goodsTypeId: goodsType.id,
                                size: String(row['Size'] || ''),
                                weight: String(row['Weight'] || ''),
                                price: priceNum,
                                deliveryCity: String(row['Delivery City'] || ''),
                                notes: String(row['Notes'] || ''),
                            },
                        });
                        successCount++;
                        break;
                    }
                    catch (err) {
                        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                            err.code === 'P2002' &&
                            Array.isArray(err.meta?.target) &&
                            err.meta.target.includes('customId')) {
                            if (attempt >= maxAttempts) {
                                errors.push(`Row ${rowNumber}: Failed to generate unique shipment ID after multiple attempts.`);
                                break;
                            }
                            customId = null;
                            continue;
                        }
                        throw err;
                    }
                }
            }
            catch (err) {
                errors.push(`Row ${rowNumber}: ${err.message}`);
            }
        }
        res.json({
            success: true,
            message: `Successfully imported ${successCount} shipments`,
            errors: errors.length > 0 ? errors : undefined,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to process Excel import' });
    }
};
exports.importShipments = importShipments;
