'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/formatters';
import { calculateAllScenarios } from '@/lib/tax-calculator';
import { ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';

interface ProLaboreOptimizerProps {
    initialRevenue: number;
}

export function ProLaboreOptimizer({ initialRevenue }: ProLaboreOptimizerProps) {
    const [revenue, setRevenue] = useState(initialRevenue);
    const [currentPayroll, setCurrentPayroll] = useState(0);

    const analysis = useMemo(() => {
        return calculateAllScenarios({
            monthlyRevenue: revenue,
            payrollExpenses: currentPayroll,
            issRate: 4, // Padrão
        });
    }, [revenue, currentPayroll]);

    // Encontra os cenários relevantes
    const anexoV = analysis.find(s => s.name.includes('Anexo V'));
    const fatorROpt = analysis.find(s => s.name.includes('Fator R Otimizado'));

    // Se já está no Anexo III Natural, não precisa otimizar
    const isAlreadyOptimal = analysis.some(s => s.name.includes('Anexo III - Natural'));

    if (!anexoV || !fatorROpt || isAlreadyOptimal) {
        if (isAlreadyOptimal) {
            return (
                <div className="glass-card flex flex-col rounded-xl border-emerald-500/30 bg-emerald-500/10 p-6">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <CardTitle className="text-lg text-emerald-900 dark:text-emerald-100">Situação Otimizada!</CardTitle>
                        </div>
                        <CardDescription className="text-emerald-800 dark:text-emerald-200">
                            Seu custo com folha já permite o enquadramento no Anexo III (Fator R {'>'} 28%).
                        </CardDescription>
                    </CardHeader>
                </div>
            );
        }
        return null; // Caso de fallback, não deveria acontecer com a lógica atual
    }

    const savings = anexoV.totalTax - fatorROpt.totalTax;
    const proLaboreIncrease = fatorROpt.proLabore - anexoV.proLabore;
    const netGain = savings; // A economia tributária é líquida na PJ, mas o sócio paga mais IR/INSS. O totalTax já considera tudo.

    return (
        <div className="glass-card flex flex-col rounded-xl p-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
                    <TrendingUp className="h-5 w-5 text-brand-600" />
                    Otimizador de Pró-Labore (Fator R)
                </CardTitle>
                <CardDescription>
                    Descubra se aumentar seu pró-labore reduz sua conta final de impostos.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Faturamento Mensal Estimado</Label>
                            <Input
                                type="number"
                                value={revenue}
                                onChange={(e) => setRevenue(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Folha CLT Atual (sem sócios)</Label>
                            <Input
                                type="number"
                                value={currentPayroll}
                                onChange={(e) => setCurrentPayroll(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-6">
                        <div className="mb-4 flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                <span className="text-lg font-bold">R</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-brand-900 dark:text-brand-100">Estratégia Recomendada</h4>
                                <p className="text-sm text-brand-700 dark:text-brand-300/80">
                                    Aumente seu pró-labore para atingir 28% do faturamento e migrar do Anexo V para o III.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs uppercase text-muted-foreground">Pró-Labore Sugerido</p>
                                <p className="text-2xl font-bold text-foreground">{formatCurrency(fatorROpt.proLabore)}</p>
                                <p className="text-xs text-muted-foreground">Aumento de {formatCurrency(proLaboreIncrease)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-muted-foreground">Economia Mensal</p>
                                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(savings)}</p>
                                <p className="text-xs text-muted-foreground">Já descontando IR/INSS adicionais</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative flex items-center justify-between rounded-lg border p-4 text-sm">
                    <div className="flex-1 text-center">
                        <p className="font-medium text-muted-foreground">Cenário Atual (Anexo V)</p>
                        <p className="text-lg font-semibold text-destructive">{formatCurrency(anexoV.totalTax)} <span className="text-xs font-normal text-muted-foreground">em impostos</span></p>
                    </div>
                    <ArrowRight className="mx-4 text-muted-foreground" />
                    <div className="flex-1 text-center">
                        <p className="font-medium text-muted-foreground">Cenário Otimizado (Anexo III)</p>
                        <p className="text-lg font-semibold text-emerald-600">{formatCurrency(fatorROpt.totalTax)} <span className="text-xs font-normal text-muted-foreground">em impostos</span></p>
                    </div>
                </div>
            </CardContent>
        </div>
    );
}
