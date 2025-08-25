import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PocketSmith Competitor - Personal Finance Management',
  description: 'Secure personal finance management with Open Banking NZ integration',
  keywords: ['personal finance', 'budgeting', 'open banking', 'new zealand'],
  authors: [{ name: 'PocketSmith Competitor Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'PocketSmith Competitor - Personal Finance Management',
    description: 'Secure personal finance management with Open Banking NZ integration',
    type: 'website',
    locale: 'en_NZ',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
