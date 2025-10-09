"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    // MySQL Database Configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'trustbridge',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'trustbridge'
    },
    // Redis Cache
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    // JWT Authentication
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
        expiresIn: '15m',
        refreshExpiresIn: '7d'
    },
    // Cardano Blockchain
    cardano: {
        network: process.env.CARDANO_NETWORK || 'Preprod',
        blockfrostApiKey: process.env.BLOCKFROST_API_KEY || '',
        blockfrostUrl: process.env.BLOCKFROST_URL || 'https://cardano-preprod.blockfrost.io/api/v0',
        walletSeed: process.env.WALLET_SEED || ''
    },
    // Exchange Rates API (for fiat conversions)
    exchange: {
        apiKey: process.env.EXCHANGE_RATE_API_KEY || '',
        apiUrl: process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest'
    },
    // Encryption
    encryption: {
        key: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key'
    },
    // Rate Limiting
    rateLimiting: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
    }
};
