'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { CheckCircle2, ChevronLeft, ChevronRight, TrendingDown, X, Download } from 'lucide-react';
import { exportPresentationToPDF } from '@/lib/export-presentation-pdf';
import { useToast } from '@/hooks/use-toast';

/**
 * Generic Sector Analysis Interface
 * Used by Agro, Varejo, and Services modules
 */
export interface SectorScenario {
    name: string;
    totalTax: number;
    effectiveRate: number;
    isRecommended: boolean;
    breakdown?: Array<{ name: string; value: number; rate?: number }>;
    notes?: string;
}

export interface SectorAnalysis {
    sectorName: string;
    sectorIcon?: React.ReactNode;
    clientName?: string;
    consultingFirm?: string;
    scenarios: SectorScenario[];
    monthlySavings: number;
    annualSavings: number;
    extraMetrics?: Array<{ label: string; value: string | number; highlight?: boolean }>;
}

type SectorPresentationProps = {
    analysis: SectorAnalysis;
    onClose: () => void;
};

export function SectorPresentation({ analysis, onClose }: SectorPresentationProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    const bestScenario = analysis.scenarios.find(s => s.isRecommended) || analysis.scenarios[0];
    const worstScenario = analysis.scenarios.find(s => !s.isRecommended) || analysis.scenarios[analysis.scenarios.length - 1];

    const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, 1));
    const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            await exportPresentationToPDF(
                analysis.clientName || 'Cliente',
                analysis.consultingFirm || 'Tributo.Med'
            );
            toast({
                title: 'PDF gerado com sucesso!',
                description: 'A apresentação foi baixada para o seu computador.',
            });
        } catch (error) {
            toast({
                title: 'Erro ao gerar PDF',
                description: error instanceof Error ? error.message : 'Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-white/10">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="h-6 w-1 bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-full"></span>
                        <h1 className="text-xl font-bold tracking-tight text-white">
                            {analysis.clientName || 'Planejamento Tributário'}
                        </h1>
                    </div>
                    <p className="text-xs font-medium text-slate-400 pl-3 uppercase tracking-wider">
                        {analysis.sectorName} • {analysis.consultingFirm || 'Tributo.Med'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? 'Gerando...' : 'Baixar PDF'}
                    </Button>
                    <div className="h-8 w-px bg-white/10 mx-1"></div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Slides Container */}
            <div className="flex-1 overflow-hidden relative">
                {/* Slide 1: Comparativo */}
                <div
                    data-slide="1"
                    className={cn(
                        "absolute inset-0 transition-transform duration-500 ease-in-out p-8 overflow-y-auto",
                        currentSlide === 0 ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <Slide1Comparativo
                        sectorName={analysis.sectorName}
                        bestScenario={bestScenario}
                        worstScenario={worstScenario}
                        monthlySavings={analysis.monthlySavings}
                        annualSavings={analysis.annualSavings}
                    />
                </div>

                {/* Slide 2: Detalhamento */}
                <div
                    data-slide="2"
                    className={cn(
                        "absolute inset-0 transition-transform duration-500 ease-in-out p-8 overflow-y-auto",
                        currentSlide === 1 ? "translate-x-0" : "translate-x-full"
                    )}
                >
                    <Slide2Detalhamento
                        bestScenario={bestScenario}
                        extraMetrics={analysis.extraMetrics}
                    />
                </div>
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between px-8 py-6 bg-slate-950 border-t border-white/10">
                <Button
                    variant="ghost"
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="text-slate-400 hover:text-white disabled:opacity-30"
                >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Anterior
                </Button>

                <div className="flex gap-2">
                    {[0, 1].map((index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={cn(
                                "h-2 rounded-full transition-all",
                                currentSlide === index ? "w-8 bg-emerald-500" : "w-2 bg-slate-600"
                            )}
                        />
                    ))}
                </div>

                <Button
                    variant="ghost"
                    onClick={nextSlide}
                    disabled={currentSlide === 1}
                    className="text-slate-400 hover:text-white disabled:opacity-30"
                >
                    Próximo
                    <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
            </div>
        </div>
    );
}

// Slide 1: Comparativo Atual vs Proposto
function Slide1Comparativo({
    sectorName,
    bestScenario,
    worstScenario,
    monthlySavings,
    annualSavings,
}: {
    sectorName: string;
    bestScenario: SectorScenario;
    worstScenario: SectorScenario;
    monthlySavings: number;
    annualSavings: number;
}) {
    return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="max-w-5xl w-full space-y-8">
                {/* Title */}
                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-bold text-white">Oportunidade de Economia</h2>
                    <p className="text-lg text-slate-400">Comparativo entre cenário atual e proposta otimizada • {sectorName}</p>
                </div>

                {/* Comparison Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Worst Scenario */}
                    <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm uppercase tracking-wider text-slate-400 font-semibold">Cenário Atual</span>
                            <div className="h-3 w-3 rounded-full bg-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">{worstScenario.name}</h3>
                            <p className="text-sm text-slate-400">Regime tributário menos eficiente</p>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Carga Tributária Mensal</p>
                                <p className="text-3xl font-bold text-amber-400">{formatCurrency(worstScenario.totalTax)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Alíquota Efetiva</p>
                                <p className="text-xl font-semibold text-slate-300">{worstScenario.effectiveRate.toFixed(2)}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Best Scenario */}
                    <div className="bg-emerald-950/50 border-2 border-emerald-500/50 rounded-2xl p-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm uppercase tracking-wider text-emerald-400 font-semibold">Cenário Proposto</span>
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">{bestScenario.name}</h3>
                            <p className="text-sm text-emerald-400">Regime tributário otimizado</p>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-emerald-500 uppercase font-medium">Carga Tributária Mensal</p>
                                <p className="text-3xl font-bold text-emerald-400">{formatCurrency(bestScenario.totalTax)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-emerald-500 uppercase font-medium">Alíquota Efetiva</p>
                                <p className="text-xl font-semibold text-emerald-300">{bestScenario.effectiveRate.toFixed(2)}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visual Bar Comparison */}
                <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8">
                    <h3 className="text-lg font-bold text-white mb-6">Comparação Visual</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">{worstScenario.name}</span>
                                <span className="text-amber-400">{formatCurrency(worstScenario.totalTax)}</span>
                            </div>
                            <div className="h-8 bg-slate-700 rounded-lg overflow-hidden">
                                <div className="h-full bg-amber-500/80 rounded-lg" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">{bestScenario.name}</span>
                                <span className="text-emerald-400">{formatCurrency(bestScenario.totalTax)}</span>
                            </div>
                            <div className="h-8 bg-slate-700 rounded-lg overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500/80 rounded-lg"
                                    style={{ width: `${worstScenario.totalTax > 0 ? (bestScenario.totalTax / worstScenario.totalTax) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Savings Highlight */}
                <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl p-8 text-center space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <TrendingDown className="h-8 w-8 text-white" />
                        <h3 className="text-2xl font-bold text-white">Economia Projetada</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-sm text-emerald-100 uppercase mb-2 font-medium">Economia Mensal</p>
                            <p className="text-5xl font-bold text-white">{formatCurrency(monthlySavings)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-emerald-100 uppercase mb-2 font-medium">Economia Anual</p>
                            <p className="text-5xl font-bold text-white">{formatCurrency(annualSavings)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Slide 2: Detalhamento e Métricas
function Slide2Detalhamento({
    bestScenario,
    extraMetrics
}: {
    bestScenario: SectorScenario;
    extraMetrics?: Array<{ label: string; value: string | number; highlight?: boolean }>;
}) {
    const breakdown = bestScenario.breakdown || [];

    return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="max-w-5xl w-full space-y-8">
                {/* Title */}
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-white">Detalhamento da Proposta</h2>
                    <p className="text-base text-slate-400">Composição tributária e principais benefícios</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Tax Breakdown */}
                    <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            Composição dos Tributos
                        </h3>
                        {breakdown.length > 0 ? (
                            <div className="space-y-3">
                                {breakdown.map((tax, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-white">{tax.name}</p>
                                            {tax.rate !== undefined && (
                                                <p className="text-xs text-slate-500">{tax.rate.toFixed(2)}%</p>
                                            )}
                                        </div>
                                        <p className="text-base font-semibold text-emerald-400">{formatCurrency(tax.value)}</p>
                                    </div>
                                ))}
                                <div className="pt-3 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-white">Total Mensal</p>
                                        <p className="text-lg font-bold text-emerald-400">{formatCurrency(bestScenario.totalTax)}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-slate-400">Regime simplificado.</p>
                                <div className="pt-3 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-white">Carga Total Mensal</p>
                                        <p className="text-lg font-bold text-emerald-400">{formatCurrency(bestScenario.totalTax)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Extra Metrics */}
                    <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-cyan-500" />
                            Indicadores-Chave
                        </h3>
                        <div className="space-y-4">
                            {/* Effective Rate */}
                            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-white/5">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-medium">Alíquota Efetiva</p>
                                    <p className="text-sm text-slate-400">Carga tributária real</p>
                                </div>
                                <p className="text-2xl font-bold text-emerald-400">{bestScenario.effectiveRate.toFixed(2)}%</p>
                            </div>

                            {/* Extra Metrics from props */}
                            {extraMetrics?.map((metric, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-white/5">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-medium">{metric.label}</p>
                                    </div>
                                    <p className={cn(
                                        "text-2xl font-bold",
                                        metric.highlight ? "text-cyan-400" : "text-white"
                                    )}>
                                        {typeof metric.value === 'number' ? formatCurrency(metric.value) : metric.value}
                                    </p>
                                </div>
                            ))}

                            {/* Notes */}
                            {bestScenario.notes && (
                                <div className="p-4 bg-cyan-950/50 border border-cyan-500/30 rounded-lg">
                                    <p className="text-xs text-cyan-400 uppercase mb-1 font-medium">Observação</p>
                                    <p className="text-xs text-cyan-200 leading-relaxed">{bestScenario.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
