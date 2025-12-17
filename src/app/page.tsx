"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Pencil } from "lucide-react";
import { getAnalysis, type AnalysisState } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/icons/logo";
import { DashboardResults } from "@/components/dashboard-results";
import { AnalysisForm } from "@/components/analysis-form";
import { Button } from "@/components/ui/button";

const initialState: AnalysisState = {
  aiResponse: null,
  transcribedText: null,
  irpfImpacts: null,
  webhookResponse: null,
  error: null,
  historyRecordId: null,
  historyError: null,
};

export default function Home() {
  const [state, setState] = useState<AnalysisState>(initialState);
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Erro na Análise",
        description: state.error,
      });
    }
    if (state.aiResponse && !state.error) {
      setShowForm(false);
    }
  }, [state, toast]);

  const handleFormSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const newState = await getAnalysis(state, formData);
      setState(newState);
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))] bg-app-gradient text-[hsl(var(--foreground))] transition-colors duration-300">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-white/20 bg-white/60 px-4 backdrop-blur-xl transition-all duration-300 md:px-10 dark:bg-slate-950/50 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="group flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white shadow-lg transition-transform group-hover:scale-105">
            <LogoIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Planejador <span className="text-primary">Tributário</span>
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Estratégia fiscal para a área da saúde
            </p>
          </div>
        </div>
        {!showForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowForm(true);
              setState(initialState); // Reseta estado ao voltar
            }}
            className="hidden md:flex"
          >
            <Pencil className="mr-2 h-4 w-4" /> Nova Simulação
          </Button>
        )}
      </header>

      <main className="mx-auto mt-8 flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 pb-12 md:px-8">
        {showForm ? (
          <>
            <div className="text-center space-y-2 mb-4">
              <h2 className="text-3xl font-bold tracking-tight">Comece seu Planejamento</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Preencha os dados essenciais abaixo. Nossa IA analisará automaticamente os cenários de Simples Nacional, Lucro Presumido (incluindo SUP e Hospitalar), Lucro Real e Carnê Leão.
              </p>
            </div>
            <AnalysisForm onSubmit={handleFormSubmit} isPending={pending} />

            {pending && !state.aiResponse && (
              <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="flex flex-col items-center space-y-4 p-8 rounded-xl bg-card border shadow-2xl animate-in fade-in zoom-in duration-300">
                  <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold">Gerando Planejamento...</h3>
                    <p className="text-sm text-muted-foreground">Calculando impostos e gerando relatórios.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="relative animate-in slide-in-from-bottom-4 duration-500">
            <DashboardResults
              analysis={state.aiResponse!}
              clientName={state.aiResponse?.scenarios?.[0]?.name.split(":")[0]?.replace("Cenário para ", "").trim() || "Cliente"}
              consultingFirm="Doctor.con"
              irpfImpacts={state.irpfImpacts}
              webhookResponse={state.webhookResponse}
              historyRecordId={state.historyRecordId}
              historyError={state.historyError}
              initialParameters={state.initialParameters}
            />
          </div>
        )}
      </main>
    </div>
  );
}
