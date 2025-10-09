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
exports.cardanoContractService = exports.CardanoContractService = void 0;
const cardano_wallet_service_1 = require("./cardano-wallet.service");
/**
 * Cardano Smart Contract Service
 * Handles interaction with Plutus smart contracts on Cardano
 */
class CardanoContractService {
    constructor() {
        // Lucid will be loaded lazily
    }
    async ensureLucid() {
        if (!this.lucid) {
            this.lucid = cardano_wallet_service_1.cardanoWalletService.getLucidInstance();
        }
    }
    /**
     * Get backend's public key hash to share with smart contract
     */
    async getBackendPublicKeyHash() {
        return await cardano_wallet_service_1.cardanoWalletService.getBackendPublicKeyHash();
    }
    /**
     * Get backend's address to receive payments from smart contract
     */
    async getBackendAddress() {
        return await cardano_wallet_service_1.cardanoWalletService.getBackendAddress();
    }
    /**
     * Lock funds in a smart contract
     * @param scriptAddress - The Plutus script address
     * @param amount - Amount in lovelace to lock
     * @param datum - Data to attach to the UTxO
     */
    async lockFundsInContract(scriptAddress, amount, datum) {
        await this.ensureLucid();
        if (!this.lucid) {
            throw new Error('Cardano wallet service not initialized');
        }
        try {
            const { Data } = await Promise.resolve().then(() => __importStar(require('lucid-cardano')));
            // Convert datum to Plutus data format
            const datumData = Data.to(datum);
            // Build transaction
            const tx = await this.lucid
                .newTx()
                .payToContract(scriptAddress, { inline: datumData }, { lovelace: amount })
                .complete();
            // Sign transaction
            const signedTx = await tx.sign().complete();
            // Submit transaction
            const txHash = await signedTx.submit();
            console.log('✅ Funds locked in contract:', txHash);
            return txHash;
        }
        catch (error) {
            console.error('Error locking funds in contract:', error);
            throw error;
        }
    }
    /**
     * Unlock funds from a smart contract
     * @param scriptAddress - The Plutus script address
     * @param scriptCbor - The script CBOR hex string
     * @param utxos - UTxOs to spend from the script
     * @param redeemer - Redeemer data
     */
    async unlockFundsFromContract(scriptAddress, scriptCbor, utxos, redeemer) {
        await this.ensureLucid();
        if (!this.lucid) {
            throw new Error('Cardano wallet service not initialized');
        }
        try {
            const { Data } = await Promise.resolve().then(() => __importStar(require('lucid-cardano')));
            const redeemerData = Data.to(redeemer);
            // Build transaction to spend from script
            const tx = await this.lucid
                .newTx()
                .collectFrom(utxos, redeemerData)
                .attachSpendingValidator({
                type: 'PlutusV2',
                script: scriptCbor
            })
                .complete();
            // Sign transaction with backend wallet
            const signedTx = await tx.sign().complete();
            // Submit transaction
            const txHash = await signedTx.submit();
            console.log('✅ Funds unlocked from contract:', txHash);
            return txHash;
        }
        catch (error) {
            console.error('Error unlocking funds from contract:', error);
            throw error;
        }
    }
    /**
     * Get UTxOs at a script address
     */
    async getScriptUtxos(scriptAddress) {
        await this.ensureLucid();
        if (!this.lucid) {
            throw new Error('Cardano wallet service not initialized');
        }
        try {
            const utxos = await this.lucid.utxosAt(scriptAddress);
            return utxos;
        }
        catch (error) {
            console.error('Error getting script UTxOs:', error);
            throw error;
        }
    }
    /**
     * Submit signed transaction data (for when user signs on frontend)
     */
    async submitSignedTransaction(signedTxCbor) {
        await this.ensureLucid();
        if (!this.lucid) {
            throw new Error('Cardano wallet service not initialized');
        }
        try {
            const txHash = await this.lucid.provider.submitTx(signedTxCbor);
            console.log('✅ Signed transaction submitted:', txHash);
            return txHash;
        }
        catch (error) {
            console.error('Error submitting signed transaction:', error);
            throw error;
        }
    }
    /**
     * Build transaction for user to sign (when backend initiates but user pays)
     */
    async buildTransactionForUser(userAddress, scriptAddress, amount, datum) {
        await this.ensureLucid();
        if (!this.lucid) {
            throw new Error('Cardano wallet service not initialized');
        }
        try {
            const { Data } = await Promise.resolve().then(() => __importStar(require('lucid-cardano')));
            const datumData = Data.to(datum);
            // Build transaction but don't sign
            const tx = await this.lucid
                .newTx()
                .payToContract(scriptAddress, { inline: datumData }, { lovelace: amount })
                .complete();
            // Return unsigned transaction CBOR for user to sign
            const unsignedTxCbor = tx.toString();
            console.log('✅ Transaction built for user to sign');
            return unsignedTxCbor;
        }
        catch (error) {
            console.error('Error building transaction for user:', error);
            throw error;
        }
    }
    /**
     * Create a datum with backend's public key hash
     * This can be used to prove the backend authorized the transaction
     */
    createDatumWithBackendAuth(additionalData) {
        return new Promise(async (resolve, reject) => {
            try {
                const backendPkh = await this.getBackendPublicKeyHash();
                // Create datum structure (adjust based on your smart contract)
                const datum = {
                    backendPubKeyHash: backendPkh,
                    timestamp: BigInt(Date.now()),
                    data: additionalData
                };
                resolve(datum);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Wait for transaction confirmation
     */
    async awaitTransactionConfirmation(txHash, maxWaitTime = 180000) {
        await this.ensureLucid();
        if (!this.lucid) {
            throw new Error('Cardano wallet service not initialized');
        }
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitTime) {
            try {
                const confirmed = await this.lucid.awaitTx(txHash);
                if (confirmed) {
                    console.log('✅ Transaction confirmed:', txHash);
                    return true;
                }
            }
            catch (error) {
                console.log('Waiting for confirmation...', txHash);
            }
            // Wait 5 seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        console.log('⏰ Transaction confirmation timeout:', txHash);
        return false;
    }
    /**
     * Get transaction details
     */
    async getTransaction(txHash) {
        await this.ensureLucid();
        if (!this.lucid) {
            throw new Error('Cardano wallet service not initialized');
        }
        try {
            // Note: This requires provider support
            const tx = await this.lucid.provider.getUtxosByOutRef([{ txHash, outputIndex: 0 }]);
            return tx;
        }
        catch (error) {
            console.error('Error getting transaction:', error);
            throw error;
        }
    }
}
exports.CardanoContractService = CardanoContractService;
exports.cardanoContractService = new CardanoContractService();
