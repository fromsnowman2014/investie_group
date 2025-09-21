import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StockProvider } from "./components/StockProvider";
import SWRProvider from "./components/SWRProvider";
import ApiUsageDebugger from "@/components/ApiUsageDebugger";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Investie - AI-Powered Investment Analysis",
  description: "Real-time stock analysis with AI-powered insights and TradingView integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SWRProvider>
          <StockProvider>
            {children}
            <ApiUsageDebugger />
          </StockProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
