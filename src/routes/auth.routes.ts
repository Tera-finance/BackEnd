import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';
import { prisma } from '../utils/database';

const router = Router();

router.post('/login', apiRateLimit, async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, countryCode } = req.body;

    if (!whatsappNumber) {
      return res.status(400).json({ error: 'WhatsApp number is required' });
    }

    const result = await AuthService.loginOrRegister(whatsappNumber, countryCode);

    res.json({
      message: 'Login successful',
      user: {
        id: result.user.id,
        whatsappNumber: result.user.whatsappNumber,
        status: result.user.status
      },
      tokens: result.tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', apiRateLimit, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const tokens = await AuthService.refreshToken(refreshToken);

    res.json({
      message: 'Token refreshed successfully',
      tokens
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await AuthService.logout(req.user.id);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        whatsappNumber: true,
        countryCode: true,
        status: true,
        kycNftTokenId: true,
        createdAt: true,
        updatedAt: true
      }
    });

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