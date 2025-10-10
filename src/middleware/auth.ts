import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config.js';
import { queryOne, User } from '../utils/database.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    whatsappNumber: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; whatsappNumber: string };

    const user = await queryOne<User>(
      'SELECT * FROM users WHERE id = ?',
      [decoded.userId]
    );

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
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireKYC = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await queryOne<User>(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user || user.status !== 'VERIFIED') {
      return res.status(403).json({ error: 'KYC verification required' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};