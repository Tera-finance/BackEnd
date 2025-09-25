import { Router, Response } from 'express';
import multer from 'multer';
import { KYCService } from '../services/kyc.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { kycRateLimit } from '../middleware/rateLimit';
import { DocumentType } from '@prisma/client';

const router = Router();
const kycService = new KYCService();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.post('/submit', 
  authenticate, 
  kycRateLimit, 
  upload.single('document'), 
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Document file is required' });
      }

      const {
        documentType,
        documentNumber,
        fullName,
        dateOfBirth,
        address
      } = req.body;

      if (!documentType || !documentNumber || !fullName || !dateOfBirth || !address) {
        return res.status(400).json({ 
          error: 'All KYC fields are required' 
        });
      }

      if (!['E_KTP', 'PASSPORT'].includes(documentType)) {
        return res.status(400).json({ 
          error: 'Invalid document type. Must be E_KTP or PASSPORT' 
        });
      }

      const kycData = await kycService.submitKYC(
        req.user.id,
        documentType as DocumentType,
        documentNumber,
        fullName,
        new Date(dateOfBirth),
        address,
        req.file
      );

      res.json({
        message: 'KYC submitted successfully',
        kycId: kycData.id,
        status: kycData.verificationStatus
      });
    } catch (error: any) {
      console.error('KYC submission error:', error);
      res.status(400).json({ error: error.message || 'KYC submission failed' });
    }
  }
);

router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const kycStatus = await kycService.getKYCStatus(req.user.id);

    if (!kycStatus) {
      return res.json({ 
        status: 'not_submitted',
        message: 'No KYC submission found' 
      });
    }

    res.json({
      status: kycStatus.verificationStatus,
      submittedAt: kycStatus.createdAt,
      verifiedAt: kycStatus.verifiedAt,
      documentType: kycStatus.documentType
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/pending', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const pendingKYCs = await kycService.getAllPendingKYC();

    res.json({
      count: pendingKYCs.length,
      kycs: pendingKYCs.map(kyc => ({
        id: kyc.id,
        user: {
          id: kyc.user.id,
          whatsappNumber: kyc.user.whatsappNumber,
          countryCode: kyc.user.countryCode
        },
        documentType: kyc.documentType,
        fullName: kyc.fullName,
        submittedAt: kyc.createdAt
      }))
    });
  } catch (error) {
    console.error('Get pending KYCs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify/:kycId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { kycId } = req.params;
    const { approved } = req.body;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'Approved field must be boolean' });
    }

    const verifiedKyc = await kycService.verifyKYC(kycId, approved);

    res.json({
      message: `KYC ${approved ? 'approved' : 'rejected'} successfully`,
      kycId: verifiedKyc.id,
      status: verifiedKyc.verificationStatus,
      verifiedAt: verifiedKyc.verifiedAt
    });
  } catch (error: any) {
    console.error('KYC verification error:', error);
    res.status(400).json({ error: error.message || 'KYC verification failed' });
  }
});

router.get('/document/:kycId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { kycId } = req.params;

    const document = await kycService.getKYCDocument(kycId);

    res.json({
      document: {
        metadata: document.metadata,
        timestamp: document.timestamp
      }
    });
  } catch (error: any) {
    console.error('Get KYC document error:', error);
    res.status(400).json({ error: error.message || 'Failed to retrieve document' });
  }
});

export default router;