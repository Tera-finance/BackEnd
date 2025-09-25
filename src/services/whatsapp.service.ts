import axios from 'axios';
import { config } from '../utils/config';
import { WhatsAppMessage } from '../types';

export class WhatsAppService {
  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    this.apiUrl = config.whatsapp.apiUrl;
    this.accessToken = config.whatsapp.accessToken;
    this.phoneNumberId = config.whatsapp.phoneNumberId;
  }

  async sendMessage(to: string, message: string): Promise<void> {
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

      const response = await axios.post(url, payload, { headers });
      
      console.log('WhatsApp message sent:', response.data);
    } catch (error: any) {
      console.error('Send WhatsApp message error:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  async sendTemplateMessage(
    to: string, 
    templateName: string, 
    parameters: string[]
  ): Promise<void> {
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

      const response = await axios.post(url, payload, { headers });
      
      console.log('WhatsApp template message sent:', response.data);
    } catch (error: any) {
      console.error('Send WhatsApp template message error:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp template message');
    }
  }

  async sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<void> {
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

      const response = await axios.post(url, payload, { headers });
      
      console.log('WhatsApp image message sent:', response.data);
    } catch (error: any) {
      console.error('Send WhatsApp image message error:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp image message');
    }
  }

  async markAsRead(messageId: string): Promise<void> {
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

      await axios.post(url, payload, { headers });
    } catch (error: any) {
      console.error('Mark message as read error:', error.response?.data || error.message);
    }
  }

  parseWebhookMessage(webhookBody: any): WhatsAppMessage[] {
    const messages: WhatsAppMessage[] = [];

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
    } catch (error) {
      console.error('Parse webhook message error:', error);
    }

    return messages;
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
      return challenge;
    }
    return null;
  }

  async sendWelcomeMessage(to: string, userName?: string): Promise<void> {
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

  async sendTransferNotification(
    to: string,
    amount: number,
    currency: string,
    status: string
  ): Promise<void> {
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