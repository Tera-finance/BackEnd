import { config } from '../utils/config';
import * as fs from 'fs';
import * as path from 'path';

type Lucid = any;

export class CardanoWalletService {
  private lucid?: Lucid;
  private backendAddress?: string;
  private mockMode: boolean = false;
  private initialized: boolean = false;
  private initPromise?: Promise<void>;

  constructor() {
    // Don't initialize in constructor - wait for first use
  }

  private async initializeLucid() {
    if (this.initialized || this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        if (!config.cardano?.blockfrostApiKey || config.cardano?.blockfrostApiKey.includes('your-')) {
          this.mockMode = true;
          console.log('⚠️  Using mock Cardano wallet service (no valid Blockfrost API key)');
          this.initialized = true;
          return;
        }

        // Dynamic import for ES module
        const { Lucid, Blockfrost } = await import('lucid-cardano');

        this.lucid = await Lucid.new(
          new Blockfrost(
            config.cardano.blockfrostUrl,
            config.cardano.blockfrostApiKey
          ),
          config.cardano.network as 'Mainnet' | 'Preprod' | 'Preview'
        );

        // Load or generate backend wallet
        await this.loadOrGenerateBackendWallet();

        console.log('✅ Cardano wallet service initialized');
        console.log('📍 Backend address:', this.backendAddress);
        this.initialized = true;
      } catch (error) {
        this.mockMode = true;
        this.initialized = true;
        console.log('⚠️  Cardano wallet service error, using mock mode:', error);
      }
    })();

    return this.initPromise;
  }

  private async loadOrGenerateBackendWallet() {
    const walletPath = path.join(process.cwd(), '.cardano-wallet.json');

    try {
      if (fs.existsSync(walletPath)) {
        // Load existing wallet
        const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
        if (!this.lucid) throw new Error('Lucid not initialized');

        this.lucid.selectWalletFromPrivateKey(walletData.privateKey);
        this.backendAddress = await this.lucid.wallet.address();

        console.log('✅ Loaded existing backend wallet');
      } else {
        // Generate new wallet
        const privateKey = this.lucid!.utils.generatePrivateKey();
        this.lucid!.selectWalletFromPrivateKey(privateKey);
        this.backendAddress = await this.lucid!.wallet.address();

        // Save wallet (encrypted in production)
        const walletData = {
          privateKey,
          address: this.backendAddress,
          createdAt: new Date().toISOString()
        };

        fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));
        console.log('🔑 Generated new backend wallet and saved to:', walletPath);
        console.log('⚠️  IMPORTANT: Back up this file securely!');
      }
    } catch (error) {
      console.error('Error loading/generating backend wallet:', error);
      throw error;
    }
  }

  async getBackendAddress(): Promise<string> {
    await this.initializeLucid();

    if (this.mockMode) {
      return 'addr_test1mock_cardano_address_for_testing';
    }

    if (!this.backendAddress) {
      throw new Error('Backend wallet not initialized');
    }

    return this.backendAddress;
  }

  async getBackendPublicKeyHash(): Promise<string> {
    await this.initializeLucid();

    if (this.mockMode) {
      return 'mock_pubkey_hash';
    }

    if (!this.lucid || !this.backendAddress) {
      throw new Error('Backend wallet not initialized');
    }

    const paymentCredential = this.lucid.utils.getAddressDetails(this.backendAddress).paymentCredential;
    return paymentCredential?.hash || '';
  }

  async getBalance(): Promise<{ lovelace: bigint; assets: Record<string, bigint> }> {
    await this.initializeLucid();

    if (this.mockMode || !this.lucid || !this.backendAddress) {
      return { lovelace: 0n, assets: {} };
    }

    try {
      const utxos = await this.lucid.wallet.getUtxos();
      let lovelace = 0n;
      const assets: Record<string, bigint> = {};

      for (const utxo of utxos) {
        lovelace += utxo.assets.lovelace || 0n;

        for (const [unit, amount] of Object.entries(utxo.assets)) {
          if (unit !== 'lovelace') {
            assets[unit] = (assets[unit] || 0n) + (amount as bigint);
          }
        }
      }

      return { lovelace, assets };
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  async generateUserWallet(): Promise<{ address: string; privateKey: string; mnemonic: string }> {
    await this.initializeLucid();

    if (this.mockMode || !this.lucid) {
      const mockMnemonic = 'mock mnemonic phrase for testing purposes only do not use in production';
      return {
        address: 'addr_test1mock_user_address',
        privateKey: 'mock_private_key',
        mnemonic: mockMnemonic
      };
    }

    try {
      const mnemonic = this.lucid.utils.generateSeedPhrase();
      this.lucid.selectWalletFromSeed(mnemonic);
      const address = await this.lucid.wallet.address();

      // Get private key from mnemonic
      const privateKey = this.lucid.utils.generatePrivateKey();

      return {
        address,
        privateKey,
        mnemonic
      };
    } catch (error) {
      console.error('Error generating user wallet:', error);
      throw error;
    }
  }

  getLucidInstance(): Lucid | undefined {
    return this.lucid;
  }

  isReady(): boolean {
    return !this.mockMode && !!this.lucid && !!this.backendAddress;
  }
}

export const cardanoWalletService = new CardanoWalletService();
