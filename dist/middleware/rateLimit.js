"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kycRateLimit = exports.whatsappRateLimit = exports.apiRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../utils/config");
exports.apiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimiting.windowMs,
    max: config_1.config.rateLimiting.maxRequests,
    message: {
        error: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});
exports.whatsappRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 messages per minute
    message: {
        error: 'Too many WhatsApp messages, please slow down'
    }
});
exports.kycRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 15, // 3 KYC submissions per day
    message: {
        error: 'Too many KYC submissions, please try again tomorrow'
    }
});
