import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import * as xlsx from 'xlsx';

const REQUIRED_COLUMNS = ['Date', 'Party', 'Vehicle', 'Goods Type', 'Price'] as const;

export const exportShipments = async (req: Request, res: Response) => {
    try {
        const shipments = await prisma.shipment.findMany({
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to export shipments' });
    }
};

export const importShipments = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No Excel file uploaded' });
            return;
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rows: Record<string, unknown>[] = xlsx.utils.sheet_to_json(worksheet);

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
        const errors: string[] = [];

        const partyCache = new Map<string, { id: string }>();
        const vehicleCache = new Map<string, { id: string }>();
        const goodsTypeCache = new Map<string, { id: string }>();

        const getOrCreateParty = async (name: string): Promise<{ id: string }> => {
            const trimmed = name.trim();
            if (partyCache.has(trimmed)) return partyCache.get(trimmed)!;
            const existing = await prisma.party.findFirst({ where: { name: trimmed } });
            if (existing) {
                partyCache.set(trimmed, { id: existing.id });
                return { id: existing.id };
            }
            const created = await prisma.party.create({
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

        const getOrCreateVehicle = async (numberPlate: string): Promise<{ id: string }> => {
            const trimmed = numberPlate.trim();
            if (vehicleCache.has(trimmed)) return vehicleCache.get(trimmed)!;
            const existing = await prisma.vehicle.findFirst({ where: { numberPlate: trimmed } });
            if (existing) {
                vehicleCache.set(trimmed, { id: existing.id });
                return { id: existing.id };
            }
            const created = await prisma.vehicle.create({
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

        const getOrCreateGoodsType = async (name: string): Promise<{ id: string }> => {
            const trimmed = name.trim();
            if (goodsTypeCache.has(trimmed)) return goodsTypeCache.get(trimmed)!;
            const existing = await prisma.goodsType.findFirst({ where: { name: trimmed } });
            if (existing) {
                goodsTypeCache.set(trimmed, { id: existing.id });
                return { id: existing.id };
            }
            const created = await prisma.goodsType.create({
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
                    errors.push(
                        `Row ${rowNumber}: Missing required fields (Date, Party, Vehicle, or Goods Type).`
                    );
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

                let customId: string | null = null;
                let attempt = 0;
                const maxAttempts = 5;
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    attempt += 1;

                    if (!customId) {
                        const latestShipment = await prisma.shipment.findFirst({
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
                        await prisma.shipment.create({
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
                    } catch (err: unknown) {
                        if (
                            err instanceof Prisma.PrismaClientKnownRequestError &&
                            err.code === 'P2002' &&
                            Array.isArray((err.meta as any)?.target) &&
                            (err.meta as any).target.includes('customId')
                        ) {
                            if (attempt >= maxAttempts) {
                                errors.push(
                                    `Row ${rowNumber}: Failed to generate unique shipment ID after multiple attempts.`
                                );
                                break;
                            }
                            customId = null;
                            continue;
                        }
                        throw err;
                    }
                }
            } catch (err: any) {
                errors.push(`Row ${rowNumber}: ${err.message}`);
            }
        }

        res.json({
            success: true,
            message: `Successfully imported ${successCount} shipments`,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to process Excel import' });
    }
};

export const exportFullDatabase = async (req: Request, res: Response) => {
    try {
        const workbook = xlsx.utils.book_new();

        // 1. Shipments
        const shipments = await prisma.shipment.findMany({
            include: { party: true, vehicle: true, goodsType: true },
            orderBy: { createdAt: 'desc' },
        });
        const shipmentsData = shipments.map(s => ({
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
            Status: s.status || 'PENDING',
        }));
        xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(shipmentsData), 'Shipments');

        // 2. Parties
        const parties = await prisma.party.findMany({ orderBy: { createdAt: 'desc' } });
        const partiesData = parties.map(p => ({
            Name: p.name,
            'Company Type': p.companyType,
            Phone: p.phone,
            Address: p.address,
            Description: p.description || ''
        }));
        xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(partiesData), 'Parties');

        // 3. Vehicles
        const vehicles = await prisma.vehicle.findMany({ orderBy: { createdAt: 'desc' } });
        const vehiclesData = vehicles.map(v => ({
            'Number Plate': v.numberPlate,
            'Owner Name': v.ownerName,
            'Owner Phone': v.ownerPhone,
            Capacity: v.capacity,
            Notes: v.notes || ''
        }));
        xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(vehiclesData), 'Vehicles');

        // 4. Goods Types
        const goodsTypes = await prisma.goodsType.findMany({ orderBy: { createdAt: 'desc' } });
        const goodsTypesData = goodsTypes.map(g => ({
            Name: g.name,
            Notes: g.notes || ''
        }));
        xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(goodsTypesData), 'Goods Types');

        // 5. Cities
        const cities = await prisma.city.findMany({ orderBy: { createdAt: 'desc' } });
        const citiesData = cities.map(c => ({
            Name: c.name
        }));
        xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(citiesData), 'Cities');

        // 6. Users
        const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
        const usersData = users.map(u => ({
            Username: u.username,
            Role: u.role
        }));
        xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(usersData), 'Users');

        const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename="Full_Database_Backup.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error("Full DB Export Error:", error);
        res.status(500).json({ success: false, message: 'Failed to export full database' });
    }
};

