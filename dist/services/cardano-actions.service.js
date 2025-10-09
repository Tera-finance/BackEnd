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
exports.cardanoActionsService = exports.CardanoActionsService = void 0;
const config_1 = require("../utils/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cardanoRepo = __importStar(require("../repositories/cardano.repository"));
// Token name mapping for validators
const TOKEN_INFO = {
    'USDC': { validatorTitle: 'usdc.mock_usdc_policy.mint', tokenName: 'mockUSDC', decimals: 6 },
    'CNHT': { validatorTitle: 'cnht.mock_cnht_policy.mint', tokenName: 'mockCNHT', decimals: 6 },
    'EUROC': { validatorTitle: 'euroc.mock_euroc_policy.mint', tokenName: 'mockEUROC', decimals: 6 },
    'IDRX': { validatorTitle: 'idrx.mock_idrx_policy.mint', tokenName: 'mockIDRX', decimals: 6 },
    'JPYC': { validatorTitle: 'jpyc.mock_jpyc_policy.mint', tokenName: 'mockJPYC', decimals: 6 },
    'MXNT': { validatorTitle: 'mxnt.mock_mxnt_policy.mint', tokenName: 'mockMXNT', decimals: 6 }
};
class CardanoActionsService {
    constructor() {
        this.mockMode = false;
        this.initialized = false;
        // Load plutus.json from smart contracts directory
        const plutusPath = path.join(process.cwd(), '..', 'Trustbridge-SmartContracts', 'plutus.json');
        if (fs.existsSync(plutusPath)) {
            this.plutusJson = JSON.parse(fs.readFileSync(plutusPath, 'utf-8'));
            console.log('✅ Loaded plutus.json with', this.plutusJson.validators.length, 'validators');
        }
        else {
            console.warn('⚠️  plutus.json not found at', plutusPath);
            this.mockMode = true;
        }
    }
    async initializeLucid() {
        if (this.initialized)
            return;
        try {
            if (!config_1.config.cardano?.blockfrostApiKey || !config_1.config.cardano?.walletSeed) {
                this.mockMode = true;
                console.log('⚠️  Using mock mode (missing Blockfrost API key or wallet seed)');
                this.initialized = true;
                return;
            }
            // Dynamic import for lucid-cardano
            const { Lucid, Blockfrost } = await Promise.resolve().then(() => __importStar(require('lucid-cardano')));
            this.lucid = await Lucid.new(new Blockfrost(config_1.config.cardano.blockfrostUrl, config_1.config.cardano.blockfrostApiKey), config_1.config.cardano.network);
            // Load wallet from seed
            this.lucid.selectWalletFromSeed(config_1.config.cardano.walletSeed);
            const address = await this.lucid.wallet.address();
            console.log('✅ Cardano actions service initialized');
            console.log('📍 Wallet address:', address);
            this.initialized = true;
        }
        catch (error) {
            console.error('⚠️  Cardano actions service error:', error.message);
            this.mockMode = true;
            this.initialized = true;
        }
    }
    /**
     * Mint tokens on Cardano blockchain
     */
    async mintToken(params) {
        await this.initializeLucid();
        if (this.mockMode) {
            // Mock response for testing
            const mockTxHash = '0x' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
            return {
                success: true,
                txHash: mockTxHash,
                policyId: 'mock_policy_id_' + params.symbol.toLowerCase(),
                amount: params.amount,
                cardanoscanUrl: `https://preprod.cardanoscan.io/transaction/${mockTxHash}`
            };
        }
        try {
            const tokenInfo = TOKEN_INFO[params.symbol.toUpperCase()];
            if (!tokenInfo) {
                throw new Error(`Token ${params.symbol} not supported. Available: ${Object.keys(TOKEN_INFO).join(', ')}`);
            }
            // Get token from database to verify it exists
            const token = await cardanoRepo.getTokenBySymbol(params.symbol);
            if (!token) {
                throw new Error(`Token ${params.symbol} not found in database. Please import deployment-info.json first.`);
            }
            // Get validator from plutus.json
            const validator = this.plutusJson.validators.find((v) => v.title === tokenInfo.validatorTitle);
            if (!validator) {
                throw new Error(`Validator ${tokenInfo.validatorTitle} not found in plutus.json`);
            }
            const lucidModule = await Promise.resolve().then(() => __importStar(require('lucid-cardano')));
            const { Data, Constr } = lucidModule;
            const script = {
                type: 'PlutusV3',
                script: validator.compiledCode
            };
            const policyId = this.lucid.utils.validatorToScriptHash(script);
            console.log('📋 Minting with Policy ID:', policyId);
            // Create mint redeemer - Mint constructor (index 0) with amount
            const mintAmount = BigInt(params.amount);
            const redeemer = Data.to(new Constr(0, [mintAmount]));
            // Build asset unit: policyId + tokenNameHex
            const tokenNameHex = Buffer.from(tokenInfo.tokenName, 'utf8').toString('hex');
            const assetUnit = policyId + tokenNameHex;
            console.log('⏳ Building mint transaction...');
            const tx = await this.lucid
                .newTx()
                .mintAssets({ [assetUnit]: mintAmount }, redeemer)
                .attach.MintingPolicy(script)
                .complete();
            console.log('✍️  Signing transaction...');
            const signedTx = await tx.sign.withWallet().complete();
            console.log('📤 Submitting transaction...');
            const txHash = await signedTx.submit();
            console.log('✅ Mint successful! TxHash:', txHash);
            const recipientAddr = params.recipientAddress || await this.lucid.wallet.address();
            // Save to database
            await cardanoRepo.saveMintTransaction({
                policyId: token.policy_id,
                amount: mintAmount,
                recipientAddress: recipientAddr,
                txHash,
                redeemerData: undefined
            });
            return {
                success: true,
                txHash,
                policyId,
                amount: params.amount,
                cardanoscanUrl: `https://preprod.cardanoscan.io/transaction/${txHash}`
            };
        }
        catch (error) {
            console.error('❌ Mint error:', error.message);
            return {
                success: false,
                error: error.message || 'Mint transaction failed'
            };
        }
    }
    /**
     * Swap tokens on Cardano blockchain (burn one, mint another)
     */
    async swapTokens(params) {
        await this.initializeLucid();
        if (this.mockMode) {
            const mockBurnTx = '0x' + Math.random().toString(16).substring(2);
            const mockMintTx = '0x' + Math.random().toString(16).substring(2);
            const calculatedRate = params.exchangeRate || 15800;
            const toAmount = (BigInt(params.fromAmount) * BigInt(Math.floor(calculatedRate))).toString();
            return {
                success: true,
                burnTxHash: mockBurnTx,
                mintTxHash: mockMintTx,
                fromPolicyId: 'mock_from_policy',
                toPolicyId: 'mock_to_policy',
                fromAmount: params.fromAmount,
                toAmount,
                exchangeRate: calculatedRate
            };
        }
        try {
            const fromTokenInfo = TOKEN_INFO[params.fromSymbol.toUpperCase()];
            const toTokenInfo = TOKEN_INFO[params.toSymbol.toUpperCase()];
            if (!fromTokenInfo || !toTokenInfo) {
                throw new Error(`Invalid token symbols. Available: ${Object.keys(TOKEN_INFO).join(', ')}`);
            }
            // Get tokens from database
            const fromToken = await cardanoRepo.getTokenBySymbol(params.fromSymbol);
            const toToken = await cardanoRepo.getTokenBySymbol(params.toSymbol);
            if (!fromToken || !toToken) {
                throw new Error('One or both tokens not found in database');
            }
            // Get validators
            const fromValidator = this.plutusJson.validators.find((v) => v.title === fromTokenInfo.validatorTitle);
            const toValidator = this.plutusJson.validators.find((v) => v.title === toTokenInfo.validatorTitle);
            if (!fromValidator || !toValidator) {
                throw new Error('Validators not found in plutus.json');
            }
            const lucidModule = await Promise.resolve().then(() => __importStar(require('lucid-cardano')));
            const { Data, Constr } = lucidModule;
            const fromScript = { type: 'PlutusV3', script: fromValidator.compiledCode };
            const toScript = { type: 'PlutusV3', script: toValidator.compiledCode };
            const fromPolicyId = this.lucid.utils.validatorToScriptHash(fromScript);
            const toPolicyId = this.lucid.utils.validatorToScriptHash(toScript);
            // Calculate exchange rate and amounts
            const exchangeRate = params.exchangeRate || 15800;
            const fromAmount = BigInt(params.fromAmount);
            const toAmount = fromAmount * BigInt(Math.floor(exchangeRate));
            console.log(`\n🔄 Swapping ${params.fromSymbol} to ${params.toSymbol}`);
            console.log(`📊 Rate: ${exchangeRate}, From: ${fromAmount}, To: ${toAmount}`);
            // Step 1: Burn source token
            const fromTokenHex = Buffer.from(fromTokenInfo.tokenName, 'utf8').toString('hex');
            const fromAssetUnit = fromPolicyId + fromTokenHex;
            const burnRedeemer = Data.to(new Constr(1, [fromAmount])); // Burn constructor (index 1)
            console.log('\n🔥 Burning', params.fromSymbol, '...');
            const burnTx = await this.lucid
                .newTx()
                .mintAssets({ [fromAssetUnit]: -fromAmount }, burnRedeemer)
                .attach.MintingPolicy(fromScript)
                .complete();
            const signedBurn = await burnTx.sign.withWallet().complete();
            const burnTxHash = await signedBurn.submit();
            console.log('✅ Burn successful:', burnTxHash);
            // Wait for confirmation
            console.log('⏳ Waiting for burn confirmation...');
            await this.lucid.awaitTx(burnTxHash);
            // Step 2: Mint destination token
            const toTokenHex = Buffer.from(toTokenInfo.tokenName, 'utf8').toString('hex');
            const toAssetUnit = toPolicyId + toTokenHex;
            const mintRedeemer = Data.to(new Constr(0, [toAmount])); // Mint constructor (index 0)
            console.log('\n🪙 Minting', params.toSymbol, '...');
            const mintTx = await this.lucid
                .newTx()
                .mintAssets({ [toAssetUnit]: toAmount }, mintRedeemer)
                .attach.MintingPolicy(toScript)
                .complete();
            const signedMint = await mintTx.sign.withWallet().complete();
            const mintTxHash = await signedMint.submit();
            console.log('✅ Mint successful:', mintTxHash);
            const walletAddress = await this.lucid.wallet.address();
            // Save swap to database
            await cardanoRepo.saveSwapTransaction({
                fromPolicyId: fromToken.policy_id,
                toPolicyId: toToken.policy_id,
                fromAmount,
                toAmount,
                exchangeRate,
                senderAddress: walletAddress,
                recipientAddress: walletAddress,
                txHash: mintTxHash, // Use mint tx as primary tx
                swapType: 'DIRECT',
                hubPolicyId: undefined
            });
            return {
                success: true,
                burnTxHash,
                mintTxHash,
                fromPolicyId,
                toPolicyId,
                fromAmount: fromAmount.toString(),
                toAmount: toAmount.toString(),
                exchangeRate
            };
        }
        catch (error) {
            console.error('❌ Swap error:', error.message);
            return {
                success: false,
                error: error.message || 'Swap transaction failed'
            };
        }
    }
    /**
     * Check if service is ready (not in mock mode)
     */
    isReady() {
        return !this.mockMode && this.initialized;
    }
}
exports.CardanoActionsService = CardanoActionsService;
exports.cardanoActionsService = new CardanoActionsService();
