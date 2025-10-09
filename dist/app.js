"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./utils/config");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const cardano_routes_1 = __importDefault(require("./routes/cardano.routes"));
const exchange_routes_1 = __importDefault(require("./routes/exchange.routes"));
const transfer_routes_1 = __importDefault(require("./routes/transfer.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'TrustBridge Backend API',
        version: '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/cardano', cardano_routes_1.default);
app.use('/api/exchange', exchange_routes_1.default);
app.use('/api/transfer', transfer_routes_1.default);
app.use('/api/transactions', transaction_routes_1.default);
// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    // Multer error handling
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large' });
    }
    if (err.message === 'Only image files are allowed') {
        return res.status(400).json({ error: err.message });
    }
    // Default error response
    res.status(err.status || 500).json({
        error: config_1.config.nodeEnv === 'production'
            ? 'Internal server error'
            : err.message || 'Internal server error',
        ...(config_1.config.nodeEnv === 'development' && { stack: err.stack })
    });
});
exports.default = app;
