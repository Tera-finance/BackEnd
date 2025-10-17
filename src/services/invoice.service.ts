import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

interface InvoiceData {
  transferId: string;
  date: Date;
  senderAmount: number | string;
  senderCurrency: string;
  recipientAmount: number | string;
  recipientCurrency: string;
  recipientName: string;
  recipientBank: string;
  recipientAccount: string;
  exchangeRate: number | string;
  feeAmount: number | string;
  feePercentage: number | string;
  totalAmount: number | string;
  status: string;
  txHash?: string;
  blockchainTxUrl?: string;
  whatsappNumber: string;
}

export class InvoiceService {
  /**
   * Generate PDF invoice for a transfer
   */
  static async generateInvoice(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        // Collect PDF chunks
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(28)
          .font('Helvetica-Bold')
          .text('TrustBridge', 50, 50)
          .fontSize(10)
          .font('Helvetica')
          .text('Cross-Border Payment Receipt', 50, 85)
          .moveDown();

        // Draw horizontal line
        doc
          .moveTo(50, 110)
          .lineTo(545, 110)
          .stroke();

        // Transfer Status Badge
        const statusColor = this.getStatusColor(data.status);
        const statusY = 130;
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor(statusColor)
          .text(`Status: ${data.status.toUpperCase()}`, 50, statusY);

        // Transfer ID and Date
        doc
          .fontSize(10)
          .fillColor('#333333')
          .font('Helvetica')
          .text(`Transfer ID: ${data.transferId}`, 50, statusY + 25)
          .text(`Date: ${this.formatDate(data.date)}`, 50, statusY + 40);

        // Section: Sender Information
        let yPos = statusY + 80;
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Sender Information', 50, yPos);

        yPos += 25;
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#333333')
          .text('WhatsApp Number:', 50, yPos)
          .text(data.whatsappNumber, 200, yPos);

        yPos += 20;
        doc
          .text('Amount Sent:', 50, yPos)
          .font('Helvetica-Bold')
          .text(`${this.formatCurrency(data.senderAmount, data.senderCurrency)}`, 200, yPos);

        yPos += 20;
        doc
          .font('Helvetica')
          .text('Fee (1.5%):', 50, yPos)
          .text(`${this.formatCurrency(data.feeAmount, data.senderCurrency)}`, 200, yPos);

        yPos += 20;
        doc
          .font('Helvetica-Bold')
          .text('Total Charged:', 50, yPos)
          .text(`${this.formatCurrency(data.totalAmount, data.senderCurrency)}`, 200, yPos);

        // Section: Recipient Information
        yPos += 50;
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Recipient Information', 50, yPos);

        yPos += 25;
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#333333')
          .text('Recipient Name:', 50, yPos)
          .text(data.recipientName, 200, yPos);

        yPos += 20;
        doc
          .text('Bank:', 50, yPos)
          .text(data.recipientBank, 200, yPos);

        yPos += 20;
        doc
          .text('Account Number:', 50, yPos)
          .text(data.recipientAccount, 200, yPos);

        yPos += 20;
        doc
          .text('Amount Received:', 50, yPos)
          .font('Helvetica-Bold')
          .fillColor('#2E7D32')
          .text(`${this.formatCurrency(data.recipientAmount, data.recipientCurrency)}`, 200, yPos);

        // Section: Conversion Details
        yPos += 50;
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Conversion Details', 50, yPos);

        yPos += 25;
        const exchangeRate = typeof data.exchangeRate === 'string' ? parseFloat(data.exchangeRate) : data.exchangeRate;
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#333333')
          .text('Exchange Rate:', 50, yPos)
          .text(`1 ${data.senderCurrency} = ${exchangeRate.toFixed(4)} ${data.recipientCurrency}`, 200, yPos);

        yPos += 20;
        doc
          .text('Conversion Path:', 50, yPos)
          .text(`${data.senderCurrency} → ${data.recipientCurrency}`, 200, yPos);

        // Section: Blockchain Information (if available)
        if (data.txHash) {
          yPos += 50;
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#000000')
            .text('Blockchain Transaction', 50, yPos);

          yPos += 25;
          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#333333')
            .text('Transaction Hash:', 50, yPos)
            .fontSize(9)
            .text(data.txHash, 50, yPos + 15, { width: 495 });

          if (data.blockchainTxUrl) {
            yPos += 35;
            doc
              .fontSize(10)
              .fillColor('#1976D2')
              .text('View on Explorer:', 50, yPos)
              .link(50, yPos + 15, 495, 15, data.blockchainTxUrl)
              .text(data.blockchainTxUrl, 50, yPos + 15, {
                width: 495,
                link: data.blockchainTxUrl,
                underline: true
              });
          }
        }

        // Footer
        const footerY = 720;
        doc
          .moveTo(50, footerY)
          .lineTo(545, footerY)
          .stroke();

        doc
          .fontSize(9)
          .fillColor('#666666')
          .font('Helvetica')
          .text('TrustBridge - Cross-Border Payment System', 50, footerY + 15, {
            align: 'center',
            width: 495
          })
          .text('Powered by Base Sepolia Blockchain', 50, footerY + 30, {
            align: 'center',
            width: 495
          })
          .text('For support, contact: support@trustbridge.com', 50, footerY + 45, {
            align: 'center',
            width: 495
          });

        // Thank you message
        if (data.status === 'completed') {
          doc
            .fontSize(12)
            .fillColor('#2E7D32')
            .font('Helvetica-Bold')
            .text('Thank you for using TrustBridge!', 50, footerY - 30, {
              align: 'center',
              width: 495
            });
        }

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Format currency with proper symbol
   */
  private static formatCurrency(amount: number | string, currency: string): string {
    // Convert to number if string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Handle invalid numbers
    if (isNaN(numAmount)) {
      return `${currency} 0`;
    }

    const symbols: Record<string, string> = {
      'USD': '$',
      'IDR': 'Rp',
      'CNY': '¥',
      'EUR': '€',
      'JPY': '¥',
      'MXN': '$'
    };

    const symbol = symbols[currency] || currency;
    const decimals = ['IDR', 'JPY'].includes(currency) ? 0 : 2;

    if (currency === 'IDR') {
      return `${symbol} ${numAmount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (currency === 'JPY') {
      return `${symbol}${numAmount.toLocaleString('ja-JP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return `${symbol}${numAmount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }
  }

  /**
   * Format date
   */
  private static formatDate(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  /**
   * Get status color
   */
  private static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'completed': '#2E7D32',
      'processing': '#F57C00',
      'pending': '#1976D2',
      'failed': '#D32F2F',
      'cancelled': '#757575'
    };
    return colors[status.toLowerCase()] || '#333333';
  }

  /**
   * Generate invoice stream (for direct download)
   */
  static generateInvoiceStream(data: InvoiceData): InstanceType<typeof PDFDocument> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Use same generation logic but return stream
    this.generateInvoiceContent(doc, data);
    doc.end();

    return doc;
  }

  /**
   * Generate invoice content (shared logic)
   */
  private static generateInvoiceContent(doc: InstanceType<typeof PDFDocument>, data: InvoiceData): void {
    // Header
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('TrustBridge', 50, 50)
      .fontSize(10)
      .font('Helvetica')
      .text('Cross-Border Payment Receipt', 50, 85);

    // Draw horizontal line
    doc.moveTo(50, 110).lineTo(545, 110).stroke();

    // Transfer Status
    const statusColor = this.getStatusColor(data.status);
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(statusColor)
      .text(`Status: ${data.status.toUpperCase()}`, 50, 130);

    // Transfer ID and Date
    doc
      .fontSize(10)
      .fillColor('#333333')
      .font('Helvetica')
      .text(`Transfer ID: ${data.transferId}`, 50, 155)
      .text(`Date: ${this.formatDate(data.date)}`, 50, 170);

    // Sender Information
    let yPos = 210;
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Sender Information', 50, yPos);

    yPos += 25;
    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#333333')
      .text('WhatsApp Number:', 50, yPos)
      .text(data.whatsappNumber, 200, yPos);

    yPos += 20;
    doc
      .text('Amount Sent:', 50, yPos)
      .font('Helvetica-Bold')
      .text(`${this.formatCurrency(data.senderAmount, data.senderCurrency)}`, 200, yPos);

    yPos += 20;
    doc
      .font('Helvetica')
      .text('Fee:', 50, yPos)
      .text(`${this.formatCurrency(data.feeAmount, data.senderCurrency)}`, 200, yPos);

    yPos += 20;
    doc
      .font('Helvetica-Bold')
      .text('Total:', 50, yPos)
      .text(`${this.formatCurrency(data.totalAmount, data.senderCurrency)}`, 200, yPos);

    // Recipient Information
    yPos += 50;
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Recipient Information', 50, yPos);

    yPos += 25;
    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#333333')
      .text('Name:', 50, yPos)
      .text(data.recipientName, 200, yPos);

    yPos += 20;
    doc.text('Bank:', 50, yPos).text(data.recipientBank, 200, yPos);

    yPos += 20;
    doc.text('Account:', 50, yPos).text(data.recipientAccount, 200, yPos);

    yPos += 20;
    doc
      .text('Amount Received:', 50, yPos)
      .font('Helvetica-Bold')
      .fillColor('#2E7D32')
      .text(`${this.formatCurrency(data.recipientAmount, data.recipientCurrency)}`, 200, yPos);

    // Footer
    const footerY = 720;
    doc.moveTo(50, footerY).lineTo(545, footerY).stroke();
    doc
      .fontSize(9)
      .fillColor('#666666')
      .font('Helvetica')
      .text('TrustBridge - Powered by Base Sepolia', 50, footerY + 15, {
        align: 'center',
        width: 495
      });
  }
}
