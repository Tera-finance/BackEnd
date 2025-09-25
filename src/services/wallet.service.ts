import { v4 as uuidv4 } from 'uuid';
import { supabase, Wallet } from '../utils/database';
import { BlockchainService } from './blockchain.service';
import { EncryptionUtil } from '../utils/encryption';
import { WalletType } from '../types';

export class WalletService {
  private blockchainService: BlockchainService;

  constructor() {
    this.blockchainService = new BlockchainService();
  }

  async createWallet(userId: string, walletType: WalletType = 'GENERATED'): Promise<Wallet> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user already has an active wallet
      const existingWallet = await prisma.wallet.findFirst({
        where: { userId, isActive: true }
      });

      if (existingWallet) {
        throw new Error('User already has an active wallet');
      }

      // Generate new wallet
      const { address, privateKey } = await this.blockchainService.generateWallet();
      
      // Encrypt the private key
      const encryptedPrivateKey = EncryptionUtil.encrypt(privateKey);

      const wallet = await prisma.wallet.create({
        data: {
          id: uuidv4(),
          userId,
          walletAddress: address,
          privateKeyEncrypted: encryptedPrivateKey,
          walletType,
          isActive: true
        }
      });

      console.log('Wallet created for user:', userId, 'Address:', address);
      return wallet;
    } catch (error) {
      console.error('Create wallet error:', error);
      throw error;
    }
  }

  async importWallet(
    userId: string,
    privateKey: string
  ): Promise<Wallet> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Validate private key and get address
      // This would normally derive the address from the private key
      const address = `0x${Math.random().toString(16).substring(2, 42)}`;
      
      // Check if wallet address already exists
      const existingWallet = await prisma.wallet.findUnique({
        where: { walletAddress: address }
      });

      if (existingWallet) {
        throw new Error('Wallet already imported');
      }

      // Encrypt the private key
      const encryptedPrivateKey = EncryptionUtil.encrypt(privateKey);

      // Deactivate existing wallets
      await prisma.wallet.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      const wallet = await prisma.wallet.create({
        data: {
          id: uuidv4(),
          userId,
          walletAddress: address,
          privateKeyEncrypted: encryptedPrivateKey,
          walletType: 'IMPORTED',
          isActive: true
        }
      });

      console.log('Wallet imported for user:', userId, 'Address:', address);
      return wallet;
    } catch (error) {
      console.error('Import wallet error:', error);
      throw error;
    }
  }

  async getActiveWallet(userId: string): Promise<Wallet | null> {
    try {
      return await prisma.wallet.findFirst({
        where: { userId, isActive: true }
      });
    } catch (error) {
      console.error('Get active wallet error:', error);
      throw error;
    }
  }

  async getAllWallets(userId: string): Promise<Wallet[]> {
    try {
      return await prisma.wallet.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Get all wallets error:', error);
      throw error;
    }
  }

  async getWalletBalance(
    walletAddress: string,
    tokenAddress?: string
  ): Promise<string> {
    try {
      return await this.blockchainService.getBalance(walletAddress, tokenAddress);
    } catch (error) {
      console.error('Get wallet balance error:', error);
      throw error;
    }
  }

  async setActiveWallet(userId: string, walletId: string): Promise<Wallet> {
    try {
      const wallet = await prisma.wallet.findFirst({
        where: { id: walletId, userId }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Deactivate all wallets for this user
      await prisma.wallet.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      // Activate the selected wallet
      const activeWallet = await prisma.wallet.update({
        where: { id: walletId },
        data: { isActive: true }
      });

      console.log('Active wallet set for user:', userId, 'Wallet:', walletId);
      return activeWallet;
    } catch (error) {
      console.error('Set active wallet error:', error);
      throw error;
    }
  }

  async getPrivateKey(userId: string, walletId: string): Promise<string> {
    try {
      const wallet = await prisma.wallet.findFirst({
        where: { id: walletId, userId }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Decrypt the private key
      return EncryptionUtil.decrypt(wallet.privateKeyEncrypted);
    } catch (error) {
      console.error('Get private key error:', error);
      throw error;
    }
  }
}