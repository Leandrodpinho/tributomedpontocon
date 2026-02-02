import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { ClerkProvider } from "@clerk/nextjs";

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
    <ClerkProvider
      appearance={{
        layout: {
          logoImageUrl: '/logo-full.png', // Logo local na pasta public
          logoPlacement: 'inside',
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'blockButton',
        },
        variables: {
          colorPrimary: '#3b82f6', // Blue from logo
          colorTextOnPrimaryBackground: 'white',
          colorBackground: '#0f172a', // Slate 900
          colorInputBackground: '#1e293b', // Slate 800
          colorInputText: 'white',
          colorText: 'white',
          colorTextSecondary: '#94a3b8',
        },
        elements: {
          card: "bg-slate-900 border border-slate-800 shadow-xl",
          headerTitle: "text-white",
          headerSubtitle: "text-slate-400",
          socialButtonsBlockButton: "bg-slate-800 border-slate-700 text-white hover:bg-slate-700",
          dividerLine: "bg-slate-800",
          dividerText: "text-slate-500",
          formFieldLabel: "text-slate-300",
          formFieldInput: "bg-slate-950 border-slate-800 text-white focus:border-blue-500 focus:ring-blue-500/20",
          footerActionLink: "text-blue-400 hover:text-blue-300",
          userButtonPopoverCard: "bg-slate-900 border border-slate-800",
          userButtonPopoverActionButton: "hover:bg-slate-800 text-slate-200",
          userButtonPopoverActionButtonIcon: "text-slate-400",
          userButtonPopoverFooter: "hidden",
        }
      }}
    >
      <html lang="pt" className={inter.variable}>
        <head>
        </head>
        <body
          className={cn(
            "font-sans antialiased min-h-screen bg-slate-50 transition-colors duration-300 overflow-x-hidden selection:bg-primary selection:text-white"
          )}
        >
          <AnimatedBackground />
          {/* Ambient Background - Light mode only */}
          <div className="fixed inset-0 -z-10 bg-mesh-light bg-cover bg-center opacity-40 mix-blend-multiply pointer-events-none" />
          <div className="fixed inset-0 -z-10 bg-gradient-to-tr from-brand-100/50 via-transparent to-brand-50/30 pointer-events-none blur-3xl" />

          <div className="relative flex flex-col min-h-screen">
            {children}
          </div>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

