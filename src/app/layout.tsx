import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CryptoBoard — Professional Trading Dashboard",
  description: "Real-time crypto trading signals with funding rates, open interest, and order book analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
