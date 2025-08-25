import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import openBankingService from '@/services/openBanking';
import { encryptAccessToken } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Open Banking OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/app/settings/banks?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/app/settings/banks?error=missing_parameters', request.url)
      );
    }

    // TODO: Verify state parameter (should be stored in session/database)
    // For now, we'll skip state verification for simplicity

    try {
      // Exchange code for tokens
      const tokenResponse = await openBankingService.exchangeCodeForToken(code, state);

      // Get user accounts to determine bank
      const accounts = await openBankingService.getAccounts(tokenResponse.accessToken);
      
      // For demo purposes, we'll assume the bank ID from the first account
      // In production, this should be passed through the state parameter
      const bankId = 'ANZ'; // This should come from the OAuth flow

      // Encrypt tokens before storing
      const encryptedAccessToken = encryptAccessToken(tokenResponse.accessToken);
      const encryptedRefreshToken = tokenResponse.refreshToken 
        ? encryptAccessToken(tokenResponse.refreshToken)
        : null;

      // Store or update consent
      const consent = await prisma.openBankingConsent.upsert({
        where: {
          userId_bankId: {
            userId: session.user.id,
            bankId,
          },
        },
        update: {
          consentId: tokenResponse.consentId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: new Date(Date.now() + tokenResponse.expiresIn * 1000),
          permissions: ['account_info'], // This should come from the OAuth flow
          status: 'active',
          updatedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          bankId,
          consentId: tokenResponse.consentId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: new Date(Date.now() + tokenResponse.expiresIn * 1000),
          permissions: ['account_info'],
          status: 'active',
        },
      });

      // Store accounts
      for (const account of accounts) {
        await prisma.account.upsert({
          where: {
            userId_bankAccountId: {
              userId: session.user.id,
              bankAccountId: account.accountId,
            },
          },
          update: {
            accountName: account.accountName,
            currentBalance: account.currentBalance,
            availableBalance: account.availableBalance || account.currentBalance,
            lastSyncAt: new Date(),
            isActive: true,
          },
          create: {
            userId: session.user.id,
            bankAccountId: account.accountId,
            bankId,
            accountType: account.accountType,
            accountName: account.accountName,
            accountNumber: account.accountNumber, // This should be encrypted
            currentBalance: account.currentBalance,
            availableBalance: account.availableBalance || account.currentBalance,
            currency: account.currency,
            lastSyncAt: new Date(),
            isActive: true,
          },
        });
      }

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'open_banking_connected',
          resource: 'bank_connection',
          resourceId: consent.id,
          details: {
            bankId,
            consentId: tokenResponse.consentId,
            accountCount: accounts.length,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      return NextResponse.redirect(
        new URL('/app/settings/banks?success=connected', request.url)
      );
    } catch (error) {
      console.error('Token exchange error:', error);
      return NextResponse.redirect(
        new URL('/app/settings/banks?error=token_exchange_failed', request.url)
      );
    }
  } catch (error) {
    console.error('Open Banking callback error:', error);
    return NextResponse.redirect(
      new URL('/app/settings/banks?error=callback_error', request.url)
    );
  }
}
