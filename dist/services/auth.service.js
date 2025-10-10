import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/config.js';
import { query, queryOne } from '../utils/database.js';
import { redis } from '../utils/redis.js';
export class AuthService {
    static generateTokens(user) {
        const payload = {
            userId: user.id,
            whatsappNumber: user.whatsapp_number
        };
        const accessToken = jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn
        });
        const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn
        });
        return { accessToken, refreshToken };
    }
    static async createUser(whatsappNumber, countryCode) {
        const existingUser = await queryOne('SELECT * FROM users WHERE whatsapp_number = ?', [whatsappNumber]);
        if (existingUser) {
            throw new Error('User already exists');
        }
        const userId = uuidv4();
        await query(`INSERT INTO users (id, whatsapp_number, country_code, status) 
       VALUES (?, ?, ?, 'PENDING_KYC')`, [userId, whatsappNumber, countryCode]);
        const newUser = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
        if (!newUser) {
            throw new Error('Failed to create user');
        }
        return newUser;
    }
    static async loginOrRegister(whatsappNumber, countryCode = 'ID') {
        const user = await queryOne('SELECT * FROM users WHERE whatsapp_number = ?', [whatsappNumber]);
        if (!user) {
            return await this.createUser(whatsappNumber, countryCode);
        }
        return user;
    }
    static async getUserById(userId) {
        return await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    }
    static async updateUserStatus(userId, status) {
        await query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status, userId]);
        const updatedUser = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
        if (!updatedUser) {
            throw new Error('Failed to update user status');
        }
        return updatedUser;
    }
    static async storeRefreshToken(userId, refreshToken) {
        await redis.setex(`refresh_token:${userId}`, 7 * 24 * 60 * 60, refreshToken);
    }
    static async validateRefreshToken(userId, refreshToken) {
        const storedToken = await redis.get(`refresh_token:${userId}`);
        return storedToken === refreshToken;
    }
    static async revokeRefreshToken(userId) {
        await redis.del(`refresh_token:${userId}`);
    }
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, config.jwt.secret);
        }
        catch (error) {
            throw new Error('Invalid access token');
        }
    }
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, config.jwt.refreshSecret);
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
}
