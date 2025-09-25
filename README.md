# TrustBridge Backend

A comprehensive cryptocurrency remittance system backend built with Express.js, TypeScript, and Supabase. TrustBridge enables Indonesian workers to send money home using WhatsApp and cryptocurrency.

## 🏗️ Architecture

The backend follows a layered architecture pattern:

- **Presentation Layer**: REST API routes and WhatsApp webhook handlers
- **Business Logic Layer**: Services for blockchain interaction, KYC verification, and transaction management
- **Data Access Layer**: Supabase PostgreSQL database
- **External Integrations**: WhatsApp Business API, IPFS, Blockchain networks

## 🚀 Features

- **WhatsApp Integration**: Regex-based command processing for money transfers via WhatsApp
- **KYC Verification**: Document upload and verification with IPFS storage
- **Blockchain Integration**: Polygon network for USDC transfers
- **Exchange Rate Integration**: Real-time rates from exchange APIs
- **Secure Authentication**: JWT-based auth with Redis session management
- **Rate Limiting**: Protection against abuse and spam
- **File Upload**: Secure document handling with encryption

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Redis server (optional for production)

## ⚙️ Environment Setup

1. **Generate JWT Secrets:**
```bash
# Generate JWT secret (64 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT refresh secret (64 characters) 
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate encryption key (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

2. **Configure your environment variables:**
```env
# Supabase Configuration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-from-supabase-dashboard"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-from-supabase-dashboard"

# Database Connection (for direct SQL queries if needed)
DATABASE_URL="postgresql://postgres:password@host:5432/database"

# JWT Secrets (GENERATE THESE!)
JWT_SECRET="your-generated-64-character-secret"
JWT_REFRESH_SECRET="your-other-generated-64-character-secret"

# Encryption
ENCRYPTION_KEY="your-generated-32-character-key"

# Optional - External Services
REDIS_URL="redis://localhost:6379"
OPENAI_API_KEY="your-openai-api-key"
WHATSAPP_ACCESS_TOKEN="your-whatsapp-access-token"
WHATSAPP_VERIFY_TOKEN="your-webhook-verify-token"
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
POLYGON_RPC_URL="https://polygon-mainnet.infura.io/v3/your-api-key"
PRIVATE_KEY="your-wallet-private-key"

# Server Configuration
PORT=3000
NODE_ENV="development"
```

## 🛠️ Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Setup database tables in Supabase:**
   - Go to your Supabase project dashboard
   - Click on **SQL Editor**
   - Copy and paste the SQL from `sql/schema.sql`
   - Run the query to create tables

3. **Initialize database (if you have network access):**
```bash
npm run db:init
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

The server will start on `http://localhost:3000`

## 📡 API Contract

### Base URL
```
http://localhost:3000
```

### Authentication Endpoints

#### 1. Login/Register User
```http
POST /api/auth/login
Content-Type: application/json

{
  "whatsappNumber": "+628123456789",
  "countryCode": "ID"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "whatsappNumber": "+628123456789", 
    "status": "PENDING_KYC"
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### 2. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "tokens": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

#### 3. Logout
```http
POST /api/auth/logout
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

#### 4. Get Current User
```http
GET /api/auth/me
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "whatsapp_number": "+628123456789",
    "country_code": "ID", 
    "status": "VERIFIED",
    "kyc_nft_token_id": "token_id",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### KYC Endpoints

#### 1. Submit KYC Documents
```http
POST /api/kyc/submit
Authorization: Bearer jwt_token
Content-Type: multipart/form-data

documentType: E_KTP | PASSPORT
documentNumber: string
fullName: string  
dateOfBirth: YYYY-MM-DD
address: string
documentFile: file (image, max 10MB)
```

**Response (200):**
```json
{
  "message": "KYC submitted successfully",
  "kycId": "uuid",
  "status": "PENDING"
}
```

#### 2. Get KYC Status
```http
GET /api/kyc/status
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "status": "PENDING" | "VERIFIED" | "REJECTED",
  "submittedAt": "2024-01-01T00:00:00Z",
  "verifiedAt": "2024-01-01T00:00:00Z",
  "documentType": "E_KTP"
}
```

**Response (200) - No KYC:**
```json
{
  "status": "not_submitted",
  "message": "No KYC submission found"
}
```

#### 3. Verify KYC (Admin)
```http
POST /api/kyc/verify/:kycId
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "message": "KYC verification processed successfully"
}
```

### WhatsApp Integration

#### 1. Webhook Verification (GET)
```http
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=challenge_string&hub.verify_token=verify_token
```

**Response (200):**
```
challenge_string
```

#### 2. Webhook Message Handler (POST)
```http
POST /api/whatsapp/webhook
Content-Type: application/json

{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "entry_id",
    "changes": [{
      "value": {
        "messages": [{
          "from": "628123456789",
          "id": "message_id",
          "timestamp": "1234567890",
          "text": {
            "body": "balance"
          }
        }]
      }
    }]
  }]
}
```

### WhatsApp Commands (Regex-based)

The system processes WhatsApp messages using regex patterns instead of AI:

#### Balance Commands
- Pattern: `/\b(balance|saldo|dana)\b/i`
- Examples: "balance", "saldo", "dana saya"

#### Transfer Commands  
- Pattern: `/\b(kirim|transfer|send)\s+(\d+(?:\.\d+)?)\s*(usdc|usdt)?\s*(?:ke|to)?\s*(\+?[\d\s\-\(\)]+)/i`
- Examples: 
  - "kirim 100 USDC ke +628123456789"
  - "transfer 50 ke 08123456789"
  - "send 25.5 USDC to +628123456789"

#### Rate Commands
- Pattern: `/\b(rate|kurs|harga)\s*(usdc|usdt)?\s*(?:ke|to)?\s*(idr|rupiah)?\b/i`
- Examples: "rate USDC", "kurs", "harga USDC ke IDR"

#### History Commands
- Pattern: `/\b(history|riwayat|transaksi)\b/i`
- Examples: "history", "riwayat", "riwayat transaksi"

#### KYC Commands
- Pattern: `/\b(kyc|verifikasi|verify)\b/i`
- Examples: "KYC", "verifikasi", "verify"

#### Help Commands
- Pattern: `/\b(help|bantuan|panduan)\b/i`
- Examples: "help", "bantuan", "panduan"

## 🔒 Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer your_jwt_token
```

## 📊 Error Responses

**400 Bad Request:**
```json
{
  "error": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "error": "Access token required"
}
```

**403 Forbidden:**
```json
{
  "error": "KYC verification required"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## 🗃️ Database Schema

The database includes the following main entities:

- **users**: WhatsApp-based user accounts with KYC status
- **kyc_data**: Document storage with IPFS hashes
- **wallets**: Blockchain wallet management  
- **transactions**: Transaction lifecycle tracking

## 🔧 Rate Limiting

- API endpoints: 100 requests per 15 minutes
- WhatsApp webhook: 10 messages per minute
- KYC submissions: 3 submissions per day

## 🚀 Deployment

### Vercel Deployment
```bash
npm run build
vercel --prod
```

### Environment Variables (Production)
Ensure all environment variables are configured in your deployment platform.

## 🔍 Health Check

```http
GET /
```

**Response (200):**
```json
{
  "message": "TrustBridge Backend API",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.