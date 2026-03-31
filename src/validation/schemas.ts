import { z } from 'zod';

export const createShipmentSchema = z
  .object({
    date: z.string().min(1, 'Date is required'),
    partyId: z.string().optional(),
    partyName: z.string().optional(),
    vehicleId: z.string().optional(),
    vehicle: z.string().optional(),
    goodsTypeId: z.string().optional(),
    goodsType: z.string().min(1, 'Goods type is required'),
    size: z.string().min(1, 'Size is required'),
    weight: z.string().min(1, 'Weight is required'),
    weightUnit: z.string().optional(),
    price: z
      .union([z.number(), z.string()])
      .refine((val) => !Number.isNaN(Number(val)), {
        message: 'Price must be a valid number',
      }),
    priceType: z.string().optional(),
    pricePerKg: z.union([z.number(), z.string()]).nullable().optional(),
    deliveryCity: z.string().min(1, 'Delivery city is required'),
    deliveryType: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.partyId || data.partyName, {
    message: 'Either partyId or partyName is required',
    path: ['partyId'],
  })
  .refine((data) => data.vehicleId || data.vehicle, {
    message: 'Either vehicleId or vehicle is required',
    path: ['vehicleId'],
  });

export const shipShipmentSchema = z.object({
  vehicle: z.string().min(1, 'Vehicle is required'),
  shippedDate: z.string().min(1, 'Shipped date is required'),
  notes: z.string().optional(),
});

export const createPartySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyType: z.string().min(1, 'Company type is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  description: z.string().optional(),
});

export const createVehicleSchema = z.object({
  numberPlate: z.string().min(1, 'Number plate is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  ownerPhone: z.string().min(1, 'Owner phone is required'),
  capacity: z.string().min(1, 'Capacity is required'),
  notes: z.string().optional(),
});

export const createGoodsTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  notes: z.string().optional(),
});

export const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['admin', 'viewer']).default('admin'),
});

