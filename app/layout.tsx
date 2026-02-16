import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SiteLink Logistics — Nairobi Construction Transport',
  description: 'Connect with verified LCV drivers for construction material delivery across Nairobi.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}