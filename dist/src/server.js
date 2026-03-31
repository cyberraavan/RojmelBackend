"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// @ts-ignore - Forcing IDE rebuild cache for this import
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const party_routes_1 = __importDefault(require("./routes/party.routes"));
const vehicle_routes_1 = __importDefault(require("./routes/vehicle.routes"));
const goodsType_routes_1 = __importDefault(require("./routes/goodsType.routes"));
const shipment_routes_1 = __importDefault(require("./routes/shipment.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const city_routes_1 = __importDefault(require("./routes/city.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Main Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/parties', party_routes_1.default);
app.use('/api/vehicles', vehicle_routes_1.default);
app.use('/api/goods-types', goodsType_routes_1.default);
app.use('/api/shipments', shipment_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/cities', city_routes_1.default);
// Base route test
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'ROJMEL API is running locally via SQLite.'
    });
});
// Centralized error handler
app.use(errorHandler_1.errorHandler);
// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
