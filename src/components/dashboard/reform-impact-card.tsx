"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calendar, Info, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Progress } from "@/components/ui/progress";

interface ReformImpactCardProps {
    currentMonthlyTax: number;
    monthlyRevenue: number;
    sector: 'SERVICE' | 'COMMERCE' | 'INDUSTRY' | 'AGRO' | 'HEALTH' | 'EDUCATION';
    isSimples: boolean;
}

export function ReformImpactCard({ currentMonthlyTax, monthlyRevenue, sector, isSimples }: ReformImpactCardProps) {
    const reformImpact = useMemo(() => {
        // Estimates based on EC 132/2023 preliminary rates
        const standardRate = 0.265; // ~26.5% (IBS+CBS)

        let effectiveReformRate = standardRate;
        let discount = 0;
        const notes = [];

        // Apply reductions
        if (['HEALTH', 'EDUCATION', 'AGRO'].includes(sector)) {
            discount = 0.60; // 60% reduction
            effectiveReformRate = standardRate * (1 - discount);
            notes.push("Setor com redução de 60% na alíquota.");
        }

        // Simples Nacional Logic
        if (isSimples) {
            // In Simples, company CAN stay, but might lose credit competitiveness
            notes.push("Empresas do Simples podem optar por recolher IBS/CBS por fora para transferir crédito integral.");
        }

        const estimatedReformTax = monthlyRevenue * effectiveReformRate;
        const currentEffectiveRate = currentMonthlyTax / monthlyRevenue;

        const diff = estimatedReformTax - currentMonthlyTax;
        const isIncrease = diff > 0;
        const percentChange = (diff / currentMonthlyTax) * 100;

        return {
            reformTax: estimatedReformTax,
            reformRate: effectiveReformRate,
            currentRate: currentEffectiveRate,
            diff,
            isIncrease,
            percentChange,
            notes
        };
    }, [currentMonthlyTax, monthlyRevenue, sector, isSimples]);

    return (
        <Card className="border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                            <Scale className="h-5 w-5 text-indigo-400" />
                            Impacto Reforma Tributária (2033)
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Projeção IBS + CBS (IVA Dual) vs Carga Atual
                        </CardDescription>
                    </div>
                    {reformImpact.isIncrease ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                            <TrendingUp className="h-4 w-4 text-rose-400" />
                            <span className="text-xs font-bold text-rose-400">Aumento de Carga</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <TrendingDown className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400">Redução Estimada</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Visual Bar Comparison */}
                <div className="space-y-4">
                    {/* Current */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Carga Atual</span>
                            <span className="text-white font-medium">{formatCurrency(currentMonthlyTax)} ({formatPercentage(reformImpact.currentRate)})</span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-slate-500 rounded-full"
                                style={{ width: '100%' }} // Baseline
                            />
                        </div>
                    </div>

                    {/* Reform */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-indigo-300">Pós-Reforma (Estimado)</span>
                            <span className={`font-bold ${reformImpact.isIncrease ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {formatCurrency(reformImpact.reformTax)} ({formatPercentage(reformImpact.reformRate)})
                            </span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${reformImpact.isIncrease ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{
                                    width: `${Math.min(100, (reformImpact.reformTax / currentMonthlyTax) * 100)}%`
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Analysis Box */}
                <div className="bg-slate-950/50 rounded-lg p-4 border border-white/5 space-y-3">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-white">Análise do Setor</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {reformImpact.isIncrease
                                    ? `Seu setor (${sector}) provavelmente terá aumento de carga nominal com a alíquota padrão (~26.5%).`
                                    : `Seu setor (${sector}) pode se beneficiar das alíquotas reduzidas.`
                                }
                            </p>
                            {reformImpact.notes.map((note, idx) => (
                                <p key={idx} className="text-xs text-indigo-300/80">• {note}</p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Transição
                    </h4>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>2026 (Início)</span>
                        <span>2027 (CBS)</span>
                        <span>2029-32 (Gradual)</span>
                        <span>2033 (Full)</span>
                    </div>
                    <Progress value={10} className="h-1.5 bg-slate-800" />
                </div>
            </CardContent>
        </Card>
    );
}


