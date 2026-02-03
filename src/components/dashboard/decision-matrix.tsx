"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ScenarioDetail } from "@/ai/flows/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface DecisionMatrixProps {
    scenarios: ScenarioDetail[];
    currentRevenue: number;
    currentPayroll: number;
}

/**
 * Matriz de Decisão Tributária
 * 
 * Mostra visualmente qual regime é ideal baseado em:
 * - Eixo X: Faturamento mensal (5k, 15k, 30k, 50k, 80k+)
 * - Eixo Y: Folha/Pró-labore como % do faturamento (0-10%, 10-20%, 20-30%, 30%+)
 */
export function DecisionMatrix({ scenarios, currentRevenue, currentPayroll }: DecisionMatrixProps) {
    // Faixas de faturamento
    const revenueBands = [
        { label: "Até 8k", min: 0, max: 8125 },
        { label: "8k-15k", min: 8125, max: 15000 },
        { label: "15k-30k", min: 15000, max: 30000 },
        { label: "30k-50k", min: 30000, max: 50000 },
        { label: "50k-80k", min: 50000, max: 80000 },
        { label: "80k+", min: 80000, max: Infinity },
    ];

    // Faixas de Fator R (folha/faturamento)
    const payrollBands = [
        { label: "0-10%", description: "Sem folha", min: 0, max: 0.10 },
        { label: "10-20%", description: "Folha baixa", min: 0.10, max: 0.20 },
        { label: "20-28%", description: "Próximo limiar", min: 0.20, max: 0.28 },
        { label: "28%+", description: "Fator R ativo", min: 0.28, max: Infinity },
    ];

    // Determina o melhor regime para cada célula da matriz
    const getRegimeRecommendation = (revBand: typeof revenueBands[0], payBand: typeof payrollBands[0]): {
        regime: string;
        color: string;
        note: string;
    } => {
        const midRevenue = (revBand.min + Math.min(revBand.max, 100000)) / 2;
        const midPayroll = (payBand.min + Math.min(payBand.max, 0.5)) / 2;

        // MEI: até 8.125/mês e atividade elegível
        if (revBand.max <= 8125) {
            return {
                regime: "MEI",
                color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
                note: "Limite R$ 97.500/ano"
            };
        }

        // Simples com Fator R
        if (midPayroll >= 0.28 && revBand.max <= 400000) {
            return {
                regime: "Simples III",
                color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
                note: "Fator R ≥ 28%"
            };
        }

        // Simples Anexo V (sem Fator R)
        if (midPayroll < 0.28 && revBand.max <= 30000) {
            return {
                regime: "Simples V",
                color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
                note: "Considerar LP"
            };
        }

        // Lucro Presumido para faturamentos maiores ou folha baixa
        if (midPayroll < 0.28 || midRevenue > 30000) {
            return {
                regime: "L. Presumido",
                color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
                note: "13-16% efetivo"
            };
        }

        // Default: Lucro Presumido
        return {
            regime: "L. Presumido",
            color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
            note: "Regime estável"
        };
    };

    // Encontra a posição atual do cliente na matriz
    const getCurrentPosition = () => {
        const fatorR = currentPayroll / currentRevenue;
        const revIndex = revenueBands.findIndex(b => currentRevenue >= b.min && currentRevenue < b.max);
        const payIndex = payrollBands.findIndex(b => fatorR >= b.min && fatorR < b.max);
        return {
            revIndex: revIndex >= 0 ? revIndex : revenueBands.length - 1,
            payIndex: payIndex >= 0 ? payIndex : payrollBands.length - 1
        };
    };

    const currentPos = getCurrentPosition();
    const bestScenario = scenarios.find(s => s.isEligible !== false);

    return (
        <Card className="border-brand-200 dark:border-brand-800">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    Matriz de Decisão Tributária
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>Esta matriz mostra o regime tributário mais econômico baseado no seu faturamento e folha de pagamento. Sua posição atual está destacada com borda.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
                <CardDescription>
                    Regime ideal por faixa de faturamento e folha de pagamento
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                <th className="p-2 text-left font-medium text-muted-foreground">Folha/Fat.</th>
                                {revenueBands.map((band, i) => (
                                    <th key={i} className="p-2 text-center font-medium text-muted-foreground">
                                        {band.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {payrollBands.map((payBand, payIdx) => (
                                <tr key={payIdx}>
                                    <td className="p-2 font-medium text-muted-foreground whitespace-nowrap">
                                        <div>{payBand.label}</div>
                                        <div className="text-xs opacity-70">{payBand.description}</div>
                                    </td>
                                    {revenueBands.map((revBand, revIdx) => {
                                        const rec = getRegimeRecommendation(revBand, payBand);
                                        const isCurrentCell = revIdx === currentPos.revIndex && payIdx === currentPos.payIndex;

                                        return (
                                            <td key={revIdx} className="p-1">
                                                <div className={cn(
                                                    "p-2 rounded-lg text-center text-xs font-medium transition-all",
                                                    rec.color,
                                                    isCurrentCell && "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-900 scale-105 shadow-lg"
                                                )}>
                                                    <div className="font-bold">{rec.regime}</div>
                                                    <div className="text-[10px] opacity-80 mt-0.5">{rec.note}</div>
                                                    {isCurrentCell && (
                                                        <div className="text-[9px] font-bold mt-1 bg-brand-500 text-white rounded px-1 py-0.5">
                                                            VOCÊ ESTÁ AQUI
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Legenda */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/40" />
                        <span>MEI (mais econômico)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/40" />
                        <span>Simples Anexo III</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/40" />
                        <span>Simples Anexo V</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/40" />
                        <span>Lucro Presumido</span>
                    </div>
                </div>

                {/* Recomendação atual */}
                {bestScenario && (
                    <div className="mt-4 p-3 bg-brand-50 dark:bg-brand-950/30 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium text-brand-700 dark:text-brand-300">
                            <TrendingUp className="h-4 w-4" />
                            Recomendação: {bestScenario.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Alíquota efetiva: {bestScenario.effectiveRate?.toFixed(2)}%
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
