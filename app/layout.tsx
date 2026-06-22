import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Predictor Pro | AI Football Predictions',
    template: '%s | Predictor Pro',
  },
  description: 'Get accurate football match predictions powered by AI, Elo ratings, and Poisson distribution. Compare odds, view live scores, and make informed betting decisions.',
  keywords: ['football predictions', 'AI predictions', 'betting odds', 'match analysis', 'sports betting'],
  authors: [{ name: 'Predictor Pro' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://predictor-pro.com',
    siteName: 'Predictor Pro',
    title: 'Predictor Pro | AI Football Predictions',
    description: 'Get accurate football match predictions powered by AI, Elo ratings, and Poisson distribution.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Predictor Pro | AI Football Predictions',
    description: 'Get accurate football match predictions powered by AI.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <QueryProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
