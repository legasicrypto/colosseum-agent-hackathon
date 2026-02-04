import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/providers/WalletProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Legasi - Credit Infrastructure for Digital Assets",
  description: "Borrow against your crypto with Gradual Auto-Deleverage (GAD) protection. No liquidation cliff. Built on Solana.",
  keywords: ["DeFi", "Lending", "Solana", "Crypto", "Credit", "GAD"],
  openGraph: {
    title: "Legasi - Credit Infrastructure for Digital Assets",
    description: "Borrow against your crypto with GAD protection",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Legasi",
    description: "Credit Infrastructure for Digital Assets",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-black text-white min-h-screen`}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
