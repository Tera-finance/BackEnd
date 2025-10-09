"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./utils/config");
const database_1 = require("./utils/database");
const redis_1 = require("./utils/redis");
async function startServer() {
    try {
        // Test MySQL database connection
        const dbConnected = await (0, database_1.testConnection)();
        if (dbConnected) {
            console.log('✅ Connected to MySQL database');
        }
        else {
            console.warn('⚠️  MySQL connection test failed');
        }
        // Test Redis connection
        await redis_1.redis.ping();
        console.log('✅ Connected to Redis');
        // Start server
        const server = app_1.default.listen(config_1.config.port, () => {
            console.log(`🚀 TrustBridge Backend running on port ${config_1.config.port}`);
            console.log(`🌍 Environment: ${config_1.config.nodeEnv}`);
            console.log(`� Cardano Network: ${config_1.config.cardano.network}`);
            console.log(`💾 Database: MySQL`);
        });
        // Graceful shutdown
        const gracefulShutdown = (signal) => {
            console.log(`\n${signal} received. Starting graceful shutdown...`);
            server.close(async () => {
                console.log('HTTP server closed.');
                try {
                    await (0, database_1.closePool)();
                    console.log('MySQL connection pool closed.');
                    await redis_1.redis.quit();
                    console.log('Redis connection closed.');
                    console.log('Graceful shutdown completed.');
                    process.exit(0);
                }
                catch (error) {
                    console.error('Error during shutdown:', error);
                    process.exit(1);
                }
            });
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
