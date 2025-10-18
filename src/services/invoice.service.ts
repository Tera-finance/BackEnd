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

        // Header with gradient-like effect using colors
        doc
          .fontSize(32)
          .font('Helvetica-Bold')
          .fillColor('#6366F1')
          .text('TERA', 50, 45, { continued: true })
          .fillColor('#8B5CF6')
          .text(' FINANCE', { continued: false })
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#64748B')
          .text('Cross-Border Payment Receipt', 50, 85)
          .moveDown();

        // Draw decorative line with gradient effect
        doc
          .strokeColor('#6366F1')
          .lineWidth(2)
          .moveTo(50, 110)
          .lineTo(545, 110)
          .stroke()
          .strokeColor('#000000')
          .lineWidth(1);

        // Transfer Status Badge
        const statusColor = this.getStatusColor(data.status);
        const statusY = 125;
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor(statusColor)
          .text(`Status: ${data.status.toUpperCase()}`, 50, statusY);

        // Transfer ID and Date
        doc
          .fontSize(9)
          .fillColor('#333333')
          .font('Helvetica')
          .text(`Transfer ID: ${data.transferId}`, 50, statusY + 20)
          .text(`Date: ${this.formatDate(data.date)}`, 50, statusY + 33);

        // Section: Sender Information with background
        let yPos = statusY + 60;

        // Background box for sender section
        doc
          .roundedRect(45, yPos - 5, 240, 85, 5)
          .fillAndStroke('#F8FAFC', '#E2E8F0');

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1E293B')
          .text('Payment Details', 50, yPos);

        yPos += 18;
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#64748B')
          .text('WhatsApp Number', 50, yPos)
          .fontSize(9)
          .fillColor('#1E293B')
          .text(data.whatsappNumber, 50, yPos + 10, { width: 230 });

        yPos += 27;
        doc
          .fontSize(8)
          .fillColor('#64748B')
          .text('Amount Sent', 50, yPos)
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#0F172A')
          .text(`${this.formatCurrency(data.senderAmount, data.senderCurrency)}`, 50, yPos + 10, { width: 230 });

        yPos += 27;
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#64748B')
          .text('Service Fee (1.5%)', 50, yPos)
          .fontSize(9)
          .fillColor('#1E293B')
          .text(`${this.formatCurrency(data.feeAmount, data.senderCurrency)}`, 50, yPos + 10, { width: 230 });

        // Section: Recipient Information with background - Reset to same Y position as Payment Details
        const recipientStartY = statusY + 60;

        // Background box for recipient section
        doc
          .roundedRect(300, recipientStartY - 5, 245, 85, 5)
          .fillAndStroke('#F0FDF4', '#BBF7D0');

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1E293B')
          .text('Recipient Details', 305, recipientStartY);

        let recipientY = recipientStartY + 18;
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#64748B')
          .text('Recipient Name', 305, recipientY)
          .fontSize(9)
          .fillColor('#1E293B')
          .font('Helvetica-Bold')
          .text(data.recipientName, 305, recipientY + 10, { width: 235 });

        recipientY += 27;
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#64748B')
          .text('Bank', 305, recipientY)
          .fontSize(9)
          .fillColor('#1E293B')
          .text(data.recipientBank, 305, recipientY + 10, { width: 235 });

        recipientY += 27;
        doc
          .fontSize(8)
          .fillColor('#64748B')
          .text('Account Number', 305, recipientY)
          .fontSize(9)
          .fillColor('#1E293B')
          .text(data.recipientAccount, 305, recipientY + 10, { width: 235 });

        // Amount received - highlight box
        yPos = recipientStartY + 95;
        doc
          .roundedRect(45, yPos, 500, 35, 5)
          .fillAndStroke('#ECFDF5', '#10B981');

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#064E3B')
          .text('Amount Received', 55, yPos + 7)
          .fontSize(13)
          .font('Helvetica-Bold')
          .fillColor('#10B981')
          .text(`${this.formatCurrency(data.recipientAmount, data.recipientCurrency)}`, 55, yPos + 19);

        // Section: Exchange Rate Info
        yPos += 45;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1E293B')
          .text('Exchange Rate Information', 50, yPos);

        yPos += 18;
        const exchangeRate = typeof data.exchangeRate === 'string' ? parseFloat(data.exchangeRate) : data.exchangeRate;

        // Exchange rate box
        doc
          .roundedRect(45, yPos, 240, 38, 5)
          .fillAndStroke('#FEF3C7', '#F59E0B');

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#78350F')
          .text('Exchange Rate', 55, yPos + 7)
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#92400E')
          .text(`1 ${data.senderCurrency} = ${exchangeRate.toFixed(4)} ${data.recipientCurrency}`, 55, yPos + 21, { width: 220 });

        // Conversion path box
        doc
          .roundedRect(300, yPos, 245, 38, 5)
          .fillAndStroke('#E0E7FF', '#6366F1');

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#312E81')
          .text('Conversion Path', 310, yPos + 7)
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#4338CA')
          .text(`${data.senderCurrency} -> ${data.recipientCurrency}`, 310, yPos + 21, { width: 230 });

        // Section: Blockchain Information (if available)
        if (data.txHash) {
          yPos += 48;
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#1E293B')
            .text('Blockchain Transaction', 50, yPos);

          yPos += 16;
          // Blockchain info box
          doc
            .roundedRect(45, yPos, 500, 50, 5)
            .fillAndStroke('#DBEAFE', '#3B82F6');

          doc
            .fontSize(7)
            .font('Helvetica')
            .fillColor('#1E3A8A')
            .text('Transaction Hash', 55, yPos + 7)
            .fontSize(7)
            .fillColor('#1E40AF')
            .font('Courier')
            .text(data.txHash, 55, yPos + 18, { width: 480 });

          if (data.blockchainTxUrl) {
            doc
              .fontSize(8)
              .fillColor('#2563EB')
              .font('Helvetica')
              .text('View on Basescan Explorer', 55, yPos + 35, {
                link: data.blockchainTxUrl,
                underline: true
              });
          }
        }

        // Footer - Adjusted for better fit
        const footerY = 710;
        doc
          .moveTo(50, footerY)
          .lineTo(545, footerY)
          .stroke();

        doc
          .fontSize(10)
          .fillColor('#6366F1')
          .font('Helvetica-Bold')
          .text('TERA FINANCE', 50, footerY + 15, {
            align: 'center',
            width: 495
          })
          .fontSize(9)
          .fillColor('#64748B')
          .font('Helvetica')
          .text('Cross-Border Payment System', 50, footerY + 32, {
            align: 'center',
            width: 495
          })
          .text('Powered by Base Sepolia Blockchain', 50, footerY + 47, {
            align: 'center',
            width: 495
          })
          .fillColor('#6366F1')
          .text('For support: support@terafinance.com', 50, footerY + 62, {
            align: 'center',
            width: 495,
            link: 'mailto:support@terafinance.com',
            underline: true
          });

        // Thank you message with modern styling
        if (data.status === 'completed') {
          doc
            .fontSize(13)
            .fillColor('#10B981')
            .font('Helvetica-Bold')
            .text('✓ Transaction Successful', 50, footerY - 35, {
              align: 'center',
              width: 495
            })
            .fontSize(10)
            .fillColor('#64748B')
            .font('Helvetica')
            .text('Thank you for choosing Tera Finance', 50, footerY - 18, {
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
    // Header with gradient-like effect
    doc
      .fontSize(32)
      .font('Helvetica-Bold')
      .fillColor('#6366F1')
      .text('TERA', 50, 45, { continued: true })
      .fillColor('#8B5CF6')
      .text(' FINANCE', { continued: false })
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#64748B')
      .text('Cross-Border Payment Receipt', 50, 85);

    // Draw decorative line
    doc
      .strokeColor('#6366F1')
      .lineWidth(2)
      .moveTo(50, 110)
      .lineTo(545, 110)
      .stroke()
      .strokeColor('#000000')
      .lineWidth(1);

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
      .fontSize(10)
      .fillColor('#6366F1')
      .font('Helvetica-Bold')
      .text('TERA FINANCE', 50, footerY + 15, {
        align: 'center',
        width: 495
      })
      .fontSize(9)
      .fillColor('#64748B')
      .font('Helvetica')
      .text('Powered by Base Sepolia Blockchain', 50, footerY + 32, {
        align: 'center',
        width: 495
      });
  }
}
