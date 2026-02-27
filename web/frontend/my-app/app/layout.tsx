import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "धन्वंतरी - Preventive Health Monitoring",
  description: "Advanced preventive health monitoring and early risk detection framework",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased text-text-primary bg-background min-h-screen`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
