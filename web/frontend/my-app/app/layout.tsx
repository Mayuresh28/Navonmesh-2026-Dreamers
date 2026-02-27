import type { Metadata } from "next";
import { Inter, Cinzel, DM_Sans, Cormorant_Garamond, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "900"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const notoDevanagari = Noto_Serif_Devanagari({
  variable: "--font-noto-deva",
  subsets: ["devanagari"],
  weight: ["300", "400", "600"],
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
      <body className={`${inter.variable} ${cinzel.variable} ${dmSans.variable} ${cormorant.variable} ${notoDevanagari.variable} font-sans antialiased text-text-primary bg-background min-h-screen`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
