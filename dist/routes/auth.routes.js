"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const database_1 = require("../utils/database");
const router = (0, express_1.Router)();
router.post('/login', rateLimit_1.apiRateLimit, async (req, res) => {
    try {
        const { whatsappNumber, countryCode } = req.body;
        if (!whatsappNumber) {
            return res.status(400).json({ error: 'WhatsApp number is required' });
        }
        const user = await auth_service_1.AuthService.loginOrRegister(whatsappNumber, countryCode);
        const tokens = auth_service_1.AuthService.generateTokens(user);
        // Store refresh token
        await auth_service_1.AuthService.storeRefreshToken(user.id, tokens.refreshToken);
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                whatsappNumber: user.whatsapp_number,
                status: user.status
            },
            tokens
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/refresh', rateLimit_1.apiRateLimit, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }
        // Verify refresh token
        const decoded = auth_service_1.AuthService.verifyRefreshToken(refreshToken);
        // Validate stored token
        const isValid = await auth_service_1.AuthService.validateRefreshToken(decoded.userId, refreshToken);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        // Get user
        const user = await auth_service_1.AuthService.getUserById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Generate new tokens
        const tokens = auth_service_1.AuthService.generateTokens(user);
        // Update stored refresh token
        await auth_service_1.AuthService.storeRefreshToken(user.id, tokens.refreshToken);
        res.json({
            message: 'Token refreshed successfully',
            tokens
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});
router.post('/logout', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        await auth_service_1.AuthService.revokeRefreshToken(req.user.id);
        res.json({ message: 'Logout successful' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const user = await (0, database_1.queryOne)('SELECT id, whatsapp_number, country_code, status, kyc_nft_token_id, created_at, updated_at FROM users WHERE id = ?', [req.user.id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
