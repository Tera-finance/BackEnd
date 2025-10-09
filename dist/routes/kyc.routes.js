"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const kyc_service_1 = require("../services/kyc.service");
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const router = (0, express_1.Router)();
const kycService = new kyc_service_1.KYCService();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        console.log('Received file field name:', file.fieldname);
        console.log('File mimetype:', file.mimetype);
        console.log('File originalname:', file.originalname);
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/octet-stream',
            'text/plain' // Some PDF files are detected as text/plain
        ];
        const fileExtension = file.originalname.toLowerCase().split('.').pop();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf'];
        const isMimetypeAllowed = allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/');
        const isExtensionAllowed = fileExtension ? allowedExtensions.includes(fileExtension) : false;
        if (isMimetypeAllowed || isExtensionAllowed) {
            cb(null, true);
        }
        else {
            console.log('Rejected file with mimetype:', file.mimetype, 'and extension:', fileExtension);
            cb(new Error(`File type not allowed. Received: ${file.mimetype} (${fileExtension}). Allowed: images and PDF files`));
        }
    }
});
router.post('/submit', auth_1.authenticate, rateLimit_1.kycRateLimit, (req, res, next) => {
    console.log('Request fields:', req.body ? Object.keys(req.body) : 'No body');
    console.log('Content-Type:', req.headers['content-type']);
    next();
}, upload.single('documentFile'), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Document file is required' });
        }
        const { documentType, documentNumber, fullName, dateOfBirth, address } = req.body;
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
        const kycData = await kycService.submitKYC(req.user.id, documentType, documentNumber, fullName, new Date(dateOfBirth), address, req.file);
        res.json({
            message: 'KYC submitted successfully',
            kycId: kycData.id,
            status: kycData.verification_status
        });
    }
    catch (error) {
        console.error('KYC submission error:', error);
        res.status(400).json({ error: error.message || 'KYC submission failed' });
    }
});
router.get('/status', auth_1.authenticate, async (req, res) => {
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
    }
    catch (error) {
        console.error('Get KYC status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// TODO: Implement these routes later
// router.get('/pending', authenticate, async (req: AuthRequest, res: Response) => {
//   // Implementation needed for getAllPendingKYC method
// });
router.post('/verify/:kycId', auth_1.authenticate, async (req, res) => {
    try {
        const { kycId } = req.params;
        await kycService.verifyKYC(kycId);
        res.json({
            message: 'KYC verification processed successfully'
        });
    }
    catch (error) {
        console.error('KYC verification error:', error);
        res.status(400).json({ error: error.message || 'KYC verification failed' });
    }
});
// TODO: Implement document retrieval route later
// router.get('/document/:kycId', authenticate, async (req: AuthRequest, res: Response) => {
//   // Implementation needed for getKYCDocument method
// });
exports.default = router;
