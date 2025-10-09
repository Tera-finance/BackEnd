"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../utils/database");
const exchange_service_1 = require("./exchange.service");
class TransactionService {
    constructor() {
        this.exchangeService = new exchange_service_1.ExchangeService();
    }
    async createTransaction(senderId, recipientPhone, sourceCurrency, targetCurrency, sourceAmount, recipientBankAccount) {
        try {
            const sender = await (0, database_1.queryOne)('SELECT * FROM users WHERE id = ?', [senderId]);
            if (!sender) {
                throw new Error('Sender not found');
            }
            if (sender.status !== 'VERIFIED') {
                throw new Error('Sender must be KYC verified');
            }
            // Calculate transfer amounts and fees
            const calculation = await this.exchangeService.calculateTransferAmount(sourceAmount, sourceCurrency, targetCurrency);
            const transactionId = (0, uuid_1.v4)();
            await (0, database_1.query)(`INSERT INTO transactions 
         (id, sender_id, recipient_phone, source_currency, target_currency, 
          source_amount, target_amount, exchange_rate, fee_amount, total_amount, 
          status, recipient_bank_account) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`, [
                transactionId,
                senderId,
                recipientPhone,
                sourceCurrency,
                targetCurrency,
                calculation.sourceAmount,
                calculation.targetAmount,
                calculation.exchangeRate,
                calculation.feeAmount,
                calculation.totalAmount,
                recipientBankAccount
            ]);
            const transaction = await (0, database_1.queryOne)('SELECT * FROM transactions WHERE id = ?', [transactionId]);
        }
        finally { }
        select()
            .single();
        if (error) {
            throw new Error(`Failed to create transaction: ${error.message}`);
        }
        console.log('Transaction created:', transaction.id);
        return transaction;
    }
    catch(error) {
        console.error('Create transaction error:', error);
        throw error;
    }
}
exports.TransactionService = TransactionService;
async;
processTransaction(transactionId, string);
Promise < database_1.Transaction > {
    try: {
        const: { data: transaction } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single(),
        if(, transaction) {
            throw new Error('Transaction not found');
        },
        if(transaction) { }, : .status !== 'PENDING'
    }
};
{
    throw new Error('Transaction is not pending');
}
// Get sender's wallet
const wallet = await this.walletService.getActiveWallet(transaction.sender_id);
if (!wallet) {
    throw new Error('Sender wallet not found');
}
// Update transaction status to PROCESSING
await supabase
    .from('transactions')
    .update({ status: 'PROCESSING' })
    .eq('id', transactionId);
// Initiate blockchain transfer
const tokenAddress = transaction.source_currency === 'USDC'
    ? '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' // Polygon USDC
    : '0x0000000000000000000000000000000000000000'; // Native token
const txHash = await this.blockchainService.initiateTransfer(wallet.wallet_address, '0x0000000000000000000000000000000000000000', // Contract address
transaction.source_amount.toString(), tokenAddress);
// Update transaction with blockchain hash
const { data: updatedTransaction } = await supabase
    .from('transactions')
    .update({
    blockchain_tx_hash: txHash,
    status: 'PROCESSING'
})
    .eq('id', transactionId)
    .select()
    .single();
console.log('Transaction processing:', transactionId, 'Hash:', txHash);
// In a real implementation, you would:
// 1. Lock tokens in smart contract
// 2. Notify local partner about the transfer
// 3. Wait for partner to process IDR transfer
// 4. Complete transaction when confirmed
return updatedTransaction;
try { }
catch (error) {
    console.error('Process transaction error:', error);
    // Mark transaction as failed
    await supabase
        .from('transactions')
        .update({ status: 'FAILED' })
        .eq('id', transactionId);
    throw error;
}
async;
completeTransaction(transactionId, string);
Promise < database_1.Transaction > {
    try: {
        const: { data: transaction } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single(),
        if(, transaction) {
            throw new Error('Transaction not found');
        },
        if(transaction) { }, : .status !== 'PROCESSING'
    }
};
{
    throw new Error('Transaction is not being processed');
}
// Update transaction status to COMPLETED
const now = new Date().toISOString();
const { data: completedTransaction } = await supabase
    .from('transactions')
    .update({
    status: 'COMPLETED',
    completed_at: now
})
    .eq('id', transactionId)
    .select()
    .single();
console.log('Transaction completed:', transactionId);
return completedTransaction;
try { }
catch (error) {
    console.error('Complete transaction error:', error);
    throw error;
}
async;
getTransaction(transactionId, string);
Promise < database_1.Transaction | null > {
    try: {
        const: { data: transaction } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single(),
        return: transaction
    }, catch(error) {
        console.error('Get transaction error:', error);
        throw error;
    }
};
async;
getUserTransactions(userId, string, limit, number = 50, offset, number = 0);
Promise < database_1.Transaction[] > {
    try: {
        const: { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('sender_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1),
        return: transactions || []
    }, catch(error) {
        console.error('Get user transactions error:', error);
        throw error;
    }
};
async;
getTransactionsByStatus(status, TransactionStatus);
Promise < database_1.Transaction[] > {
    try: {
        const: { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false }),
        return: transactions || []
    }, catch(error) {
        console.error('Get transactions by status error:', error);
        throw error;
    }
};
async;
updateTransactionStatus(transactionId, string, status, TransactionStatus, blockchainTxHash ?  : string);
Promise < database_1.Transaction > {
    try: {
        const: updateData, any = { status },
        if(blockchainTxHash) {
            updateData.blockchain_tx_hash = blockchainTxHash;
        },
        if(status) { }
    } === 'COMPLETED'
};
{
    updateData.completed_at = new Date().toISOString();
}
const { data: transaction } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', transactionId)
    .select()
    .single();
return transaction;
try { }
catch (error) {
    console.error('Update transaction status error:', error);
    throw error;
}
async;
cancelTransaction(transactionId, string);
Promise < database_1.Transaction > {
    try: {
        const: { data: transaction } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single(),
        if(, transaction) {
            throw new Error('Transaction not found');
        },
        if(transaction) { }, : .status !== 'PENDING'
    }
};
{
    throw new Error('Only pending transactions can be cancelled');
}
const { data: cancelled } = await supabase
    .from('transactions')
    .update({ status: 'CANCELLED' })
    .eq('id', transactionId)
    .select()
    .single();
return cancelled;
try { }
catch (error) {
    console.error('Cancel transaction error:', error);
    throw error;
}
