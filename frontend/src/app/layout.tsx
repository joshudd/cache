import type { Metadata } from "next";
import { Sofia_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import TransitionContainer from "@/components/transition/transition-container";

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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sofia.variable}`}>
        <TransitionContainer>{children}</TransitionContainer>
        <Toaster />
      </body>
    </html>
  );
}
