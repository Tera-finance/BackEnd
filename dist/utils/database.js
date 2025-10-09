"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePool = exports.testConnection = exports.queryOne = exports.query = exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const config_1 = require("./config");
// Create MySQL connection pool
exports.pool = promise_1.default.createPool({
    host: config_1.config.database.host,
    port: config_1.config.database.port,
    user: config_1.config.database.user,
    password: config_1.config.database.password,
    database: config_1.config.database.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});
// Helper function to execute queries
const query = async (sql, params) => {
    const [rows] = await exports.pool.execute(sql, params);
    return rows;
};
exports.query = query;
// Helper function to execute single row query
const queryOne = async (sql, params) => {
    const rows = await (0, exports.query)(sql, params);
    return rows.length > 0 ? rows[0] : null;
};
exports.queryOne = queryOne;
// Helper function to test connection
const testConnection = async () => {
    try {
        await exports.pool.query('SELECT 1');
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};
exports.testConnection = testConnection;
// Graceful shutdown
const closePool = async () => {
    try {
        await exports.pool.end();
        console.log('✅ MySQL connection pool closed');
    }
    catch (error) {
        console.error('❌ Error closing MySQL pool:', error);
    }
};
exports.closePool = closePool;
