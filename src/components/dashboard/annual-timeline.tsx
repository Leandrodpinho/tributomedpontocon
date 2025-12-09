'use client';

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, Wallet } from 'lucide-react';

interface AnnualTimelineProps {
    monthlySavings: number;
}

export function AnnualTimeline({ monthlySavings }: AnnualTimelineProps) {
    // Projeção para 1, 3, 5 e 10 anos
    // Considerando uma aplicação conservadora do valor economizado (ex: 100% CDI ~ 0.8% a.m apenas para efeito ilustrativo de "custo de oportunidade")
    // Simplificação: Juros Compostos mensais
    const periods = [1, 2, 3, 4, 5];
    const interestRate = 0.008; // 0.8% ao mês

    const data = periods.map((year) => {
        const months = year * 12;
        // Fórmula de Valor Futuro de uma série de pagamentos (PMT): FV = PMT * (((1 + i)^n - 1) / i)
        // Se savings = 0, valor é 0.
        const accumulated = monthlySavings > 0
            ? monthlySavings * ((Math.pow(1 + interestRate, months) - 1) / interestRate)
            : 0;

        return {
            year: `${year}º Ano`,
            value: accumulated,
            formatted: formatCurrency(accumulated),
        };
    });

    const totalIn5Years = data[data.length - 1].value;

    return (
        <Card className="glass-card overflow-hidden border-none text-card-foreground shadow-xl">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                            Projeção de Riqueza
                        </CardTitle>
                        <CardDescription>
                            Acumulado da economia tributária aplicado (CDI ~0.8% a.m)
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Em 5 anos</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIn5Years)}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="year"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                tickMargin={10}
                            />
                            <YAxis
                                hide
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    color: 'hsl(var(--foreground))',
                                }}
                                formatter={(value: number) => [formatCurrency(value), 'Acumulado']}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="hsl(var(--accent))"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 rounded-xl bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                    <div className="flex items-start gap-3">
                        <Wallet className="mt-1 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                                O Poder dos Juros Compostos
                            </p>
                            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                                Essa projeção considera que você reinvestirá o valor economizado mensalmente.
                                É o impacto real de um bom planejamento tributário no seu patrimônio pessoal.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
