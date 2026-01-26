"use client";

import { useMemo, useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { calculateAllScenarios } from '@/lib/tax-calculator';
import { ScenarioComparisonChart } from '@/components/scenario-comparison-chart';
import { Input } from '@/components/ui/input';
import { LegalConfidenceWidget } from './legal-confidence-widget';

interface SimulatorPanelProps {
    initialRevenue: number;
    initialPayroll?: number;
    initialIssRate?: number;
    initialPartners?: number;
    initialRealMargin?: number;
    initialIsSup?: boolean;
}

export function SimulatorPanel({
    initialRevenue,
    initialPayroll = 0,
    initialIssRate = 4,
    initialPartners = 1,
    initialRealMargin = 30,
    initialIsSup = false
}: SimulatorPanelProps) {
    const [revenue, setRevenue] = useState(initialRevenue);
    const [payroll, setPayroll] = useState(initialPayroll);
    const [issRate, setIssRate] = useState(initialIssRate);
    const [isSup, setIsSup] = useState(initialIsSup);
    const [partners, setPartners] = useState(initialPartners);
    const [realMargin, setRealMargin] = useState(initialRealMargin);

    const scenarios = useMemo(() => {
        return calculateAllScenarios({
            monthlyRevenue: revenue,
            payrollExpenses: payroll,
            issRate: issRate,
            isUniprofessional: isSup,
            numberOfPartners: partners,
            realProfitMargin: realMargin,
        });
    }, [revenue, payroll, issRate, isSup, partners, realMargin]);

    const bestScenario = scenarios.find(s => s.isBest) || scenarios[0];
    const chartData = scenarios.map(s => ({
        name: s.name.replace(/\(.*?\)/, '').trim(),
        totalTax: s.totalTax,
        netProfit: s.netProfit,
    }));

    return (
        <div className="space-y-6">
            <div className="glass-card flex flex-col rounded-xl p-6">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold text-foreground">
                        Simulador Interativo
                    </CardTitle>
                    <CardDescription>
                        Ajuste o faturamento e despesas para ver como o regime ideal muda em tempo real.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-8 lg:grid-cols-[300px_1fr]">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Faturamento Mensal</Label>
                                <span className="text-sm font-medium text-brand-600">{formatCurrency(revenue)}</span>
                            </div>
                            <Slider
                                value={[revenue]}
                                min={5000}
                                max={200000}
                                step={1000}
                                onValueChange={(vals) => setRevenue(vals[0])}
                                className="py-2"
                            />
                            <p className="text-xs text-muted-foreground">Arraste para simular crescimentos.</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Folha de Pagamento (CLT)</Label>
                                <span className="text-sm font-medium text-brand-600">{formatCurrency(payroll)}</span>
                            </div>
                            <Slider
                                value={[payroll]}
                                min={0}
                                max={50000}
                                step={500}
                                onValueChange={(vals) => setPayroll(vals[0])}
                                className="py-2"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label>Alíquota ISS (%)</Label>
                                <Input
                                    type="number"
                                    value={issRate}
                                    onChange={(e) => setIssRate(Number(e.target.value))}
                                    min={2}
                                    max={5}
                                    step={0.5}
                                    disabled={isSup} // Se SUP, ISS é fixo, não usa %
                                    className={isSup ? "opacity-50" : ""}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label>Nº de Sócios</Label>
                                <Input
                                    type="number"
                                    value={partners}
                                    onChange={(e) => setPartners(Math.max(1, Number(e.target.value)))}
                                    min={1}
                                    max={10}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-dashed border-white/10">
                            <div className="flex items-center justify-between">
                                <Label>Margem de Lucro (p/ Lucro Real)</Label>
                                <span className="text-sm font-medium text-brand-600">{realMargin}%</span>
                            </div>
                            <Slider
                                value={[realMargin]}
                                min={5}
                                max={50}
                                step={1}
                                onValueChange={(vals) => setRealMargin(vals[0])}
                                className="py-2"
                            />
                            <p className="text-[10px] text-muted-foreground">Analisa se Lucro Real compensa com margens baixas.</p>
                        </div>

                        <div className="flex items-center space-x-2 rounded-lg border p-3">
                            <Switch id="sup-mode" checked={isSup} onCheckedChange={setIsSup} />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="sup-mode" className="cursor-pointer">Sociedade Uniprofissional</Label>
                                <p className="text-xs text-muted-foreground">
                                    Ativa cálculo de ISS Fixo por sócio.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-lg bg-[hsl(var(--secondary))] p-4">
                            <p className="text-xs font-medium uppercase text-muted-foreground">Melhor Escolha</p>
                            <p className="mt-1 text-lg font-bold text-brand-700 leading-tight">{bestScenario.name}</p>
                            <p className="text-sm text-foreground mt-1">Carga Efetiva: {formatPercentage(bestScenario.effectiveRate / 100)}</p>
                        </div>
                    </div>

                    <div className="min-h-[300px]">
                        <ScenarioComparisonChart data={chartData} />
                        {/* Lista de Cenários - Layout Limpo e Organizado */}
                        <div className="mt-6 space-y-3">
                            {scenarios.map(s => {
                                const isWorst = s.isWorst;
                                const isBest = s.isBest;

                                return (
                                    <div
                                        key={s.name}
                                        className={`
                                            relative flex flex-col md:flex-row md:items-center justify-between gap-4 
                                            rounded-xl p-5 text-sm transition-all duration-200 
                                            ${isBest
                                                ? 'bg-gradient-to-r from-brand-50 to-white border-2 border-brand-400 shadow-md dark:from-brand-900/30 dark:to-slate-900 dark:border-brand-600'
                                                : isWorst
                                                    ? 'bg-rose-50/50 border border-rose-200 dark:bg-rose-900/10 dark:border-rose-800'
                                                    : 'bg-white/50 border border-slate-200 hover:bg-white hover:shadow-sm dark:bg-slate-900/30 dark:border-slate-700 dark:hover:bg-slate-900/50'
                                            }
                                        `}
                                    >
                                        {/* Nome do Cenário + Badge */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h4 className={`font-semibold truncate ${isBest ? 'text-brand-700 dark:text-brand-300' : isWorst ? 'text-rose-700 dark:text-rose-300' : 'text-foreground'}`}>
                                                    {s.name}
                                                </h4>
                                                {isBest && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-600 text-white">
                                                        ★ Melhor
                                                    </span>
                                                )}
                                                {isWorst && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500 text-white">
                                                        Mais Caro
                                                    </span>
                                                )}
                                            </div>
                                            {s.notes && s.notes.length > 0 && (
                                                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{s.notes[0]}</p>
                                            )}
                                        </div>

                                        {/* Métricas em Linha */}
                                        <div className="flex items-center gap-6 md:gap-8 shrink-0">
                                            <div className="text-center min-w-[90px]">
                                                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Imposto</span>
                                                <span className={`text-base font-bold ${isWorst ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {formatCurrency(s.totalTax)}
                                                </span>
                                            </div>
                                            <div className="text-center min-w-[90px]">
                                                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Pró-Labore</span>
                                                <span className="text-base font-semibold text-slate-600 dark:text-slate-300">
                                                    {formatCurrency(s.proLabore)}
                                                </span>
                                            </div>
                                            <div className="text-center min-w-[70px]">
                                                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Alic. Efet.</span>
                                                <span className={`text-base font-bold ${isBest ? 'text-brand-600' : 'text-slate-600 dark:text-slate-300'}`}>
                                                    {formatPercentage(s.effectiveRate / 100)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </div>
        </div>
    );
}
