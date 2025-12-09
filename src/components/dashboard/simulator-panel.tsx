'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { calculateAllScenarios } from '@/lib/tax-calculator';
import { ScenarioComparisonChart } from '@/components/scenario-comparison-chart';
import { Input } from '@/components/ui/input';

interface SimulatorPanelProps {
    initialRevenue: number;
}

export function SimulatorPanel({ initialRevenue }: SimulatorPanelProps) {
    const [revenue, setRevenue] = useState(initialRevenue);
    const [payroll, setPayroll] = useState(0); // Folha CLT apenas
    const [issRate, setIssRate] = useState(4); // Padrão 4%

    const scenarios = useMemo(() => {
        return calculateAllScenarios({
            monthlyRevenue: revenue,
            payrollExpenses: payroll,
            issRate: issRate,
        });
    }, [revenue, payroll, issRate]);

    const bestScenario = scenarios[0]; // Já vem ordenado por totalTax
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
                        <div className="space-y-3">
                            <Label>Alíquota ISS (%)</Label>
                            <Input
                                type="number"
                                value={issRate}
                                onChange={(e) => setIssRate(Number(e.target.value))}
                                min={2}
                                max={5}
                                step={0.5}
                            />
                        </div>

                        <div className="rounded-lg bg-[hsl(var(--secondary))] p-4">
                            <p className="text-xs font-medium uppercase text-muted-foreground">Melhor Escolha</p>
                            <p className="mt-1 text-lg font-bold text-brand-700">{bestScenario.name}</p>
                            <p className="text-sm text-foreground">Carga Efetiva: {formatPercentage(bestScenario.effectiveRate / 100)}</p>
                        </div>
                    </div>

                    <div className="min-h-[300px]">
                        <ScenarioComparisonChart data={chartData} />
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {scenarios.map(s => (
                                <div key={s.name} className={`rounded border p-3 text-xs backdrop-blur-sm transition-colors ${s.name === bestScenario.name ? 'border-brand-500 bg-brand-500/10' : 'border-white/20 hover:bg-white/10 input-glass'}`}>
                                    <strong>{s.name}</strong>
                                    <div className="mt-1 flex justify-between">
                                        <span>Imposto Total:</span>
                                        <span>{formatCurrency(s.totalTax)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Pró-Labore Sugerido:</span>
                                        <span>{formatCurrency(s.proLabore)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </div>
        </div>
    );
}
