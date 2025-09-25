import { Router, Response } from 'express';
import multer from 'multer';
import { KYCService } from '../services/kyc.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { kycRateLimit } from '../middleware/rateLimit';
import { DocumentType } from '../types';

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
        status: kycData.verification_status
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
      status: kycStatus.verification_status,
      submittedAt: kycStatus.created_at,
      verifiedAt: kycStatus.verified_at,
      documentType: kycStatus.document_type
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TODO: Implement these routes later
// router.get('/pending', authenticate, async (req: AuthRequest, res: Response) => {
//   // Implementation needed for getAllPendingKYC method
// });

router.post('/verify/:kycId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { kycId } = req.params;

    await kycService.verifyKYC(kycId);

    res.json({
      message: 'KYC verification processed successfully'
    });
  } catch (error: any) {
    console.error('KYC verification error:', error);
    res.status(400).json({ error: error.message || 'KYC verification failed' });
  }
});

// TODO: Implement document retrieval route later
// router.get('/document/:kycId', authenticate, async (req: AuthRequest, res: Response) => {
//   // Implementation needed for getKYCDocument method
// });

export default router;