import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import openBankingService from '@/services/openBanking';
import { generateSecureRandom } from '@/lib/encryption';
import { canPerformAction } from '@/lib/utils';
import { BankProvider } from '@/types';

const connectSchema = z.object({
  bankId: z.enum(['ANZ', 'ASB', 'BNZ', 'Westpac', 'Kiwibank']),
  permissions: z.array(z.string()).default(['account_info']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bankId, permissions } = connectSchema.parse(body);

    // Get user with subscription info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        openBankingConsent: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check subscription limits
    const currentConnections = user.openBankingConsent.filter(
      consent => consent.status === 'active'
    ).length;

    if (!canPerformAction(user.subscriptionTier as any, 'maxBankConnections', currentConnections)) {
      return NextResponse.json(
        { 
          error: 'Bank connection limit reached. Upgrade to Premium to connect more banks.',
          upgradeRequired: true 
        },
        { status: 403 }
      );
    }

    // Check if user already has consent for this bank
    const existingConsent = await prisma.openBankingConsent.findUnique({
      where: {
        userId_bankId: {
          userId: user.id,
          bankId,
        },
      },
    });

    if (existingConsent && existingConsent.status === 'active') {
      return NextResponse.json(
        { error: 'Bank already connected' },
        { status: 400 }
      );
    }

    // Generate state parameter for OAuth flow
    const state = generateSecureRandom(32);

    // Store state in session or database for verification
    // For now, we'll use a simple approach - in production, use Redis or database
    const authUrl = openBankingService.generateAuthUrl(
      bankId as BankProvider,
      state,
      permissions
    );

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'open_banking_connect_initiated',
        resource: 'bank_connection',
        details: {
          bankId,
          permissions,
          state,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      authUrl,
      state,
    });
  } catch (error) {
    console.error('Open Banking connect error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
