import rateLimit from 'express-rate-limit';
import { config } from '../utils/config';

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
  },
  keyGenerator: (req) => {
    // Rate limit by WhatsApp phone number
    return req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || req.ip;
  }
});

export const kycRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 KYC submissions per day
  message: {
    error: 'Too many KYC submissions, please try again tomorrow'
  },
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});