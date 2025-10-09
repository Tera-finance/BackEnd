"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../utils/config");
class WhatsAppService {
    constructor() {
        this.apiUrl = config_1.config.whatsapp.apiUrl;
        this.accessToken = config_1.config.whatsapp.accessToken;
        this.phoneNumberId = config_1.config.whatsapp.phoneNumberId;
    }
    async sendMessage(to, message) {
        try {
            const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
            const payload = {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: {
                    body: message
                }
            };
            const headers = {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            };
            const response = await axios_1.default.post(url, payload, { headers });
            console.log('WhatsApp message sent:', response.data);
        }
        catch (error) {
            console.error('Send WhatsApp message error:', error.response?.data || error.message);
            throw new Error('Failed to send WhatsApp message');
        }
    }
    async sendTemplateMessage(to, templateName, parameters) {
        try {
            const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
            const payload = {
                messaging_product: 'whatsapp',
                to: to,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: 'id' // Indonesian
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: parameters.map(param => ({
                                type: 'text',
                                text: param
                            }))
                        }
                    ]
                }
            };
            const headers = {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            };
            const response = await axios_1.default.post(url, payload, { headers });
            console.log('WhatsApp template message sent:', response.data);
        }
        catch (error) {
            console.error('Send WhatsApp template message error:', error.response?.data || error.message);
            throw new Error('Failed to send WhatsApp template message');
        }
    }
    async sendImageMessage(to, imageUrl, caption) {
        try {
            const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
            const payload = {
                messaging_product: 'whatsapp',
                to: to,
                type: 'image',
                image: {
                    link: imageUrl,
                    caption: caption
                }
            };
            const headers = {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            };
            const response = await axios_1.default.post(url, payload, { headers });
            console.log('WhatsApp image message sent:', response.data);
        }
        catch (error) {
            console.error('Send WhatsApp image message error:', error.response?.data || error.message);
            throw new Error('Failed to send WhatsApp image message');
        }
    }
    async markAsRead(messageId) {
        try {
            const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
            const payload = {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            };
            const headers = {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            };
            await axios_1.default.post(url, payload, { headers });
        }
        catch (error) {
            console.error('Mark message as read error:', error.response?.data || error.message);
        }
    }
    parseWebhookMessage(webhookBody) {
        const messages = [];
        try {
            if (webhookBody.entry) {
                for (const entry of webhookBody.entry) {
                    if (entry.changes) {
                        for (const change of entry.changes) {
                            if (change.value && change.value.messages) {
                                for (const message of change.value.messages) {
                                    messages.push({
                                        from: message.from,
                                        id: message.id,
                                        timestamp: message.timestamp,
                                        text: message.text,
                                        image: message.image
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Parse webhook message error:', error);
        }
        return messages;
    }
    verifyWebhook(mode, token, challenge) {
        if (mode === 'subscribe' && token === config_1.config.whatsapp.verifyToken) {
            return challenge;
        }
        return null;
    }
    async sendWelcomeMessage(to, userName) {
        const message = `🎉 Selamat datang di TrustBridge! / Welcome to TrustBridge! ${userName ? `\n\nHalo ${userName}! / Hello ${userName}!` : ''}

🚀 TrustBridge membantu Anda mengirim uang dengan mudah dan aman menggunakan cryptocurrency.
🚀 TrustBridge helps you send money easily and securely using cryptocurrency.

📋 Untuk memulai:
1️⃣ Verifikasi KYC (ketik "KYC")
2️⃣ Deposit USDC ke wallet Anda  
3️⃣ Mulai kirim uang ke keluarga

📋 To get started:
1️⃣ Complete KYC verification (type "KYC")
2️⃣ Deposit USDC to your wallet
3️⃣ Start sending money to family

💬 Ketik "bantuan" untuk panduan lengkap / Type "help" for complete guide`;
        await this.sendMessage(to, message);
    }
    async sendTransferNotification(to, amount, currency, status) {
        let message = '';
        switch (status) {
            case 'PENDING':
                message = `⏳ Transfer Diproses / Transfer Processing

💰 Jumlah: ${amount} ${currency}
🔄 Status: Sedang diproses
📱 Ke: ${to}

Kami akan memberi tahu Anda ketika transfer selesai.
We will notify you when the transfer is complete.`;
                break;
            case 'COMPLETED':
                message = `✅ Transfer Berhasil / Transfer Successful

💰 Jumlah: ${amount} ${currency}
✅ Status: Selesai
📱 Ke: ${to}

Uang telah berhasil diterima penerima.
Money has been successfully received by the recipient.`;
                break;
            case 'FAILED':
                message = `❌ Transfer Gagal / Transfer Failed

💰 Jumlah: ${amount} ${currency}
❌ Status: Gagal
📱 Ke: ${to}

Dana telah dikembalikan ke akun Anda. Silakan coba lagi atau hubungi customer service.
Funds have been returned to your account. Please try again or contact customer service.`;
                break;
        }
        if (message) {
            await this.sendMessage(to, message);
        }
    }
}
exports.WhatsAppService = WhatsAppService;
