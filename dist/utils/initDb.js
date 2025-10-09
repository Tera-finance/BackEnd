"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./database");
async function initializeDatabase() {
    try {
        console.log('Initializing database schema...');
        // Read SQL schema file
        const schemaPath = path_1.default.join(__dirname, '../../sql/schema.sql');
        const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
        // Execute schema
        await database_1.pgPool.query(schema);
        console.log('Database schema initialized successfully');
    }
    catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}
// Run this function when needed
if (require.main === module) {
    initializeDatabase()
        .then(() => {
        console.log('Database initialization complete');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Database initialization failed:', error);
        process.exit(1);
    });
}
