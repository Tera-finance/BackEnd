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
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Lazy load Cardano services to avoid import errors in dev mode
let cardanoWalletService;
let cardanoContractService;
async function getCardanoServices() {
    if (!cardanoWalletService) {
        const walletModule = await Promise.resolve().then(() => __importStar(require('../services/cardano-wallet.service')));
        cardanoWalletService = walletModule.cardanoWalletService;
    }
    if (!cardanoContractService) {
        const contractModule = await Promise.resolve().then(() => __importStar(require('../services/cardano-contract.service')));
        cardanoContractService = contractModule.cardanoContractService;
    }
    return { cardanoWalletService, cardanoContractService };
}
/**
 * GET /api/cardano/backend-info
 * Get backend wallet information (public data only)
 */
router.get('/backend-info', async (req, res) => {
    try {
        const { cardanoWalletService, cardanoContractService } = await getCardanoServices();
        const address = await cardanoContractService.getBackendAddress();
        const pubKeyHash = await cardanoContractService.getBackendPublicKeyHash();
        const balance = await cardanoWalletService.getBalance();
        res.json({
            success: true,
            data: {
                address,
                publicKeyHash: pubKeyHash,
                balance: {
                    ada: Number(balance.lovelace) / 1000000,
                    lovelace: balance.lovelace.toString(),
                    assets: balance.assets
                },
                isReady: cardanoWalletService.isReady()
            }
        });
    }
    catch (error) {
        console.error('Error getting backend info:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get backend info'
        });
    }
});
/**
 * POST /api/cardano/lock-funds
 * Lock funds in a smart contract
 * Requires authentication
 */
router.post('/lock-funds', auth_1.authenticate, async (req, res) => {
    try {
        const { cardanoContractService } = await getCardanoServices();
        const { scriptAddress, amount, datum } = req.body;
        if (!scriptAddress || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Script address and amount are required'
            });
        }
        const amountLovelace = BigInt(amount);
        const txHash = await cardanoContractService.lockFundsInContract(scriptAddress, amountLovelace, datum || {});
        res.json({
            success: true,
            data: {
                transactionHash: txHash,
                scriptAddress,
                amount: amount.toString()
            }
        });
    }
    catch (error) {
        console.error('Error locking funds:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to lock funds'
        });
    }
});
/**
 * POST /api/cardano/unlock-funds
 * Unlock funds from a smart contract
 * Requires authentication
 */
router.post('/unlock-funds', auth_1.authenticate, async (req, res) => {
    try {
        const { cardanoContractService } = await getCardanoServices();
        const { scriptAddress, scriptCbor, utxos, redeemer } = req.body;
        if (!scriptAddress || !scriptCbor || !utxos) {
            return res.status(400).json({
                success: false,
                error: 'Script address, script CBOR, and UTxOs are required'
            });
        }
        const txHash = await cardanoContractService.unlockFundsFromContract(scriptAddress, scriptCbor, utxos, redeemer || {});
        res.json({
            success: true,
            data: {
                transactionHash: txHash,
                scriptAddress
            }
        });
    }
    catch (error) {
        console.error('Error unlocking funds:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to unlock funds'
        });
    }
});
/**
 * GET /api/cardano/script-utxos/:address
 * Get UTxOs at a script address
 */
router.get('/script-utxos/:address', async (req, res) => {
    try {
        const { cardanoContractService } = await getCardanoServices();
        const { address } = req.params;
        const utxos = await cardanoContractService.getScriptUtxos(address);
        res.json({
            success: true,
            data: {
                address,
                utxos,
                count: utxos.length
            }
        });
    }
    catch (error) {
        console.error('Error getting script UTxOs:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get script UTxOs'
        });
    }
});
/**
 * POST /api/cardano/build-tx
 * Build a transaction for user to sign
 * Requires authentication
 */
router.post('/build-tx', auth_1.authenticate, async (req, res) => {
    try {
        const { cardanoContractService } = await getCardanoServices();
        const { userAddress, scriptAddress, amount, datum } = req.body;
        if (!userAddress || !scriptAddress || !amount) {
            return res.status(400).json({
                success: false,
                error: 'User address, script address, and amount are required'
            });
        }
        const amountLovelace = BigInt(amount);
        const unsignedTxCbor = await cardanoContractService.buildTransactionForUser(userAddress, scriptAddress, amountLovelace, datum || {});
        res.json({
            success: true,
            data: {
                unsignedTransactionCbor: unsignedTxCbor,
                scriptAddress,
                amount: amount.toString()
            }
        });
    }
    catch (error) {
        console.error('Error building transaction:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to build transaction'
        });
    }
});
/**
 * POST /api/cardano/submit-tx
 * Submit a signed transaction
 */
router.post('/submit-tx', async (req, res) => {
    try {
        const { cardanoContractService } = await getCardanoServices();
        const { signedTxCbor } = req.body;
        if (!signedTxCbor) {
            return res.status(400).json({
                success: false,
                error: 'Signed transaction CBOR is required'
            });
        }
        const txHash = await cardanoContractService.submitSignedTransaction(signedTxCbor);
        res.json({
            success: true,
            data: {
                transactionHash: txHash
            }
        });
    }
    catch (error) {
        console.error('Error submitting transaction:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to submit transaction'
        });
    }
});
/**
 * POST /api/cardano/create-datum
 * Create a datum with backend authorization
 * Requires authentication
 */
router.post('/create-datum', auth_1.authenticate, async (req, res) => {
    try {
        const { cardanoContractService } = await getCardanoServices();
        const { data } = req.body;
        const datum = await cardanoContractService.createDatumWithBackendAuth(data || {});
        res.json({
            success: true,
            data: {
                datum
            }
        });
    }
    catch (error) {
        console.error('Error creating datum:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create datum'
        });
    }
});
/**
 * GET /api/cardano/tx-status/:txHash
 * Check transaction confirmation status
 */
router.get('/tx-status/:txHash', async (req, res) => {
    try {
        const { cardanoContractService } = await getCardanoServices();
        const { txHash } = req.params;
        const confirmed = await cardanoContractService.awaitTransactionConfirmation(txHash, 30000);
        res.json({
            success: true,
            data: {
                transactionHash: txHash,
                confirmed
            }
        });
    }
    catch (error) {
        console.error('Error checking transaction status:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to check transaction status'
        });
    }
});
exports.default = router;
