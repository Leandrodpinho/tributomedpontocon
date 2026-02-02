"use client";

import { Stethoscope, Building2, ShoppingCart, Tractor, Briefcase, History } from "lucide-react";
import { ModuleCard } from "@/components/module-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function HubPage() {
  const modules = [
    {
      title: "Saúde & Clínicas",
      description: "Otimização tributária para médicos, dentistas e clínicas. Simulação completa de Simples, Presumido e Carnê Leão.",
      href: "/medico",
      icon: <Stethoscope className="h-6 w-6" />,
      colorClass: "text-cyan-400",
      gradientClass: "bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600"
    },
    {
      title: "Holding Patrimonial",
      description: "Estruturação e proteção de patrimônio imobiliário. Planejamento sucessório (ITCMD) e eficiência em aluguéis.",
      href: "/holding",
      icon: <Building2 className="h-6 w-6" />,
      colorClass: "text-amber-400",
      gradientClass: "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500"
    },
    {
      title: "Varejo & Postos",
      description: "Soluções fiscais para comércio varejista e revendedores de combustíveis (Monofásico).",
      href: "/varejo",
      icon: <ShoppingCart className="h-6 w-6" />,
      colorClass: "text-violet-400",
      gradientClass: "bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600"
    },
    {
      title: "Produtor Rural",
      description: "Planejamento tributário especializado para o agronegócio. Gestão de receitas, despesas e Livro Caixa Digital.",
      href: "/agro",
      icon: <Tractor className="h-6 w-6" />,
      colorClass: "text-emerald-400",
      gradientClass: "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600"
    },
    {
      title: "Serviços & Tech",
      description: "Inteligência tributária para TI, Advocacia e Engenharia. Análise de Fator R e Sociedade Uniprofissional (ISS Fixo).",
      href: "/servicos",
      icon: <Briefcase className="h-6 w-6" />,
      colorClass: "text-cyan-400",
      gradientClass: "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600"
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden font-sans">
      <AnimatedBackground />

      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />

      <header className="flex h-20 items-center justify-between px-6 md:px-12 border-b border-white/5 backdrop-blur-sm z-50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Planejador <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Tributário</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => window.location.href = '/reforma-tributaria'} className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden md:block">
            Reforma Tributária
          </button>
          <SignedIn>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/historico'}
              className="text-slate-300 hover:text-white gap-2"
            >
              <History className="h-4 w-4" />
              <span className="hidden md:inline">Histórico</span>
            </Button>
          </SignedIn>
          {/* Theme toggle removed - light mode only */}
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                }
              }}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                Entrar
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 md:py-24 max-w-6xl relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Qual módulo você deseja acessar?
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Selecione o perfil do seu cliente para iniciar uma simulação otimizada com as regras tributárias específicas de cada setor.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:gap-8">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>

        <footer className="mt-20 text-center text-sm text-slate-600">
          © {new Date().getFullYear()} Planejador Tributário. Sistema Inteligente de Apoio à Decisão.
        </footer>
      </main>
    </div>
  );
}
