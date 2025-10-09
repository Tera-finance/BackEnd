"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardanoWalletService = exports.CardanoWalletService = void 0;
const config_1 = require("../utils/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CardanoWalletService {
    constructor() {
        this.mockMode = false;
        this.initialized = false;
        // Don't initialize in constructor - wait for first use
    }
    async initializeLucid() {
        if (this.initialized || this.initPromise) {
            return this.initPromise;
        }
        this.initPromise = (async () => {
            try {
                if (!config_1.config.cardano?.blockfrostApiKey || config_1.config.cardano?.blockfrostApiKey.includes('your-')) {
                    this.mockMode = true;
                    console.log('⚠️  Using mock Cardano wallet service (no valid Blockfrost API key)');
                    this.initialized = true;
                    return;
                }
                // Try dynamic import for ES module
                try {
                    const { Lucid, Blockfrost } = await Promise.resolve().then(() => __importStar(require('lucid-cardano')));
                    this.lucid = await Lucid.new(new Blockfrost(config_1.config.cardano.blockfrostUrl, config_1.config.cardano.blockfrostApiKey), config_1.config.cardano.network);
                    // Load or generate backend wallet
                    await this.loadOrGenerateBackendWallet();
                    console.log('✅ Cardano wallet service initialized');
                    console.log('📍 Backend address:', this.backendAddress);
                    this.initialized = true;
                }
                catch (importError) {
                    // lucid-cardano has ESM/CJS compatibility issues with ts-node
                    // Fall back to mock mode for development
                    console.log('⚠️  Cardano wallet using mock mode (lucid-cardano ESM compatibility issue)');
                    this.mockMode = true;
                    this.initialized = true;
                }
            }
            catch (error) {
                this.mockMode = true;
                this.initialized = true;
                console.log('⚠️  Cardano wallet service using mock mode:', error.message || 'Unknown error');
            }
        })();
        return this.initPromise;
    }
    async loadOrGenerateBackendWallet() {
        const walletPath = path.join(process.cwd(), '.cardano-wallet.json');
        try {
            if (fs.existsSync(walletPath)) {
                // Load existing wallet
                const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
                if (!this.lucid)
                    throw new Error('Lucid not initialized');
                this.lucid.selectWalletFromPrivateKey(walletData.privateKey);
                this.backendAddress = await this.lucid.wallet.address();
                console.log('✅ Loaded existing backend wallet');
            }
            else {
                // Generate new wallet
                const privateKey = this.lucid.utils.generatePrivateKey();
                this.lucid.selectWalletFromPrivateKey(privateKey);
                this.backendAddress = await this.lucid.wallet.address();
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
        }
        catch (error) {
            console.error('Error loading/generating backend wallet:', error);
            throw error;
        }
    }
    async getBackendAddress() {
        await this.initializeLucid();
        if (this.mockMode) {
            return 'addr_test1mock_cardano_address_for_testing';
        }
        if (!this.backendAddress) {
            throw new Error('Backend wallet not initialized');
        }
        return this.backendAddress;
    }
    async getBackendPublicKeyHash() {
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
    async getBalance() {
        await this.initializeLucid();
        if (this.mockMode || !this.lucid || !this.backendAddress) {
            return { lovelace: 0n, assets: {} };
        }
        try {
            const utxos = await this.lucid.wallet.getUtxos();
            let lovelace = 0n;
            const assets = {};
            for (const utxo of utxos) {
                lovelace += utxo.assets.lovelace || 0n;
                for (const [unit, amount] of Object.entries(utxo.assets)) {
                    if (unit !== 'lovelace') {
                        assets[unit] = (assets[unit] || 0n) + amount;
                    }
                }
            }
            return { lovelace, assets };
        }
        catch (error) {
            console.error('Error getting balance:', error);
            throw error;
        }
    }
    async generateUserWallet() {
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
        }
        catch (error) {
            console.error('Error generating user wallet:', error);
            throw error;
        }
    }
    getLucidInstance() {
        return this.lucid;
    }
    isReady() {
        return !this.mockMode && !!this.lucid && !!this.backendAddress;
    }
}
exports.CardanoWalletService = CardanoWalletService;
exports.cardanoWalletService = new CardanoWalletService();
