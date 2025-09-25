# TrustBridge Backend

A comprehensive cryptocurrency remittance system backend built with Express.js, TypeScript, and modern blockchain technology. TrustBridge enables Indonesian workers to send money home using WhatsApp and cryptocurrency.

## 🏗️ Architecture

The backend follows a layered architecture pattern:

- **Presentation Layer**: REST API routes and WhatsApp webhook handlers
- **Business Logic Layer**: Services for AI processing, blockchain interaction, KYC verification, and transaction management
- **Data Access Layer**: Prisma ORM with PostgreSQL database
- **External Integrations**: OpenAI, WhatsApp Business API, IPFS, Indodax API

## 🚀 Features

- **WhatsApp Integration**: Natural language processing for money transfers via WhatsApp
- **KYC Verification**: Document upload and verification with IPFS storage
- **Blockchain Integration**: Polygon network for USDC transfers
- **AI-Powered**: OpenAI GPT-4 for intent classification and response generation
- **Exchange Rate Integration**: Real-time rates from Indodax API
- **Secure Authentication**: JWT-based auth with Redis session management
- **Rate Limiting**: Protection against abuse and spam
- **File Upload**: Secure document handling with encryption

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis server
- IPFS node (optional, can use remote)

## ⚙️ Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure your environment variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/trustbridge"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Blockchain (Polygon)
POLYGON_RPC_URL="https://polygon-mainnet.infura.io/v3/your-api-key"
PRIVATE_KEY="your-wallet-private-key"

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN="your-whatsapp-access-token"
WHATSAPP_VERIFY_TOKEN="your-webhook-verify-token"
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key"
```

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Generate Prisma client:
```bash
npm run prisma:generate
```

3. Run database migrations:
```bash
npm run prisma:migrate
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Database Operations
```bash
# Generate Prisma client
npm run prisma:generate

# Create and run migration
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:deploy

# Open Prisma Studio
npm run prisma:studio
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login or register with WhatsApp number
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### KYC Verification
- `POST /api/kyc/submit` - Submit KYC documents
- `GET /api/kyc/status` - Check KYC status
- `GET /api/kyc/pending` - Get pending KYC submissions (admin)
- `POST /api/kyc/verify/:kycId` - Approve/reject KYC (admin)

### Transactions
- `POST /api/transactions/create` - Create new transaction
- `POST /api/transactions/process/:transactionId` - Process transaction
- `GET /api/transactions/quote` - Get transfer quote
- `GET /api/transactions/history` - User transaction history
- `GET /api/transactions/:transactionId` - Get specific transaction
- `POST /api/transactions/:transactionId/cancel` - Cancel transaction

### WhatsApp Integration
- `GET /api/whatsapp/webhook` - Webhook verification
- `POST /api/whatsapp/webhook` - Webhook message handler
- `POST /api/whatsapp/send` - Send message (admin)

### Exchange Rates
- `GET /api/transactions/rates/current` - Get current exchange rate
- `GET /api/transactions/rates/supported` - Get supported currencies

## 💬 WhatsApp Commands

Users can interact with the system through WhatsApp using natural language:

- **Transfer Money**: "Kirim 100 USDC ke +628123456789"
- **Check Balance**: "Saldo" or "Balance"
- **Exchange Rate**: "Kurs USDC ke IDR" or "Current rate"
- **Transaction History**: "Riwayat" or "History"
- **KYC Help**: "KYC" or "Verifikasi"
- **General Help**: "Bantuan" or "Help"

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API and WhatsApp message rate limiting
- **File Validation**: Image-only uploads with size limits
- **Encryption**: Sensitive data encryption at rest
- **Input Validation**: Request validation and sanitization
- **CORS**: Cross-origin request protection
- **Helmet**: Security headers

## 🗃️ Database Schema

The database includes the following main entities:

- **Users**: WhatsApp-based user accounts with KYC status
- **KYC Data**: Encrypted document storage with IPFS hashes
- **Wallets**: Encrypted blockchain wallet management
- **Transactions**: Complete transaction lifecycle tracking

## 🔧 Configuration

### Rate Limiting
- API: 100 requests per 15 minutes
- WhatsApp: 10 messages per minute
- KYC: 3 submissions per day

### File Uploads
- Max size: 10MB
- Allowed types: Images only (JPG, PNG, etc.)
- Storage: IPFS with AES encryption

### Blockchain
- Network: Polygon
- Tokens: USDC, USDT support
- Auto-wallet generation for new users

## 🚀 Deployment

### Vercel Deployment
The project is configured for Vercel deployment with the included `vercel.json`:

```bash
npm run build
vercel --prod
```

### Environment Variables (Production)
Ensure all environment variables are set in your production environment, especially:
- Database connection strings
- API keys and secrets
- Blockchain configuration
- WhatsApp webhook settings

## 🔍 Monitoring & Debugging

- **Health Check**: `GET /` returns system status
- **Database Logs**: Prisma query logging in development
- **Error Handling**: Comprehensive error responses
- **Request Logging**: All API requests logged

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure code quality
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Check the API documentation
- Review the WhatsApp command examples
- Ensure all environment variables are configured
- Check logs for detailed error information
