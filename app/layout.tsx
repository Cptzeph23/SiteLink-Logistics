import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SiteLink Logistics — Nairobi Construction Transport',
  description: 'Connect with verified LCV drivers for construction material delivery across Nairobi.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}