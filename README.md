"# FinanceNZ - Personal Finance Management Platform

A secure, modern personal finance management application built specifically for New Zealand, featuring Open Banking NZ API integration, intelligent spending tracking, and premium subscription features.

## 🚀 Features

### Core Features
- **Open Banking NZ Integration**: Connect to ANZ, ASB, BNZ, Westpac, and Kiwibank
- **Real-time Account Sync**: Automatic transaction and balance updates
- **Smart Categorization**: AI-powered transaction categorization
- **Budget Management**: Set budgets, track goals, and receive alerts
- **Financial Insights**: Detailed spending analytics and trends
- **Secure Data Storage**: Bank-level encryption and security

### Subscription Tiers
- **Free Tier**: 1 bank connection, basic tracking, 3 budget categories
- **Premium Tier ($4.99 NZD/month)**: 5 bank connections, advanced analytics, unlimited budgets, data export

## 🏗️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - High-quality component library
- **React Hook Form** - Form management
- **Recharts** - Data visualization

### Backend
- **Supabase** - Complete backend solution with PostgreSQL, authentication, real-time features, and Row Level Security
- **Node.js** - Runtime environment for API routes

### Security & Compliance
- **OAuth 2.0** - Open Banking authentication
- **AES-256-GCM** - Data encryption
- **JWT** - Secure token management
- **Rate Limiting** - API protection
- **Audit Logging** - Compliance tracking

### Payment Processing
- **Stripe** - Subscription management
- **Webhooks** - Real-time payment events

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- Supabase account (includes PostgreSQL database)
- Stripe account
- Open Banking NZ API credentials

### 1. Clone the Repository
```bash
git clone <repository-url>
cd open_banking_v2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file and configure your variables:
```bash
cp .env.example .env.local
```

Configure the following environment variables:

#### Database
```env
DATABASE_URL="postgresql://username:password@localhost:5432/financenz"
```

#### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

#### Authentication
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"
```

#### Stripe
```env
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

#### Open Banking NZ
```env
OPEN_BANKING_CLIENT_ID="your-client-id"
OPEN_BANKING_CLIENT_SECRET="your-client-secret"
OPEN_BANKING_REDIRECT_URI="http://localhost:3000/api/auth/open-banking/callback"
OPEN_BANKING_SANDBOX_URL="https://sandbox.api.paymentsnz.co.nz"
```

#### Security
```env
JWT_SECRET="your-jwt-secret-key"
ENCRYPTION_KEY="your-32-character-encryption-key"
```

### 4. Database Setup

#### Option 1: Use Supabase Cloud (Recommended)
1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to `.env.local`
3. Run the database migration:
```bash
supabase db push
```

#### Option 2: Local Development
```bash
# Start local Supabase (requires Docker)
npm run supabase:start

# Push database schema
supabase db push
```

### 5. Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🚀 Deployment

### Vercel (Recommended for Frontend)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Railway/Render (Backend API)
1. Create a new service
2. Connect your repository
3. Configure environment variables
4. Deploy

### Database (Supabase)
1. Create a new Supabase project
2. Configure Row Level Security policies
3. Set up database schema using Prisma migrations

## 🔒 Security Features

### Data Protection
- **Encryption at Rest**: All sensitive data encrypted using AES-256-GCM
- **Encryption in Transit**: HTTPS everywhere with proper certificate management
- **Token Security**: JWT tokens with secure storage and rotation
- **Account Number Masking**: Display only last 4 digits

### Compliance
- **Open Banking NZ Standards**: Full compliance with v2.3 specifications
- **Audit Logging**: Complete audit trail for all user actions
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **GDPR Ready**: Data export and deletion capabilities

### Authentication
- **OAuth 2.0**: Secure Open Banking authentication flow
- **Multi-factor Ready**: Extensible authentication system
- **Session Management**: Secure session handling with NextAuth.js

## 📊 Open Banking Integration

### Supported Banks
- ANZ Bank New Zealand
- ASB Bank
- Bank of New Zealand (BNZ)
- Westpac New Zealand
- Kiwibank

### API Standards
- **Account Information API v2.3**: Real-time account and transaction data
- **Payment Initiation API v2.3**: Future payment capabilities
- **Security Profile v2.1**: OAuth 2.0 with PKCE

### Data Sync
- **Real-time Updates**: Automatic transaction synchronization
- **Error Handling**: Robust error handling and retry mechanisms
- **Token Management**: Automatic token refresh and renewal

## 💳 Subscription Management

### Stripe Integration
- **Secure Payments**: PCI-compliant payment processing
- **Webhook Handling**: Real-time subscription status updates
- **Customer Portal**: Self-service subscription management
- **Proration**: Automatic billing adjustments

### Pricing
- **Free Tier**: $0/month - 1 bank, basic features
- **Premium Tier**: $4.99 NZD/month - 5 banks, advanced features

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage
- Authentication flows
- Open Banking integration
- Stripe webhook handling
- Data encryption/decryption
- API endpoints

## 📈 Monitoring & Analytics

### Application Monitoring
- Error tracking with detailed logging
- Performance monitoring
- User analytics (privacy-compliant)
- Financial data insights

### Security Monitoring
- Failed authentication attempts
- Unusual access patterns
- API rate limit violations
- Data access audit trails

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@financenz.co.nz or create an issue in this repository.

## 🔗 Links

- [Open Banking NZ API Centre](https://www.apicentre.paymentsnz.co.nz/)
- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

Built with ❤️ for New Zealand's financial future."
