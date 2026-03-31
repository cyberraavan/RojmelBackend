"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserSchema = exports.createGoodsTypeSchema = exports.createVehicleSchema = exports.createPartySchema = exports.shipShipmentSchema = exports.createShipmentSchema = void 0;
const zod_1 = require("zod");
exports.createShipmentSchema = zod_1.z
    .object({
    date: zod_1.z.string().min(1, 'Date is required'),
    partyId: zod_1.z.string().optional(),
    partyName: zod_1.z.string().optional(),
    vehicleId: zod_1.z.string().optional(),
    vehicle: zod_1.z.string().optional(),
    goodsTypeId: zod_1.z.string().optional(),
    goodsType: zod_1.z.string().min(1, 'Goods type is required'),
    size: zod_1.z.string().min(1, 'Size is required'),
    weight: zod_1.z.string().min(1, 'Weight is required'),
    weightUnit: zod_1.z.string().optional(),
    price: zod_1.z
        .union([zod_1.z.number(), zod_1.z.string()])
        .refine((val) => !Number.isNaN(Number(val)), {
        message: 'Price must be a valid number',
    }),
    priceType: zod_1.z.string().optional(),
    pricePerKg: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).nullable().optional(),
    deliveryCity: zod_1.z.string().min(1, 'Delivery city is required'),
    deliveryType: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
})
    .refine((data) => data.partyId || data.partyName, {
    message: 'Either partyId or partyName is required',
    path: ['partyId'],
})
    .refine((data) => data.vehicleId || data.vehicle, {
    message: 'Either vehicleId or vehicle is required',
    path: ['vehicleId'],
});
exports.shipShipmentSchema = zod_1.z.object({
    vehicle: zod_1.z.string().min(1, 'Vehicle is required'),
    dispatchedDate: zod_1.z.string().min(1, 'Dispatched date is required'),
});
exports.createPartySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    companyType: zod_1.z.string().min(1, 'Company type is required'),
    phone: zod_1.z.string().min(1, 'Phone is required'),
    address: zod_1.z.string().min(1, 'Address is required'),
    description: zod_1.z.string().optional(),
});
exports.createVehicleSchema = zod_1.z.object({
    numberPlate: zod_1.z.string().min(1, 'Number plate is required'),
    ownerName: zod_1.z.string().min(1, 'Owner name is required'),
    ownerPhone: zod_1.z.string().min(1, 'Owner phone is required'),
    capacity: zod_1.z.string().min(1, 'Capacity is required'),
    notes: zod_1.z.string().optional(),
});
exports.createGoodsTypeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    notes: zod_1.z.string().optional(),
});
exports.createUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'Username is required'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    role: zod_1.z.string().default('admin'),
});
