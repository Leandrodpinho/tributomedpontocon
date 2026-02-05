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

export default function MedicalPage() {
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

    // Efeito para restaurar estado anterior (Persistência)
    useEffect(() => {
        const saved = sessionStorage.getItem('last_tax_analysis');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Verifica se o timestamp é recente (ex: menor que 24h) para não carregar lixo muito antigo
                if (Date.now() - parsed.timestamp < 1000 * 60 * 60 * 24) {
                    setState(prev => ({
                        ...prev,
                        aiResponse: parsed.analysis,
                        // Podes restaurar outros campos se salvos, mas o principal é o aiResponse
                    }));
                    setShowForm(false);
                    toast({
                        title: "Análise Restaurada",
                        description: "Recuperamos sua última simulação.",
                    });
                }
            } catch (e) {
                console.error("Erro ao restaurar análise", e);
            }
        }
    }, [toast]); // Executa apenas uma vez no mount

    const handleFormSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const newState = await getAnalysis(state, formData);
            setState(newState);
        });
    };

    return (
        <div className="flex min-h-screen flex-col bg-[hsl(var(--background))] bg-app-gradient text-[hsl(var(--foreground))] transition-colors duration-300">
            <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl transition-all duration-300 md:px-10 dark:bg-slate-950/90 dark:border-slate-800/50">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-blue-600 bg-clip-text text-transparent dark:from-white dark:via-blue-300 dark:to-blue-400">
                                Saúde & Clínicas
                            </span>
                        </h1>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
                            Simulador Tributário Especializado
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = '/'}
                        className="hidden md:flex"
                    >
                        Voltar ao Hub
                    </Button>
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
                </div>
            </header>

            <main className="mx-auto mt-8 flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 pb-12 md:px-8">
                {showForm ? (
                    <>
                        <div className="text-center space-y-2 mb-4">
                            <h2 className="text-3xl font-bold tracking-tight">Planejamento Médico</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Preencha os dados da clínica ou profissional liberal. Nossa IA analisará cenários de Simples Nacional, Lucro Presumido (SUP/Hospitalar) e Carnê Leão.
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
                            clientName={state.initialParameters?.clientName || "Cliente"}
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
