import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/config.js';
import { query, queryOne, User } from '../utils/database.js';
import { redis } from '../utils/redis.js';

export class AuthService {
  static generateTokens(user: User) {
    const payload = {
      userId: user.id,
      whatsappNumber: user.whatsapp_number
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    } as SignOptions);

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    } as SignOptions);

    return { accessToken, refreshToken };
  }

  static async createUser(whatsappNumber: string, countryCode: string): Promise<User> {
    const existingUser = await queryOne<User>(
      'SELECT * FROM users WHERE whatsapp_number = ?',
      [whatsappNumber]
    );

    if (existingUser) {
      throw new Error('User already exists');
    }

    const userId = uuidv4();
    await query(
      `INSERT INTO users (id, whatsapp_number, country_code, status) 
       VALUES (?, ?, ?, 'PENDING_KYC')`,
      [userId, whatsappNumber, countryCode]
    );

    const newUser = await queryOne<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    return newUser;
  }

  static async loginOrRegister(whatsappNumber: string, countryCode: string = 'ID') {
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE whatsapp_number = ?',
      [whatsappNumber]
    );

    if (!user) {
      return await this.createUser(whatsappNumber, countryCode);
    }

    return user;
  }

  static async getUserById(userId: string): Promise<User | null> {
    return await queryOne<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
  }

  static async updateUserStatus(userId: string, status: 'PENDING_KYC' | 'VERIFIED' | 'SUSPENDED') {
    await query(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, userId]
    );

    const updatedUser = await queryOne<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!updatedUser) {
      throw new Error('Failed to update user status');
    }

    return updatedUser;
  }

  static async storeRefreshToken(userId: string, refreshToken: string) {
    await redis.setex(`refresh_token:${userId}`, 7 * 24 * 60 * 60, refreshToken);
  }

  static async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const storedToken = await redis.get(`refresh_token:${userId}`);
    return storedToken === refreshToken;
  }

  static async revokeRefreshToken(userId: string) {
    await redis.del(`refresh_token:${userId}`);
  }

  static verifyAccessToken(token: string) {
    try {
      return jwt.verify(token, config.jwt.secret) as any;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token: string) {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as any;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}