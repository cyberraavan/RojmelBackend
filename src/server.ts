import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// @ts-ignore - Forcing IDE rebuild cache for this import
import authRoutes from './routes/auth.routes';
import partyRoutes from './routes/party.routes';
import vehicleRoutes from './routes/vehicle.routes';
import goodsTypeRoutes from './routes/goodsType.routes';
import shipmentRoutes from './routes/shipment.routes';
import userRoutes from './routes/user.routes';
import cityRoutes from './routes/city.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/goods-types', goodsTypeRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cities', cityRoutes);

// Base route test
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'ROJMEL API is running locally via SQLite.'
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});