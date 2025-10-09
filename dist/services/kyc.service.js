"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../utils/database");
const ipfs_service_1 = require("./ipfs.service");
const blockchain_service_1 = require("./blockchain.service");
class KYCService {
    constructor() {
        this.ipfsService = new ipfs_service_1.IPFSService();
        this.blockchainService = new blockchain_service_1.BlockchainService();
    }
    async submitKYC(userId, documentType, documentNumber, fullName, dateOfBirth, address, documentFile) {
        try {
            const { data: user, error: userError } = await database_1.supabase
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
            const { data: existingKyc } = await database_1.supabase
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
            const { data: kycData, error: kycError } = await database_1.supabase
                .from('kyc_data')
                .insert({
                id: (0, uuid_1.v4)(),
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
            return kycData;
        }
        catch (error) {
            throw error;
        }
    }
    async verifyKYC(kycDataId) {
        try {
            const { data: kycData, error: kycError } = await database_1.supabase
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
                await database_1.supabase
                    .from('kyc_data')
                    .update({
                    verification_status: 'VERIFIED',
                    verified_at: new Date().toISOString()
                })
                    .eq('id', kycDataId);
                // Mint NFT on blockchain
                const tokenId = await this.blockchainService.mintKYCNFT(kycData.users.whatsapp_number, kycData.ipfs_hash);
                // Update user status
                await database_1.supabase
                    .from('users')
                    .update({
                    status: 'VERIFIED',
                    kyc_nft_token_id: tokenId
                })
                    .eq('id', kycData.user_id);
            }
            else {
                await database_1.supabase
                    .from('kyc_data')
                    .update({
                    verification_status: 'REJECTED'
                })
                    .eq('id', kycDataId);
            }
        }
        catch (error) {
            console.error('Error verifying KYC:', error);
            throw error;
        }
    }
    async getKYCStatus(userId) {
        const { data: kycData, error } = await database_1.supabase
            .from('kyc_data')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (error || !kycData) {
            return null;
        }
        return kycData;
    }
    async getKYCHistory(userId) {
        const { data: kycHistory, error } = await database_1.supabase
            .from('kyc_data')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to fetch KYC history: ${error.message}`);
        }
        return kycHistory;
    }
}
exports.KYCService = KYCService;
