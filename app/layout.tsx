import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SiteLink Logistics - Linking materials to sites",
  description: "Professional construction logistics platform for transporting heavy materials using 1.5-2 tonne vehicles in Kenya.",
  keywords: ["construction logistics", "material transport", "Kenya", "building materials", "cement delivery", "steel delivery"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}