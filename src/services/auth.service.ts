import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/config';
import { prisma } from '../utils/database';
import { redis } from '../utils/redis';
import { User } from '@prisma/client';

export class AuthService {
  static generateTokens(user: User) {
    const payload = {
      userId: user.id,
      whatsappNumber: user.whatsappNumber
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });

    return { accessToken, refreshToken };
  }

  static async createUser(whatsappNumber: string, countryCode: string): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { whatsappNumber }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    return await prisma.user.create({
      data: {
        id: uuidv4(),
        whatsappNumber,
        countryCode,
        status: 'PENDING_KYC'
      }
    });
  }

  static async loginOrRegister(whatsappNumber: string, countryCode: string = 'ID') {
    let user = await prisma.user.findUnique({
      where: { whatsappNumber }
    });

    if (!user) {
      user = await this.createUser(whatsappNumber, countryCode);
    }

    const tokens = this.generateTokens(user);
    
    // Store refresh token in Redis
    await redis.setex(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, tokens.refreshToken);

    return { user, tokens };
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
      
      // Check if refresh token exists in Redis
      const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const tokens = this.generateTokens(user);
      
      // Update refresh token in Redis
      await redis.setex(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async logout(userId: string) {
    await redis.del(`refresh_token:${userId}`);
  }
}