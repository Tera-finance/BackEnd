import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';
import { apiRateLimit } from '../middleware/rateLimit.js';
import { queryOne } from '../utils/database.js';

const router = Router();

router.post('/login', apiRateLimit, async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, countryCode } = req.body;

    if (!whatsappNumber) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp number is required'
      });
    }

    const user = await AuthService.loginOrRegister(whatsappNumber, countryCode);
    const tokens = AuthService.generateTokens(user);

    // Store refresh token
    await AuthService.storeRefreshToken(user.id, tokens.refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        whatsappNumber: user.whatsapp_number,
        status: user.status
      },
      tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/refresh', apiRateLimit, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = AuthService.verifyRefreshToken(refreshToken);

    // Validate stored token
    const isValid = await AuthService.validateRefreshToken(decoded.userId, refreshToken);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get user
    const user = await AuthService.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new tokens
    const tokens = AuthService.generateTokens(user);

    // Update stored refresh token
    await AuthService.storeRefreshToken(user.id, tokens.refreshToken);

    res.json({
      message: 'Token refreshed successfully',
      tokens
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await AuthService.revokeRefreshToken(req.user.id);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await queryOne<any>(
      'SELECT id, whatsapp_number, country_code, status, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
