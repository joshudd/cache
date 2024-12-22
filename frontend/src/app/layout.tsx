import type { Metadata } from "next";
import { Sofia_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/navbar";
import { Toaster } from "@/components/ui/toaster";

const sofia = Sofia_Sans({
  variable: "--font-sofia",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "cache",
  description: "music += interest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sofia.variable} antialiased`}>
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
