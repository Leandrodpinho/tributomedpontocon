import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Planejador Tributário",
  description: "Planejamento Tributário Inteligente para Médicos e Clínicas",
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
      <body
        className={cn(
          "font-sans antialiased min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-x-hidden selection:bg-primary selection:text-white"
        )}
        suppressHydrationWarning
      >
        {/* Ambient Background */}
        <div className="fixed inset-0 -z-10 bg-mesh-light dark:bg-slate-950 bg-cover bg-center opacity-40 mix-blend-multiply dark:opacity-20 pointer-events-none" />
        <div className="fixed inset-0 -z-10 bg-gradient-to-tr from-brand-100/50 via-transparent to-brand-50/30 dark:from-brand-900/10 dark:to-slate-900/50 pointer-events-none blur-3xl" />

        <div className="relative flex flex-col min-h-screen">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
