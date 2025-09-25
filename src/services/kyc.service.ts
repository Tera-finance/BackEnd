import { v4 as uuidv4 } from 'uuid';
import { supabase, User, KycData } from '../utils/database';
import { IPFSService } from './ipfs.service';
import { BlockchainService } from './blockchain.service';

export class KYCService {
  private ipfsService: IPFSService;
  private blockchainService: BlockchainService;

  constructor() {
    this.ipfsService = new IPFSService();
    this.blockchainService = new BlockchainService();
  }

  async submitKYC(
    userId: string,
    documentType: 'E_KTP' | 'PASSPORT',
    documentNumber: string,
    fullName: string,
    dateOfBirth: Date,
    address: string,
    documentFile: Express.Multer.File
  ): Promise<KycData> {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      if (user.status === 'VERIFIED') {
        throw new Error('User is already verified');
      }

      const { data: existingKyc } = await supabase
        .from('kyc_data')
        .select('*')
        .eq('user_id', userId)
        .eq('verification_status', 'PENDING')
        .single();

      if (existingKyc) {
        throw new Error('KYC submission already pending');
      }

      const metadata = {
        userId,
        documentType,
        documentNumber,
        fullName,
        dateOfBirth,
        address,
        timestamp: new Date().toISOString()
      };

      const ipfsHash = await this.ipfsService.uploadDocument(documentFile.buffer, metadata);

      const { data: kycData, error: kycError } = await supabase
        .from('kyc_data')
        .insert({
          id: uuidv4(),
          user_id: userId,
          document_type: documentType,
          document_number: documentNumber,
          full_name: fullName,
          date_of_birth: dateOfBirth,
          address: address,
          ipfs_hash: ipfsHash,
          verification_status: 'PENDING'
        })
        .select()
        .single();

      if (kycError) {
        throw new Error(`Failed to create KYC record: ${kycError.message}`);
      }

      // In production, trigger verification process here
      // For now, auto-approve after a delay
      setTimeout(() => {
        this.verifyKYC(kycData.id);
      }, 5000);

      return kycData as KycData;
    } catch (error) {
      throw error;
    }
  }

  async verifyKYC(kycDataId: string): Promise<void> {
    try {
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_data')
        .select('*, users!kyc_data_user_id_fkey(*)')
        .eq('id', kycDataId)
        .single();

      if (kycError || !kycData) {
        throw new Error('KYC data not found');
      }

      if (kycData.verification_status !== 'PENDING') {
        throw new Error('KYC already processed');
      }

      // In production, perform actual verification
      // For now, auto-approve
      const isVerified = true;

      if (isVerified) {
        // Update KYC status
        await supabase
          .from('kyc_data')
          .update({
            verification_status: 'VERIFIED',
            verified_at: new Date().toISOString()
          })
          .eq('id', kycDataId);

        // Mint NFT on blockchain
        const tokenId = await this.blockchainService.mintKYCNFT(
          kycData.users.whatsapp_number,
          kycData.ipfs_hash
        );

        // Update user status
        await supabase
          .from('users')
          .update({
            status: 'VERIFIED',
            kyc_nft_token_id: tokenId
          })
          .eq('id', kycData.user_id);
      } else {
        await supabase
          .from('kyc_data')
          .update({
            verification_status: 'REJECTED'
          })
          .eq('id', kycDataId);
      }
    } catch (error) {
      console.error('Error verifying KYC:', error);
      throw error;
    }
  }

  async getKYCStatus(userId: string): Promise<KycData | null> {
    const { data: kycData, error } = await supabase
      .from('kyc_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !kycData) {
      return null;
    }

    return kycData as KycData;
  }

  async getKYCHistory(userId: string): Promise<KycData[]> {
    const { data: kycHistory, error } = await supabase
      .from('kyc_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch KYC history: ${error.message}`);
    }

    return kycHistory as KycData[];
  }
}