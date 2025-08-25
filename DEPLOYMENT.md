# Deployment Guide

This guide covers how to deploy FinanceNZ to production environments.

## Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Stripe account
- Open Banking NZ API credentials
- Domain name (optional but recommended)

## Environment Setup

### 1. Production Environment Variables

Create a `.env.production` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# NextAuth.js
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"

# Stripe
STRIPE_SECRET_KEY="sk_live_your_live_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Open Banking NZ
OPEN_BANKING_CLIENT_ID="your-production-client-id"
OPEN_BANKING_CLIENT_SECRET="your-production-client-secret"
OPEN_BANKING_REDIRECT_URI="https://your-domain.com/api/auth/open-banking/callback"
OPEN_BANKING_PRODUCTION_URL="https://api.paymentsnz.co.nz"

# Security
JWT_SECRET="your-production-jwt-secret"
ENCRYPTION_KEY="your-32-character-production-key"

# Application
NODE_ENV="production"
APP_URL="https://your-domain.com"
```

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

#### Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

#### Configuration

1. **Environment Variables**: Add all production environment variables in the Vercel dashboard
2. **Domain**: Configure your custom domain in the Vercel dashboard
3. **Build Settings**: Vercel automatically detects Next.js projects

#### Database Setup

1. **Supabase**: Create a production project in Supabase
2. **Migrations**: Run database migrations:
   ```bash
   npm run db:migrate
   ```

### Option 2: Railway

Railway provides easy deployment with built-in PostgreSQL.

#### Setup

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Add PostgreSQL**
   ```bash
   railway add postgresql
   ```

5. **Deploy**
   ```bash
   railway up
   ```

### Option 3: Docker

Use Docker for containerized deployment.

#### Build Docker Image

```bash
docker build -t financenz .
```

#### Run Container

```bash
docker run -p 3000:3000 --env-file .env.production financenz
```

#### Docker Compose

```bash
docker-compose up -d
```

### Option 4: Traditional VPS

Deploy to a VPS using PM2 for process management.

#### Setup

1. **Install dependencies**
   ```bash
   npm install
   npm run build
   ```

2. **Install PM2**
   ```bash
   npm install -g pm2
   ```

3. **Start application**
   ```bash
   pm2 start npm --name "financenz" -- start
   ```

4. **Setup reverse proxy** (Nginx example)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Post-Deployment Setup

### 1. Database Migrations

Run database migrations in production:

```bash
npm run db:migrate
```

### 2. Stripe Webhooks

Configure Stripe webhooks to point to your production URL:

- Endpoint URL: `https://your-domain.com/api/stripe/webhook`
- Events to send:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 3. Open Banking NZ Setup

1. **Register your application** with Open Banking NZ
2. **Configure redirect URIs** to point to your production domain
3. **Update API credentials** in your environment variables

### 4. SSL Certificate

Ensure your domain has a valid SSL certificate. Most hosting providers (Vercel, Railway) handle this automatically.

### 5. Domain Configuration

1. **DNS Setup**: Point your domain to your hosting provider
2. **Custom Domain**: Configure custom domain in your hosting dashboard
3. **Redirects**: Set up www to non-www redirects if needed

## Monitoring and Maintenance

### 1. Error Monitoring

Consider integrating error monitoring services:

- Sentry
- LogRocket
- Bugsnag

### 2. Performance Monitoring

Monitor application performance:

- Vercel Analytics
- Google Analytics
- New Relic

### 3. Database Monitoring

Monitor database performance and usage:

- Supabase Dashboard
- Database connection pooling
- Query optimization

### 4. Security

- Regular security updates
- Environment variable rotation
- Access log monitoring
- Rate limiting monitoring

## Backup Strategy

### 1. Database Backups

- **Supabase**: Automatic backups included
- **Self-hosted**: Set up automated PostgreSQL backups

### 2. Code Backups

- Git repository (GitHub, GitLab)
- Regular commits and tags
- Branch protection rules

### 3. Environment Variables

- Secure storage of environment variables
- Regular rotation of secrets
- Backup of configuration

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check database server status
   - Verify network connectivity

3. **Authentication Issues**
   - Check NEXTAUTH_SECRET is set
   - Verify NEXTAUTH_URL matches your domain
   - Check OAuth provider configuration

4. **Stripe Integration Issues**
   - Verify webhook endpoint is accessible
   - Check webhook secret matches
   - Verify API keys are for the correct environment

### Logs

Check application logs for errors:

- **Vercel**: View logs in Vercel dashboard
- **Railway**: Use `railway logs`
- **Docker**: Use `docker logs container-name`
- **PM2**: Use `pm2 logs`

## Scaling

### Horizontal Scaling

- Use load balancers
- Deploy multiple instances
- Database connection pooling

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Implement caching strategies

### CDN

Use a CDN for static assets:

- Vercel Edge Network (automatic)
- Cloudflare
- AWS CloudFront

---

For additional support, please refer to the main README.md or create an issue in the repository.
