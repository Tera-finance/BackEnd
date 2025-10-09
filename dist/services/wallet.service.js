"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../utils/database");
const blockchain_service_1 = require("./blockchain.service");
const encryption_1 = require("../utils/encryption");
class WalletService {
    constructor() {
        this.blockchainService = new blockchain_service_1.BlockchainService();
    }
    async createWallet(userId, walletType = 'GENERATED') {
        try {
            const { data: user } = await database_1.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            if (!user) {
                throw new Error('User not found');
            }
            // Check if user already has an active wallet
            const { data: existingWallet } = await database_1.supabase
                .from('wallets')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();
            if (existingWallet) {
                throw new Error('User already has an active wallet');
            }
            // Generate new wallet
            const { address, privateKey } = await this.blockchainService.generateWallet();
            // Encrypt the private key
            const encryptedPrivateKey = encryption_1.EncryptionUtil.encrypt(privateKey);
            const now = new Date().toISOString();
            const { data: wallet } = await database_1.supabase
                .from('wallets')
                .insert({
                id: (0, uuid_1.v4)(),
                user_id: userId,
                wallet_address: address,
                private_key_encrypted: encryptedPrivateKey,
                wallet_type: walletType,
                is_active: true,
                created_at: now,
                updated_at: now
            })
                .select()
                .single();
            console.log('Wallet created for user:', userId, 'Address:', address);
            return wallet;
        }
        catch (error) {
            console.error('Create wallet error:', error);
            throw error;
        }
    }
    async importWallet(userId, privateKey) {
        try {
            const { data: user } = await database_1.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            if (!user) {
                throw new Error('User not found');
            }
            // Validate private key and get address
            // This would normally derive the address from the private key
            const address = `0x${Math.random().toString(16).substring(2, 42)}`;
            // Check if wallet address already exists
            const { data: existingWallet } = await database_1.supabase
                .from('wallets')
                .select('*')
                .eq('wallet_address', address)
                .single();
            if (existingWallet) {
                throw new Error('Wallet already imported');
            }
            // Encrypt the private key
            const encryptedPrivateKey = encryption_1.EncryptionUtil.encrypt(privateKey);
            // Deactivate existing wallets
            await database_1.supabase
                .from('wallets')
                .update({ is_active: false })
                .eq('user_id', userId);
            const now = new Date().toISOString();
            const { data: wallet } = await database_1.supabase
                .from('wallets')
                .insert({
                id: (0, uuid_1.v4)(),
                user_id: userId,
                wallet_address: address,
                private_key_encrypted: encryptedPrivateKey,
                wallet_type: 'IMPORTED',
                is_active: true,
                created_at: now,
                updated_at: now
            })
                .select()
                .single();
            console.log('Wallet imported for user:', userId, 'Address:', address);
            return wallet;
        }
        catch (error) {
            console.error('Import wallet error:', error);
            throw error;
        }
    }
    async getActiveWallet(userId) {
        try {
            const { data: wallet } = await database_1.supabase
                .from('wallets')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();
            return wallet;
        }
        catch (error) {
            console.error('Get active wallet error:', error);
            throw error;
        }
    }
    async getAllWallets(userId) {
        try {
            const { data: wallets } = await database_1.supabase
                .from('wallets')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            return wallets || [];
        }
        catch (error) {
            console.error('Get all wallets error:', error);
            throw error;
        }
    }
    async getWalletBalance(walletAddress, tokenAddress) {
        try {
            return await this.blockchainService.getBalance(walletAddress, tokenAddress);
        }
        catch (error) {
            console.error('Get wallet balance error:', error);
            throw error;
        }
    }
    async setActiveWallet(userId, walletId) {
        try {
            const { data: wallet } = await database_1.supabase
                .from('wallets')
                .select('*')
                .eq('id', walletId)
                .eq('user_id', userId)
                .single();
            if (!wallet) {
                throw new Error('Wallet not found');
            }
            // Deactivate all wallets for this user
            await database_1.supabase
                .from('wallets')
                .update({ is_active: false })
                .eq('user_id', userId);
            // Activate the selected wallet
            const { data: activeWallet } = await database_1.supabase
                .from('wallets')
                .update({ is_active: true })
                .eq('id', walletId)
                .select()
                .single();
            console.log('Active wallet set for user:', userId, 'Wallet:', walletId);
            return activeWallet;
        }
        catch (error) {
            console.error('Set active wallet error:', error);
            throw error;
        }
    }
    async getPrivateKey(userId, walletId) {
        try {
            const { data: wallet } = await database_1.supabase
                .from('wallets')
                .select('*')
                .eq('id', walletId)
                .eq('user_id', userId)
                .single();
            if (!wallet) {
                throw new Error('Wallet not found');
            }
            // Decrypt the private key
            return encryption_1.EncryptionUtil.decrypt(wallet.private_key_encrypted);
        }
        catch (error) {
            console.error('Get private key error:', error);
            throw error;
        }
    }
}
exports.WalletService = WalletService;
