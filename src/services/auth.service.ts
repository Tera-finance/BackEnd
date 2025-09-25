import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/config';
import { supabase, User } from '../utils/database';
import { redis } from '../utils/redis';

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
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('whatsapp_number', whatsappNumber)
      .single();

    if (existingUser) {
      throw new Error('User already exists');
    }

    const now = new Date().toISOString();
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: uuidv4(),
        whatsapp_number: whatsappNumber,
        country_code: countryCode,
        status: 'PENDING_KYC',
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    return newUser as User;
  }

  static async loginOrRegister(whatsappNumber: string, countryCode: string = 'ID') {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('whatsapp_number', whatsappNumber)
      .single();

    if (!user) {
      return await this.createUser(whatsappNumber, countryCode);
    }

    return user as User;
  }

  static async getUserById(userId: string): Promise<User | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return null;
    }

    return user as User;
  }

  static async updateUserStatus(userId: string, status: 'PENDING_KYC' | 'VERIFIED' | 'SUSPENDED') {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user status: ${error.message}`);
    }

    return updatedUser as User;
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