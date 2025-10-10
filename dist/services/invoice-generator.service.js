"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceGeneratorService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class InvoiceGeneratorService {
    /**
     * Generate PDF invoice for a transfer
     */
    static async generateInvoice(transfer) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
                const chunks = [];
                // Collect PDF data
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
                // Header with branding
                doc
                    .fontSize(28)
                    .fillColor('#7C3AED')
                    .text('TrustBridge', 50, 50)
                    .fontSize(10)
                    .fillColor('#666666')
                    .text('Cross-Border Blockchain Payments', 50, 85);
                // Invoice title
                doc
                    .fontSize(20)
                    .fillColor('#000000')
                    .text('PAYMENT INVOICE', 400, 50, { align: 'right' });
                // Transaction ID and Status
                doc
                    .fontSize(10)
                    .fillColor('#666666')
                    .text(`Invoice #: ${transfer.id}`, 400, 80, { align: 'right' })
                    .text(`Status: ${transfer.status.toUpperCase()}`, 400, 95, { align: 'right' })
                    .text(`Date: ${new Date(transfer.created_at).toLocaleDateString()}`, 400, 110, { align: 'right' });
                // Horizontal line
                doc
                    .moveTo(50, 140)
                    .lineTo(545, 140)
                    .stroke('#7C3AED');
                // Transfer Summary Section
                doc
                    .fontSize(14)
                    .fillColor('#7C3AED')
                    .text('Transfer Summary', 50, 160);
                // Sender Information
                doc
                    .fontSize(10)
                    .fillColor('#666666')
                    .text('FROM', 50, 190)
                    .fontSize(11)
                    .fillColor('#000000')
                    .text(`WhatsApp: ${transfer.whatsapp_number}`, 50, 205)
                    .text(`Payment Method: ${transfer.payment_method}`, 50, 220);
                // Recipient Information
                doc
                    .fontSize(10)
                    .fillColor('#666666')
                    .text('TO', 50, 250)
                    .fontSize(11)
                    .fillColor('#000000')
                    .text(`${transfer.recipient_name}`, 50, 265)
                    .text(`${transfer.recipient_bank} - ${transfer.recipient_account}`, 50, 280)
                    .text(`${transfer.recipient_currency} Account`, 50, 295);
                // Amount Details Box
                const amountBoxY = 340;
                doc
                    .rect(50, amountBoxY, 495, 120)
                    .fillAndStroke('#F3F4F6', '#E5E7EB');
                // Amount sent
                doc
                    .fontSize(10)
                    .fillColor('#666666')
                    .text('YOU SENT', 70, amountBoxY + 20)
                    .fontSize(24)
                    .fillColor('#7C3AED')
                    .text(`${this.formatCurrency(transfer.sender_amount, transfer.sender_currency)}`, 70, amountBoxY + 35);
                // Amount received
                doc
                    .fontSize(10)
                    .fillColor('#666666')
                    .text('RECIPIENT RECEIVES', 320, amountBoxY + 20)
                    .fontSize(24)
                    .fillColor('#10B981')
                    .text(`${this.formatCurrency(transfer.recipient_expected_amount, transfer.recipient_currency)}`, 320, amountBoxY + 35);
                // Exchange rate and fee
                doc
                    .fontSize(9)
                    .fillColor('#666666')
                    .text(`Exchange Rate: 1 ${transfer.sender_currency} = ${transfer.exchange_rate.toFixed(4)} ${transfer.recipient_currency}`, 70, amountBoxY + 75)
                    .text(`Fee (${transfer.fee_percentage}%): ${this.formatCurrency(transfer.fee_amount, transfer.sender_currency)}`, 70, amountBoxY + 90);
                // Blockchain Details
                if (transfer.ada_amount || transfer.mock_token) {
                    doc
                        .fontSize(14)
                        .fillColor('#7C3AED')
                        .text('Blockchain Details', 50, 490);
                    let blockchainY = 515;
                    if (transfer.ada_amount) {
                        doc
                            .fontSize(10)
                            .fillColor('#666666')
                            .text('mockADA Used:', 50, blockchainY)
                            .fillColor('#000000')
                            .text(`${transfer.ada_amount.toFixed(2)} mockADA`, 180, blockchainY);
                        blockchainY += 20;
                    }
                    if (transfer.mock_token) {
                        doc
                            .fontSize(10)
                            .fillColor('#666666')
                            .text('Swapped To:', 50, blockchainY)
                            .fillColor('#000000')
                            .text(transfer.mock_token, 180, blockchainY);
                        blockchainY += 20;
                    }
                    if (transfer.tx_hash) {
                        doc
                            .fontSize(10)
                            .fillColor('#666666')
                            .text('Transaction Hash:', 50, blockchainY)
                            .fontSize(8)
                            .fillColor('#7C3AED')
                            .text(transfer.tx_hash, 180, blockchainY, { width: 350 });
                        blockchainY += 25;
                    }
                    if (transfer.blockchain_tx_url) {
                        doc
                            .fontSize(9)
                            .fillColor('#666666')
                            .text('View on Cardano Explorer:', 50, blockchainY)
                            .fontSize(8)
                            .fillColor('#7C3AED')
                            .underline(180, blockchainY, 350, blockchainY, { color: '#7C3AED' })
                            .text(transfer.blockchain_tx_url, 180, blockchainY, { width: 350, link: transfer.blockchain_tx_url });
                    }
                }
                // Footer
                doc
                    .fontSize(8)
                    .fillColor('#999999')
                    .text('This invoice is generated electronically and is valid without a signature.', 50, 750, { align: 'center' })
                    .text('TrustBridge - Powered by Cardano Blockchain', 50, 765, { align: 'center' })
                    .text('https://trustbridge.io', 50, 780, { align: 'center' });
                // Finalize PDF
                doc.end();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Format currency with symbol
     */
    static formatCurrency(amount, currency) {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CNY': '¥',
            'IDR': 'Rp',
            'PHP': '₱',
            'THB': '฿',
            'MYR': 'RM',
            'SGD': 'S$',
            'INR': '₹',
            'VND': '₫',
            'AED': 'د.إ',
            'MXN': '$',
            'ADA': '₳',
        };
        const symbol = symbols[currency] || currency;
        const formatted = amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        // Symbol-first currencies
        if (['USD', 'EUR', 'GBP', 'SGD', 'MXN', 'ADA'].includes(currency)) {
            return `${symbol}${formatted}`;
        }
        // Symbol-last currencies
        return `${symbol} ${formatted}`;
    }
    /**
     * Save invoice to file system (for local storage)
     */
    static async saveInvoiceToFile(transfer, outputDir) {
        const buffer = await this.generateInvoice(transfer);
        const fileName = `TrustBridge-Invoice-${transfer.id}.pdf`;
        const filePath = path_1.default.join(outputDir, fileName);
        // Ensure directory exists
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        fs_1.default.writeFileSync(filePath, buffer);
        return filePath;
    }
}
exports.InvoiceGeneratorService = InvoiceGeneratorService;
