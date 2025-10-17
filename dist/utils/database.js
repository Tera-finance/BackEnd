import mysql from 'mysql2/promise';
import { config } from './config.js';
// Create MySQL connection pool with SSL configuration
const poolConfig = {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};
// Add SSL configuration if enabled
if (config.database.ssl) {
    poolConfig.ssl = {
        rejectUnauthorized: false // Accept self-signed certificates (Aiven, etc.)
    };
}
export const pool = mysql.createPool(poolConfig);
// Helper function to execute queries
export const query = async (sql, params) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
};
// Helper function to execute single row query
export const queryOne = async (sql, params) => {
    const rows = await query(sql, params);
    return rows.length > 0 ? rows[0] : null;
};
// Helper function to test connection
export const testConnection = async () => {
    try {
        await pool.query('SELECT 1');
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};
// Graceful shutdown
export const closePool = async () => {
    try {
        await pool.end();
        console.log('✅ MySQL connection pool closed');
    }
    catch (error) {
        console.error('❌ Error closing MySQL pool:', error);
    }
};
