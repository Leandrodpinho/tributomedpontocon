"use client"

import { useMemo, useState, useEffect } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, ReferenceLine } from "recharts"
import { calculateAllScenarios } from "@/lib/tax-calculator"
import { formatCurrency } from "@/lib/formatters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { TrendingUp, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SensitivityAnalysisChartProps {
    currentRevenue: number;
    payrollExpenses: number;
    issRate: number;
    numberOfPartners: number;
    realProfitMargin?: number;
    isUniprofessional: boolean;
}

export function SensitivityAnalysisChart({
    currentRevenue,
    payrollExpenses,
    issRate,
    numberOfPartners,
    realProfitMargin = 30,
    isUniprofessional
}: SensitivityAnalysisChartProps) {

    // Local state for simulation
    const [simRevenue, setSimRevenue] = useState(currentRevenue);
    const [simPayroll, setSimPayroll] = useState(payrollExpenses);
    const [simPartners, setSimPartners] = useState(numberOfPartners);
    const [keepRatio, setKeepRatio] = useState(true);

    // Reset when props change
    useEffect(() => {
        setSimRevenue(currentRevenue);
        setSimPayroll(payrollExpenses);
        setSimPartners(numberOfPartners);
    }, [currentRevenue, payrollExpenses, numberOfPartners]);

    // Update payroll when revenue changes if ratio is locked
    const handleRevenueChange = (value: number[]) => {
        const newRevenue = value[0];
        if (keepRatio && simRevenue > 0) {
            const ratio = simPayroll / simRevenue;
            setSimPayroll(newRevenue * ratio);
        }
        setSimRevenue(newRevenue);
    };

    const data = useMemo(() => {
        // Gera 10 pontos de simulação ao redor do valor SIMULADO (não do original)
        // Isso permite navegar infinitamente para cima ou para baixo
        const points = [];
        const start = simRevenue * 0.5;
        const end = simRevenue * 1.5;
        const step = (end - start) / 10;

        for (let rev = start; rev <= end + 1; rev += step) {
            // Arredonda para 1000 mais próximo
            const simulatedRevenue = Math.max(0, Math.round(rev / 1000) * 1000);
            if (simulatedRevenue === 0 && rev > 0) continue;

            // Se mantiver proporção, ajusta a folha para cada ponto do gráfico também
            let pointPayroll = simPayroll;
            if (keepRatio && simRevenue > 0) {
                const ratio = simPayroll / simRevenue;
                pointPayroll = simulatedRevenue * ratio;
            } else {
                // Se não mantiver proporção, a folha é fixa (o que dilui o fator R conforme fatura mais)
                pointPayroll = simPayroll;
            }

            const scenarios = calculateAllScenarios({
                monthlyRevenue: simulatedRevenue,
                payrollExpenses: pointPayroll,
                issRate,
                numberOfPartners: simPartners, // Usa o valor do slider
                realProfitMargin,
                isUniprofessional
            });

            // Extrai os valores dos principais regimes
            const simples = scenarios.find(s => s.name.includes('Otimizado') || s.name.includes('Anexo III'))?.totalTax || 0;
            const presumido = scenarios.find(s => s.name.includes('Presumido (Padrão)'))?.totalTax || 0;
            const real = scenarios.find(s => s.name.includes('Lucro Real'))?.totalTax || 0;

            // Tenta pegar o Anexo V se o Otimizado não existir (caso fator R seja baixo)
            const simplesFinal = simples > 0 ? simples : (scenarios.find(s => s.name.includes('Anexo V'))?.totalTax || 0);

            points.push({
                revenue: simulatedRevenue,
                Simples: simplesFinal,
                Presumido: presumido,
                Real: real,
            });
        }
        return points;
    }, [simRevenue, simPayroll, simPartners, issRate, realProfitMargin, isUniprofessional, keepRatio]);

    const resetSimulation = () => {
        setSimRevenue(currentRevenue);
        setSimPayroll(payrollExpenses);
        setSimPartners(numberOfPartners);
        setKeepRatio(true);
    };

    return (
        <Card className="print:break-inside-avoid flex flex-col h-full">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-brand-600" />
                        <CardTitle className="text-lg">Simulador &quot;What-If&quot; (Interativo)</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={resetSimulation} title="Resetar Simulação">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <CardDescription>
                    Ajuste os parâmetros abaixo para ver como a carga tributária reage em tempo real.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
                <div className="h-[250px] w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                                dataKey="revenue"
                                tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                labelFormatter={(label) => `Faturamento: ${formatCurrency(Number(label))}`}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend />

                            <Line type="monotone" dataKey="Simples" stroke="#10b981" strokeWidth={3} name="Simples Nacional" dot={false} />
                            <Line type="monotone" dataKey="Presumido" stroke="#f59e0b" strokeWidth={3} name="Lucro Presumido" dot={false} />
                            <Line type="monotone" dataKey="Real" stroke="#6366f1" strokeWidth={2} name="Lucro Real" dot={false} strokeDasharray="5 5" />

                            <ReferenceLine x={simRevenue} stroke="red" strokeDasharray="3 3" label="Simulado" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-6 px-2">
                    {/* Revenue Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label className="text-sm font-medium">Faturamento Mensal</Label>
                            <span className="text-sm font-bold text-brand-600">{formatCurrency(simRevenue)}</span>
                        </div>
                        <Slider
                            value={[simRevenue]}
                            min={0}
                            max={currentRevenue * 3 || 100000} // Limite dinâmico
                            step={1000}
                            onValueChange={handleRevenueChange}
                            className="w-full"
                        />
                    </div>

                    {/* Payroll Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label className="text-sm font-medium">Folha de Pagamento (Bruta)</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground mr-1">Travar %</span>
                                <Switch checked={keepRatio} onCheckedChange={setKeepRatio} className="scale-75 origin-right" />
                                <span className="text-sm font-bold text-brand-600 min-w-[80px] text-right">{formatCurrency(simPayroll)}</span>
                            </div>
                        </div>
                        <Slider
                            value={[simPayroll]}
                            min={0}
                            max={simRevenue} // Não faz sentido folha maior que o faturamento aqui
                            step={100}
                            onValueChange={(val) => { setSimPayroll(val[0]); setKeepRatio(false); }} // Desativa trava se mexer manual
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground text-right pt-1">
                            Equivale a {((simPayroll / (simRevenue || 1)) * 100).toFixed(1)}% do faturamento
                        </p>
                    </div>

                    {/* Partners Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label className="text-sm font-medium">Número de Sócios</Label>
                            <span className="text-sm font-bold text-brand-600">{simPartners}</span>
                        </div>
                        <Slider
                            value={[simPartners]}
                            min={1}
                            max={10}
                            step={1}
                            onValueChange={(val) => setSimPartners(val[0])}
                            className="w-full"
                        />
                    </div>
                </div>

            </CardContent>
            <CardFooter className="pt-2">
                <div className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 p-3 rounded border w-full">
                    <p>
                        <strong>Nota:</strong> A simulação re-calcula o cenário &quot;Fator R&quot; automaticamente se a folha atingir 28%. O Lucro Real é sempre estimado.
                    </p>
                </div>
            </CardFooter>
        </Card>
    );
}
