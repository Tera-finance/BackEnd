import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { config } from '../utils/config.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    whatsappNumber: string;
  };
}

export const apiRateLimit = rateLimit({
  windowMs: config.rateLimiting.windowMs,
  max: config.rateLimiting.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const whatsappRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute
  message: {
    error: 'Too many WhatsApp messages, please slow down'
  }
});

export const kycRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 15, // 3 KYC submissions per day
  message: {
    error: 'Too many KYC submissions, please try again tomorrow'
  }
});