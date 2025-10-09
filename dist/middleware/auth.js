"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireKYC = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../utils/config");
const database_1 = require("../utils/database");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access token required' });
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        const user = await (0, database_1.queryOne)('SELECT * FROM users WHERE id = ?', [decoded.userId]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (user.status === 'SUSPENDED') {
            return res.status(403).json({ error: 'Account suspended' });
        }
        req.user = {
            id: user.id,
            whatsappNumber: user.whatsapp_number
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
const requireKYC = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const user = await (0, database_1.queryOne)('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!user || user.status !== 'VERIFIED') {
            return res.status(403).json({ error: 'KYC verification required' });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requireKYC = requireKYC;
