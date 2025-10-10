import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tributo Med.con",
  description: "Planejamento Tributário para médicos",
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={inter.variable} suppressHydrationWarning>
      <head>
      </head>
      <body className={cn("font-sans antialiased bg-background text-foreground transition-colors duration-300")}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
