import OpenAI from 'openai';
import { config } from '../utils/config';
import { WhatsAppMessage, AIProcessingResult } from '../types';

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
  }

  async processWhatsAppMessage(
    message: WhatsAppMessage,
    userContext?: any
  ): Promise<AIProcessingResult> {
    try {
      const messageText = message.text?.body || '';
      
      const systemPrompt = `You are TrustBridge AI, a helpful assistant for a WhatsApp-based cryptocurrency remittance service that helps Indonesian workers send money to their families.

Your capabilities:
1. Help users send money transfers (USDC to IDR)
2. Check account balances
3. Provide current exchange rates
4. Show transaction history
5. Guide users through KYC verification
6. Answer general questions about the service

User context: ${JSON.stringify(userContext || {})}

Analyze the user's message and respond with appropriate intent and data. Be helpful, friendly, and clear in Indonesian or English.

For transfer requests, extract:
- amount (number)
- recipient_phone (string)
- target_currency (usually IDR)

For other requests, provide helpful responses.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: messageText }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const aiResponse = response.choices[0]?.message?.content || '';
      
      // Simple intent classification based on keywords
      const intent = this.classifyIntent(messageText);
      const data = this.extractData(messageText, intent);

      return {
        intent,
        data,
        response: aiResponse
      };
    } catch (error) {
      console.error('AI processing error:', error);
      return {
        intent: 'unknown',
        response: 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi dalam beberapa saat. / Sorry, I am experiencing issues. Please try again in a moment.'
      };
    }
  }

  private classifyIntent(message: string): AIProcessingResult['intent'] {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('kirim') || lowerMessage.includes('send') || 
        lowerMessage.includes('transfer') || lowerMessage.includes('uang')) {
      return 'transfer';
    }

    if (lowerMessage.includes('saldo') || lowerMessage.includes('balance') || 
        lowerMessage.includes('berapa')) {
      return 'balance';
    }

    if (lowerMessage.includes('kurs') || lowerMessage.includes('rate') || 
        lowerMessage.includes('harga') || lowerMessage.includes('nilai tukar')) {
      return 'rate';
    }

    if (lowerMessage.includes('history') || lowerMessage.includes('riwayat') || 
        lowerMessage.includes('transaksi sebelumnya')) {
      return 'history';
    }

    if (lowerMessage.includes('kyc') || lowerMessage.includes('verifikasi') || 
        lowerMessage.includes('dokumen')) {
      return 'kyc';
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('bantuan') || 
        lowerMessage.includes('panduan')) {
      return 'help';
    }

    return 'unknown';
  }

  private extractData(message: string, intent: AIProcessingResult['intent']): any {
    const data: any = {};

    if (intent === 'transfer') {
      // Extract amount using regex
      const amountMatch = message.match(/(\d+(?:[.,]\d+)?)/);
      if (amountMatch) {
        data.amount = parseFloat(amountMatch[1].replace(',', '.'));
      }

      // Extract phone number (Indonesian format)
      const phoneMatch = message.match(/(?:\+62|62|0)(\d{8,12})/);
      if (phoneMatch) {
        data.recipient_phone = '+62' + phoneMatch[1];
      }

      // Default currency
      data.source_currency = 'USDC';
      data.target_currency = 'IDR';
    }

    return Object.keys(data).length > 0 ? data : undefined;
  }

  async generateTransferConfirmation(
    amount: number,
    targetAmount: number,
    recipientPhone: string,
    exchangeRate: number,
    fee: number
  ): Promise<string> {
    try {
      const prompt = `Generate a confirmation message in Indonesian and English for a money transfer with these details:
- Amount: $${amount} USDC
- Target Amount: Rp ${targetAmount.toLocaleString('id-ID')} IDR  
- Recipient: ${recipientPhone}
- Exchange Rate: 1 USDC = Rp ${exchangeRate.toLocaleString('id-ID')} IDR
- Fee: $${fee} USDC

Make it clear, professional, and ask for confirmation.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300
      });

      return response.choices[0]?.message?.content || 'Transfer confirmation generated.';
    } catch (error) {
      console.error('Generate confirmation error:', error);
      return `Konfirmasi Transfer / Transfer Confirmation:
💰 Jumlah: $${amount} USDC → Rp ${targetAmount.toLocaleString('id-ID')} IDR
📱 Penerima: ${recipientPhone}
💱 Kurs: 1 USDC = Rp ${exchangeRate.toLocaleString('id-ID')} IDR
💸 Biaya: $${fee} USDC

Apakah Anda yakin ingin melanjutkan? / Are you sure you want to proceed?`;
    }
  }

  async generateKYCGuidance(step?: string): Promise<string> {
    try {
      const prompt = `Generate KYC verification guidance in Indonesian and English. ${step ? `Focus on step: ${step}` : 'Provide general overview.'}

Include information about:
- Required documents (e-KTP or Passport)
- Photo requirements
- Verification process
- Processing time

Be helpful and reassuring.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 400
      });

      return response.choices[0]?.message?.content || 'KYC guidance generated.';
    } catch (error) {
      console.error('Generate KYC guidance error:', error);
      return `📋 Panduan Verifikasi KYC / KYC Verification Guide:

1️⃣ Siapkan dokumen: e-KTP atau Paspor / Prepare documents: e-KTP or Passport
2️⃣ Foto yang jelas dan tidak blur / Clear and non-blurry photos
3️⃣ Upload melalui menu KYC / Upload through KYC menu
4️⃣ Tunggu verifikasi 1-2 hari kerja / Wait for verification 1-2 business days

📞 Butuh bantuan? Hubungi customer service / Need help? Contact customer service`;
    }
  }

  async generateHelpMessage(): Promise<string> {
    return `🤖 TrustBridge - Bantuan / Help

📋 Perintah yang tersedia / Available commands:
• "Kirim [jumlah] ke [nomor]" - Transfer uang / Send money
• "Saldo" - Cek saldo / Check balance  
• "Kurs" - Lihat kurs terkini / View current rate
• "Riwayat" - Lihat transaksi / View history
• "KYC" - Panduan verifikasi / Verification guide

💬 Contoh / Examples:
• "Kirim 100 USDC ke +628123456789"
• "Berapa kurs USDC ke IDR hari ini?"
• "Saldo saya berapa?"

🔒 Untuk keamanan, pastikan akun Anda sudah terverifikasi KYC.
🔒 For security, ensure your account is KYC verified.`;
  }
}

export default AIService;