"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const config_1 = require("../utils/config");
const database_1 = require("../utils/database");
const redis_1 = require("../utils/redis");
class AuthService {
    static generateTokens(user) {
        const payload = {
            userId: user.id,
            whatsappNumber: user.whatsapp_number
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
            expiresIn: config_1.config.jwt.expiresIn
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.refreshSecret, {
            expiresIn: config_1.config.jwt.refreshExpiresIn
        });
        return { accessToken, refreshToken };
    }
    static async createUser(whatsappNumber, countryCode) {
        const existingUser = await (0, database_1.queryOne)('SELECT * FROM users WHERE whatsapp_number = ?', [whatsappNumber]);
        if (existingUser) {
            throw new Error('User already exists');
        }
        const userId = (0, uuid_1.v4)();
        await (0, database_1.query)(`INSERT INTO users (id, whatsapp_number, country_code, status) 
       VALUES (?, ?, ?, 'PENDING_KYC')`, [userId, whatsappNumber, countryCode]);
        const newUser = await (0, database_1.queryOne)('SELECT * FROM users WHERE id = ?', [userId]);
        if (!newUser) {
            throw new Error('Failed to create user');
        }
        return newUser;
    }
    static async loginOrRegister(whatsappNumber, countryCode = 'ID') {
        const user = await (0, database_1.queryOne)('SELECT * FROM users WHERE whatsapp_number = ?', [whatsappNumber]);
        if (!user) {
            return await this.createUser(whatsappNumber, countryCode);
        }
        return user;
    }
    static async getUserById(userId) {
        return await (0, database_1.queryOne)('SELECT * FROM users WHERE id = ?', [userId]);
    }
    static async updateUserStatus(userId, status) {
        await (0, database_1.query)('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status, userId]);
        const updatedUser = await (0, database_1.queryOne)('SELECT * FROM users WHERE id = ?', [userId]);
        if (!updatedUser) {
            throw new Error('Failed to update user status');
        }
        return updatedUser;
    }
    static async storeRefreshToken(userId, refreshToken) {
        await redis_1.redis.setex(`refresh_token:${userId}`, 7 * 24 * 60 * 60, refreshToken);
    }
    static async validateRefreshToken(userId, refreshToken) {
        const storedToken = await redis_1.redis.get(`refresh_token:${userId}`);
        return storedToken === refreshToken;
    }
    static async revokeRefreshToken(userId) {
        await redis_1.redis.del(`refresh_token:${userId}`);
    }
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        }
        catch (error) {
            throw new Error('Invalid access token');
        }
    }
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret);
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
}
exports.AuthService = AuthService;
