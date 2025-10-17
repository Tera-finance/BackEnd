import { Request, Response, NextFunction } from 'express';
import { config } from '../utils/config.js';

// Simple in-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function createRateLimiter(windowMs: number, maxRequests: number, message: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    // Increment count
    record.count++;
    next();
  };
}

export const apiRateLimit = createRateLimiter(
  config.rateLimiting.windowMs,
  config.rateLimiting.maxRequests,
  'Too many requests from this IP, please try again later'
);

export const whatsappRateLimit = createRateLimiter(
  60 * 1000, // 1 minute
  10, // 10 messages per minute
  'Too many WhatsApp messages, please slow down'
);

export const kycRateLimit = createRateLimiter(
  24 * 60 * 60 * 1000, // 24 hours
  3, // 3 KYC submissions per day
  'Too many KYC submissions, please try again tomorrow'
);
