"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whatsapp_service_1 = require("../services/whatsapp.service");
const ai_service_1 = require("../services/ai.service");
const auth_service_1 = require("../services/auth.service");
const transaction_service_1 = require("../services/transaction.service");
const exchange_service_1 = require("../services/exchange.service");
const wallet_service_1 = require("../services/wallet.service");
const rateLimit_1 = require("../middleware/rateLimit");
const router = (0, express_1.Router)();
const whatsappService = new whatsapp_service_1.WhatsAppService();
const aiService = new ai_service_1.AIService();
const transactionService = new transaction_service_1.TransactionService();
const exchangeService = new exchange_service_1.ExchangeService();
const walletService = new wallet_service_1.WalletService();
// Webhook verification
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const result = whatsappService.verifyWebhook(mode, token, challenge);
    if (result) {
        res.status(200).send(result);
    }
    else {
        res.status(403).send('Forbidden');
    }
});
// Webhook message handler
router.post('/webhook', rateLimit_1.whatsappRateLimit, async (req, res) => {
    try {
        const messages = whatsappService.parseWebhookMessage(req.body);
        for (const message of messages) {
            // Process each message asynchronously
            processWhatsAppMessage(message);
        }
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('WhatsApp webhook error:', error);
        res.status(500).send('Internal Server Error');
    }
});
// Process WhatsApp message (async function to handle business logic)
async function processWhatsAppMessage(message) {
    try {
        const phoneNumber = message.from;
        // Mark message as read
        await whatsappService.markAsRead(message.id);
        // Get or create user
        const user = await auth_service_1.AuthService.loginOrRegister(phoneNumber);
        // Get user context for AI
        const userContext = {
            userId: user.id,
            status: user.status,
            kycVerified: user.status === 'VERIFIED'
        };
        // Process message with AI
        const aiResult = await aiService.processWhatsAppMessage(message, userContext);
        // Handle different intents
        let responseMessage = aiResult.response;
        switch (aiResult.intent) {
            case 'transfer':
                responseMessage = await handleTransferIntent(aiResult, user, phoneNumber);
                break;
            case 'balance':
                responseMessage = await handleBalanceIntent(user, phoneNumber);
                break;
            case 'rate':
                responseMessage = await handleRateIntent(phoneNumber);
                break;
            case 'history':
                responseMessage = await handleHistoryIntent(user, phoneNumber);
                break;
            case 'kyc':
                responseMessage = await handleKYCIntent(user, phoneNumber);
                break;
            case 'help':
                responseMessage = await aiService.generateHelpMessage();
                break;
            default:
                // Use AI response for unknown intents
                break;
        }
        // Send response
        await whatsappService.sendMessage(phoneNumber, responseMessage);
    }
    catch (error) {
        console.error('Process WhatsApp message error:', error);
        // Send error message to user
        const errorMessage = `Maaf, terjadi kesalahan. Silakan coba lagi dalam beberapa saat.
Sorry, an error occurred. Please try again in a moment.`;
        try {
            await whatsappService.sendMessage(message.from, errorMessage);
        }
        catch (sendError) {
            console.error('Failed to send error message:', sendError);
        }
    }
}
async function handleTransferIntent(aiResult, user, phoneNumber) {
    try {
        if (user.status !== 'VERIFIED') {
            return `🔒 Akun Anda belum terverifikasi KYC. Ketik "KYC" untuk panduan verifikasi.
🔒 Your account is not KYC verified. Type "KYC" for verification guidance.`;
        }
        const { amount, recipient_phone, source_currency, target_currency } = aiResult.data || {};
        if (!amount || !recipient_phone) {
            return `❌ Format transfer tidak lengkap. Contoh: "Kirim 100 USDC ke +628123456789"
❌ Transfer format incomplete. Example: "Send 100 USDC to +628123456789"`;
        }
        // Calculate transfer quote
        const quote = await exchangeService.calculateTransferAmount(amount, source_currency || 'USDC', target_currency || 'IDR');
        // Generate confirmation message
        const confirmationMessage = await aiService.generateTransferConfirmation(quote.sourceAmount, quote.targetAmount, recipient_phone, quote.exchangeRate, quote.feeAmount);
        return confirmationMessage + `\n\n💡 Balas "YA" untuk konfirmasi atau "TIDAK" untuk batal.\n💡 Reply "YES" to confirm or "NO" to cancel.`;
    }
    catch (error) {
        console.error('Handle transfer intent error:', error);
        return `❌ Gagal memproses permintaan transfer. Silakan coba lagi.
❌ Failed to process transfer request. Please try again.`;
    }
}
async function handleBalanceIntent(user, phoneNumber) {
    try {
        const wallet = await walletService.getActiveWallet(user.id);
        if (!wallet) {
            return `💳 Wallet belum dibuat. Wallet akan dibuat otomatis saat Anda melakukan transfer pertama.
💳 Wallet not created yet. Wallet will be created automatically when you make your first transfer.`;
        }
        const usdcBalance = await walletService.getWalletBalance(wallet.wallet_address, '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' // Polygon USDC
        );
        const nativeBalance = await walletService.getWalletBalance(wallet.wallet_address);
        return `💰 Saldo / Balance:
• USDC: ${parseFloat(usdcBalance).toFixed(2)}
• MATIC: ${parseFloat(nativeBalance).toFixed(4)}

📍 Alamat Wallet / Wallet Address:
${wallet.wallet_address}`;
    }
    catch (error) {
        console.error('Handle balance intent error:', error);
        return `❌ Gagal mengambil informasi saldo. Silakan coba lagi.
❌ Failed to retrieve balance information. Please try again.`;
    }
}
async function handleRateIntent(phoneNumber) {
    try {
        const rate = await exchangeService.getExchangeRate('USDC', 'IDR');
        return `💱 Kurs Terkini / Current Exchange Rate:

1 USDC = Rp ${rate.rate.toLocaleString('id-ID')} IDR

⏰ Update: ${new Date(rate.timestamp).toLocaleString('id-ID')}
📊 Data dari Indodax / Data from Indodax`;
    }
    catch (error) {
        console.error('Handle rate intent error:', error);
        return `❌ Gagal mengambil kurs terkini. Silakan coba lagi.
❌ Failed to retrieve current exchange rate. Please try again.`;
    }
}
async function handleHistoryIntent(user, phoneNumber) {
    try {
        const transactions = await transactionService.getUserTransactions(user.id, 5);
        if (transactions.length === 0) {
            return `📋 Belum ada transaksi / No transactions yet

🚀 Mulai kirim uang dengan mengetik: "Kirim [jumlah] ke [nomor]"
🚀 Start sending money by typing: "Send [amount] to [number]"`;
        }
        let message = '📋 Riwayat Transaksi Terakhir / Recent Transaction History:\n\n';
        transactions.forEach((tx, index) => {
            const date = new Date(tx.created_at).toLocaleDateString('id-ID');
            const status = tx.status === 'COMPLETED' ? '✅' :
                tx.status === 'PROCESSING' ? '⏳' :
                    tx.status === 'FAILED' ? '❌' : '⏳';
            message += `${index + 1}. ${status} ${tx.source_amount} ${tx.source_currency} → Rp ${Number(tx.target_amount).toLocaleString('id-ID')}
   📱 Ke: ${tx.recipient_phone}
   📅 ${date}

`;
        });
        return message;
    }
    catch (error) {
        console.error('Handle history intent error:', error);
        return `❌ Gagal mengambil riwayat transaksi. Silakan coba lagi.
❌ Failed to retrieve transaction history. Please try again.`;
    }
}
async function handleKYCIntent(user, phoneNumber) {
    try {
        if (user.status === 'VERIFIED') {
            return `✅ Akun Anda sudah terverifikasi KYC!
✅ Your account is already KYC verified!

🚀 Anda sudah bisa mulai mengirim uang. Ketik "bantuan" untuk panduan.
🚀 You can now start sending money. Type "help" for guidance.`;
        }
        return await aiService.generateKYCGuidance();
    }
    catch (error) {
        console.error('Handle KYC intent error:', error);
        return `❌ Gagal mengambil panduan KYC. Silakan coba lagi.
❌ Failed to retrieve KYC guidance. Please try again.`;
    }
}
// Send message endpoint (for admin/system use)
router.post('/send', async (req, res) => {
    try {
        const { to, message } = req.body;
        if (!to || !message) {
            return res.status(400).json({ error: 'Phone number and message are required' });
        }
        await whatsappService.sendMessage(to, message);
        res.json({ message: 'Message sent successfully' });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});
exports.default = router;
