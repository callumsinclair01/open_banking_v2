import axios, { AxiosInstance } from 'axios';
import { OpenBankingAccount, OpenBankingTransaction, BankProvider } from '@/types';

interface OpenBankingConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string;
}

export class OpenBankingService {
  private client: AxiosInstance;
  private config: OpenBankingConfig;

  constructor(config: OpenBankingConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      // Add client credentials or access token here
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Open Banking API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Generate authorization URL for Open Banking consent
   */
  generateAuthUrl(bankId: BankProvider, state: string, permissions: string[]): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: permissions.join(' '),
      state: state,
      bank_id: bankId,
    });

    return `${this.config.baseUrl}/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    consentId: string;
  }> {
    try {
      const response = await this.client.post('/oauth2/token', {
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        redirect_uri: this.config.redirectUri,
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        consentId: response.data.consent_id,
      };
    } catch (error) {
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await this.client.post('/oauth2/token', {
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get accounts for the authenticated user
   */
  async getAccounts(accessToken: string): Promise<OpenBankingAccount[]> {
    try {
      const response = await this.client.get('/v2.3/accounts', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data.data.map((account: any) => ({
        accountId: account.accountId,
        accountType: account.accountType,
        accountName: account.displayName || account.nickname,
        accountNumber: account.accountNumber,
        currentBalance: parseFloat(account.balance.current.amount),
        availableBalance: account.balance.available ? parseFloat(account.balance.available.amount) : undefined,
        currency: account.balance.current.currency,
      }));
    } catch (error) {
      throw new Error('Failed to fetch accounts');
    }
  }

  /**
   * Get transactions for a specific account
   */
  async getTransactions(
    accessToken: string,
    accountId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<OpenBankingTransaction[]> {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from-booking-date-time', fromDate);
      if (toDate) params.append('to-booking-date-time', toDate);

      const response = await this.client.get(
        `/v2.3/accounts/${accountId}/transactions?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.data.map((transaction: any) => ({
        transactionId: transaction.transactionId,
        accountId: accountId,
        amount: Math.abs(parseFloat(transaction.amount.amount)),
        currency: transaction.amount.currency,
        description: transaction.remittanceInformation?.unstructured || transaction.reference,
        reference: transaction.reference,
        transactionDate: transaction.bookingDate,
        valueDate: transaction.valueDate,
        type: parseFloat(transaction.amount.amount) < 0 ? 'debit' : 'credit',
        status: transaction.status || 'completed',
        merchantName: transaction.merchantName,
        merchantCategory: transaction.merchantCategoryCode,
      }));
    } catch (error) {
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Revoke consent
   */
  async revokeConsent(accessToken: string, consentId: string): Promise<void> {
    try {
      await this.client.delete(`/v2.3/consents/${consentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      throw new Error('Failed to revoke consent');
    }
  }
}

// Create singleton instance
const openBankingService = new OpenBankingService({
  clientId: process.env.OPEN_BANKING_CLIENT_ID!,
  clientSecret: process.env.OPEN_BANKING_CLIENT_SECRET!,
  redirectUri: process.env.OPEN_BANKING_REDIRECT_URI!,
  baseUrl: process.env.NODE_ENV === 'production' 
    ? process.env.OPEN_BANKING_PRODUCTION_URL!
    : process.env.OPEN_BANKING_SANDBOX_URL!,
});

export default openBankingService;
