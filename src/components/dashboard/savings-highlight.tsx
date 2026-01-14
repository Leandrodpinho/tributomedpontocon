'use client';

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { TrendingUp, ArrowUpRight, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavingsHighlightProps {
    monthlySavings: number;
    annualSavings: number;
    currentTax: number;
    projectedTax: number;
}

export function SavingsHighlight({ monthlySavings, annualSavings, currentTax, projectedTax }: SavingsHighlightProps) {
    const percentageSaved = currentTax > 0 ? (monthlySavings / currentTax) * 100 : 0;

    return (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-900 to-emerald-950 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl"></div>

                <CardContent className="relative p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 flex-1">
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-sm font-medium text-emerald-200 backdrop-blur-sm border border-emerald-500/20">
                            <TrendingUp className="h-4 w-4" />
                            Potencial de Eficiência Fiscal
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                            {formatCurrency(annualSavings)}
                        </h2>

                        <p className="text-emerald-100/80 text-lg max-w-xl">
                            Valor estimado que sua empresa pode deixar de pagar anualmente ao migrar para o regime tributário recomendado.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 w-full md:w-auto min-w-[300px]">
                        <div className="group relative overflow-hidden rounded-2xl bg-white/5 p-4 backdrop-blur-sm transition-all hover:bg-white/10 border border-white/10">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-emerald-200">Economia Mensal</span>
                                <Wallet className="h-5 w-5 text-emerald-400 opacity-80" />
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold">{formatCurrency(monthlySavings)}</span>
                                <span className="text-emerald-400 text-sm font-medium mb-1 flex items-center">
                                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                    {percentageSaved.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-xs text-emerald-200/60 uppercase tracking-wide">Carga Atual</span>
                                <p className="text-lg font-semibold text-white/90 mt-1">{formatCurrency(currentTax)}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-xs text-emerald-200/60 uppercase tracking-wide">Projeção</span>
                                <p className="text-lg font-semibold text-emerald-400 mt-1">{formatCurrency(projectedTax)}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
