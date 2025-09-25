import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/database';
import { IPFSService } from './ipfs.service';
import { BlockchainService } from './blockchain.service';
import { DocumentType, VerificationStatus, KycData } from '@prisma/client';

export class KYCService {
  private ipfsService: IPFSService;
  private blockchainService: BlockchainService;

  constructor() {
    this.ipfsService = new IPFSService();
    this.blockchainService = new BlockchainService();
  }

  async submitKYC(
    userId: string,
    documentType: DocumentType,
    documentNumber: string,
    fullName: string,
    dateOfBirth: Date,
    address: string,
    documentFile: Express.Multer.File
  ): Promise<KycData> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.status === 'VERIFIED') {
        throw new Error('User is already verified');
      }

      const existingKyc = await prisma.kycData.findFirst({
        where: { userId, verificationStatus: 'PENDING' }
      });

      if (existingKyc) {
        throw new Error('KYC submission already pending');
      }

      const metadata = {
        userId,
        documentType,
        documentNumber,
        fullName,
        dateOfBirth: dateOfBirth.toISOString(),
        address,
        fileName: documentFile.originalname,
        mimeType: documentFile.mimetype,
        size: documentFile.size
      };

      const ipfsHash = await this.ipfsService.uploadDocument(
        documentFile.buffer,
        metadata
      );

      const kycData = await prisma.kycData.create({
        data: {
          id: uuidv4(),
          userId,
          documentType,
          documentNumber,
          fullName,
          dateOfBirth,
          address,
          ipfsHash,
          verificationStatus: 'PENDING'
        }
      });

      console.log('KYC submitted successfully:', kycData.id);
      return kycData;
    } catch (error) {
      console.error('KYC submission error:', error);
      throw error;
    }
  }

  async verifyKYC(kycId: string, approved: boolean): Promise<KycData> {
    try {
      const kycData = await prisma.kycData.findUnique({
        where: { id: kycId },
        include: { user: true }
      });

      if (!kycData) {
        throw new Error('KYC data not found');
      }

      if (kycData.verificationStatus !== 'PENDING') {
        throw new Error('KYC already processed');
      }

      const verificationStatus: VerificationStatus = approved ? 'VERIFIED' : 'REJECTED';

      const updatedKyc = await prisma.$transaction(async (tx) => {
        const updated = await tx.kycData.update({
          where: { id: kycId },
          data: {
            verificationStatus,
            verifiedAt: approved ? new Date() : null
          }
        });

        if (approved) {
          const nftTokenId = await this.blockchainService.mintKYCNFT(
            kycData.user.id,
            kycData.ipfsHash
          );

          await tx.user.update({
            where: { id: kycData.userId },
            data: {
              status: 'VERIFIED',
              kycNftTokenId: nftTokenId
            }
          });
        }

        return updated;
      });

      console.log(`KYC ${approved ? 'approved' : 'rejected'}:`, kycId);
      return updatedKyc;
    } catch (error) {
      console.error('KYC verification error:', error);
      throw error;
    }
  }

  async getKYCStatus(userId: string): Promise<KycData | null> {
    try {
      return await prisma.kycData.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Get KYC status error:', error);
      throw error;
    }
  }

  async getAllPendingKYC(): Promise<KycData[]> {
    try {
      return await prisma.kycData.findMany({
        where: { verificationStatus: 'PENDING' },
        include: {
          user: {
            select: {
              id: true,
              whatsappNumber: true,
              countryCode: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
    } catch (error) {
      console.error('Get pending KYC error:', error);
      throw error;
    }
  }

  async getKYCDocument(kycId: string): Promise<any> {
    try {
      const kycData = await prisma.kycData.findUnique({
        where: { id: kycId }
      });

      if (!kycData) {
        throw new Error('KYC data not found');
      }

      return await this.ipfsService.retrieveDocument(kycData.ipfsHash);
    } catch (error) {
      console.error('Get KYC document error:', error);
      throw error;
    }
  }
}