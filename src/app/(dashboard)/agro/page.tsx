"use client";

import { useState } from "react";
import { ArrowLeft, Calculator, BarChart3, Leaf, Sprout, Tractor, TrendingDown, Wheat, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { SectorPresentation, SectorAnalysis } from "@/components/dashboard/sector-presentation";
import { ReformImpactCard } from "@/components/dashboard/reform-impact-card";
import {
    calculateAgroScenario,
    calculateFunrural,
    calculateITR,
    compareArrendamentoVsParceria,
    calculateHarvestDRE,
    AgroAnalysis,
    HarvestDRE
} from "@/lib/agro-calculator";

export default function AgroPage() {
    const [inputs, setInputs] = useState({
        // Básico
        annualRevenue: 2000000,
        operatingExpenses: 1200000,
        investments: 500000,
        priorLosses: 0,
        // ITR
        vtn: 5000000, // Valor da Terra Nua
        totalArea: 500, // Hectares
        usedArea: 450, // Hectares usados
        // Sub-rogação Funrural
        isSubrogation: false,
        // Arrendamento
        monthlyRent: 15000,
        estimatedProductionShare: 400000 // Anual
    });

    const [result, setResult] = useState<HarvestDRE | null>(null);
    const [comparison, setComparison] = useState<ReturnType<typeof compareArrendamentoVsParceria> | null>(null);
    const [showPresentation, setShowPresentation] = useState(false);

    const handleCalculate = () => {
        // DRE Completa da Safra
        const dre = calculateHarvestDRE({
            ...inputs,
            funruralRevenue: inputs.annualRevenue,
            isSubrogation: inputs.isSubrogation,
            itr: {
                vtn: inputs.vtn,
                totalArea: inputs.totalArea,
                usedArea: inputs.usedArea
            }
        });
        setResult(dre);

        // Comparativo Arrendamento vs Parceria
        const comp = compareArrendamentoVsParceria({
            monthlyRent: inputs.monthlyRent,
            estimatedProductionShare: inputs.estimatedProductionShare
        });
        setComparison(comp);
    };

    return (
        <>
            {/* Presentation Modal */}
            {showPresentation && result && (
                <SectorPresentation
                    analysis={{
                        sectorName: 'Produtor Rural',
                        clientName: 'Safra ' + new Date().getFullYear(),
                        consultingFirm: 'Tributo.Med',
                        scenarios: [
                            {
                                name: 'LCDPR (Resultado Real)',
                                totalTax: result.funrural + result.itr + result.irpf,
                                effectiveRate: result.effectiveTaxRate,
                                isRecommended: true,
                                breakdown: [
                                    { name: 'Funrural', value: result.funrural },
                                    { name: 'ITR', value: result.itr },
                                    { name: 'IRPF', value: result.irpf }
                                ],
                                notes: 'Dedução integral de Custeio + Investimentos aplicada.'
                            },
                            {
                                name: 'Simplificado (20%)',
                                totalTax: result.grossRevenue * 0.20 * 0.275 + result.funrural + result.itr,
                                effectiveRate: ((result.grossRevenue * 0.20 * 0.275 + result.funrural + result.itr) / result.grossRevenue) * 100,
                                isRecommended: false
                            }
                        ],
                        monthlySavings: (result.grossRevenue * 0.20 * 0.275) - result.irpf,
                        annualSavings: ((result.grossRevenue * 0.20 * 0.275) - result.irpf),
                        extraMetrics: [
                            { label: 'Lucro Líquido', value: result.netProfit, highlight: true },
                            { label: 'Receita Bruta', value: result.grossRevenue }
                        ]
                    }}
                    onClose={() => setShowPresentation(false)}
                />
            )}
            <div className="flex min-h-screen flex-col bg-slate-950 text-white font-sans selection:bg-emerald-500/30">

                {/* Header */}
                <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-white/5 bg-slate-950/80 px-6 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => window.location.href = '/'} className="text-slate-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                                <Tractor className="h-5 w-5" />
                                Produtor Rural (Expert)
                            </h1>
                            <p className="text-xs text-slate-500">Funrural, ITR, LCDPR e Contratos Agrários</p>
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-6 py-10 max-w-6xl">

                    <Tabs defaultValue="safra" className="w-full">
                        <TabsList className="bg-slate-900 border border-white/10 w-full justify-start mb-6">
                            <TabsTrigger value="safra" className="text-emerald-400">Análise de Safra</TabsTrigger>
                            <TabsTrigger value="contratos" className="text-amber-400">Arrendamento vs Parceria</TabsTrigger>
                        </TabsList>

                        {/* TAB 1: ANÁLISE DE SAFRA */}
                        <TabsContent value="safra" className="grid gap-8 lg:grid-cols-12">
                            {/* Inputs */}
                            <section className="lg:col-span-4 space-y-6">
                                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-white flex items-center gap-2">
                                            <Wheat className="h-5 w-5 text-emerald-500" />
                                            Dados da Safra (Anual)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-slate-300">Receita Bruta Venda</Label>
                                                    <span className="text-sm font-medium text-emerald-400">{formatCurrency(inputs.annualRevenue)}</span>
                                                </div>
                                                <Slider
                                                    value={[inputs.annualRevenue]}
                                                    min={100000}
                                                    max={10000000}
                                                    step={10000}
                                                    onValueChange={(vals) => setInputs(prev => ({ ...prev, annualRevenue: vals[0] }))}
                                                    className="py-1"
                                                />
                                                <Input
                                                    type="number"
                                                    value={inputs.annualRevenue}
                                                    onChange={(e) => setInputs(prev => ({ ...prev, annualRevenue: Number(e.target.value) }))}
                                                    className="bg-slate-900/50 border-white/10 text-white hidden"
                                                />
                                                <p className="text-xs text-slate-500">Arraste para ajustar o faturamento anual.</p>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-slate-300">Custeio (Insumos + MO)</Label>
                                                    <span className="text-sm font-medium text-rose-400">{formatCurrency(inputs.operatingExpenses)}</span>
                                                </div>
                                                <Slider
                                                    value={[inputs.operatingExpenses]}
                                                    min={0}
                                                    max={inputs.annualRevenue * 1.5}
                                                    step={5000}
                                                    onValueChange={(vals) => setInputs(prev => ({ ...prev, operatingExpenses: vals[0] }))}
                                                    className="py-1"
                                                />
                                                <Input
                                                    type="number"
                                                    value={inputs.operatingExpenses}
                                                    onChange={(e) => setInputs(prev => ({ ...prev, operatingExpenses: Number(e.target.value) }))}
                                                    className="bg-slate-900/50 border-white/10 text-white hidden"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-slate-300">Investimentos (Máquinas)</Label>
                                                <Input type="number" value={inputs.investments} onChange={(e) => setInputs(prev => ({ ...prev, investments: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white" />
                                                <p className="text-xs text-emerald-400">100% dedutível no ano da compra (LCDPR).</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-sm text-slate-200">Funrural & ITR</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-slate-300">Comprador recolhe (Sub-rogação)?</Label>
                                            <Switch checked={inputs.isSubrogation} onCheckedChange={c => setInputs(prev => ({ ...prev, isSubrogation: c }))} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-slate-400">VTN (R$)</Label>
                                                <Input type="number" value={inputs.vtn} onChange={(e) => setInputs(prev => ({ ...prev, vtn: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-slate-400">Área Total (ha)</Label>
                                                <Input type="number" value={inputs.totalArea} onChange={(e) => setInputs(prev => ({ ...prev, totalArea: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white text-sm" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-400">Área Utilizada (ha)</Label>
                                            <Input type="number" value={inputs.usedArea} onChange={(e) => setInputs(prev => ({ ...prev, usedArea: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white text-sm" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Button onClick={handleCalculate} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                    <Calculator className="h-4 w-4 mr-2" /> Gerar DRE da Safra
                                </Button>
                            </section>

                            {/* Resultados DRE */}
                            <section className="lg:col-span-8 space-y-6">
                                {!result ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 min-h-[400px] border-2 border-dashed border-white/5 rounded-2xl">
                                        <Leaf className="h-16 w-16 opacity-20" />
                                        <p>Simule para gerar a DRE completa da safra.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* DRE Visual */}
                                        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-slate-950">
                                            <CardHeader>
                                                <CardTitle className="text-emerald-400 flex items-center gap-2">
                                                    <BarChart3 className="h-5 w-5" />
                                                    DRE da Safra (Demonstrativo de Resultado)
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                                        <span className="text-slate-400">(+) Receita Bruta</span>
                                                        <span className="font-bold text-white">{formatCurrency(result.grossRevenue)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">(-) Custeio</span>
                                                        <span className="text-red-400">-{formatCurrency(result.operatingCosts)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">(-) Investimentos</span>
                                                        <span className="text-red-400">-{formatCurrency(result.investments)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">(-) Funrural ({inputs.isSubrogation ? '2.3%' : '1.5%'})</span>
                                                        <span className="text-red-400">-{formatCurrency(result.funrural)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">(-) ITR</span>
                                                        <span className="text-red-400">-{formatCurrency(result.itr)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">(-) IRPF (Lei Rural)</span>
                                                        <span className="text-red-400">-{formatCurrency(result.irpf)}</span>
                                                    </div>
                                                    <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                                                        <span className="font-bold text-white text-base">(=) Lucro Líquido</span>
                                                        <span className="font-bold text-2xl text-emerald-400">{formatCurrency(result.netProfit)}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Carga Tributária */}
                                        <div className="rounded-xl bg-slate-900 border border-white/10 p-4 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-white">Carga Tributária Efetiva</h4>
                                                <p className="text-xs text-slate-400">Somatório: Funrural + ITR + IRPF</p>
                                            </div>
                                            <div className="text-3xl font-bold text-amber-400">
                                                {result.effectiveTaxRate.toFixed(2)}%
                                            </div>
                                        </div>

                                        {/* Tax Reform Impact */}
                                        <ReformImpactCard
                                            currentMonthlyTax={(result.funrural + result.itr + result.irpf) / 12}
                                            monthlyRevenue={inputs.annualRevenue / 12}
                                            sector="AGRO"
                                            isSimples={false}
                                        />

                                        {/* Presentation Button */}
                                        <Button
                                            onClick={() => setShowPresentation(true)}
                                            className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-bold"
                                        >
                                            <Presentation className="h-4 w-4 mr-2" /> Ver Apresentação Executiva
                                        </Button>
                                    </div>
                                )}
                            </section>
                        </TabsContent>

                        {/* TAB 2: ARRENDAMENTO VS PARCERIA */}
                        <TabsContent value="contratos" className="grid gap-8 lg:grid-cols-12">
                            <section className="lg:col-span-4 space-y-6">
                                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-white">Simulador de Contratos</CardTitle>
                                        <CardDescription className="text-slate-400">Para quem CEDE a terra.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Aluguel Mensal (Arrendamento)</Label>
                                            <Input type="number" value={inputs.monthlyRent} onChange={(e) => setInputs(prev => ({ ...prev, monthlyRent: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Valor Estimado da Parceria (Anual)</Label>
                                            <Input type="number" value={inputs.estimatedProductionShare} onChange={(e) => setInputs(prev => ({ ...prev, estimatedProductionShare: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white" />
                                            <p className="text-xs text-slate-400">Ex: 30% de uma safra de R$ 1.3M = R$ 400k</p>
                                        </div>
                                        <Button onClick={handleCalculate} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold mt-4">
                                            Comparar Contratos
                                        </Button>
                                    </CardContent>
                                </Card>
                            </section>

                            <section className="lg:col-span-8">
                                {!comparison ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 min-h-[300px] border-2 border-dashed border-white/5 rounded-2xl">
                                        <TrendingDown className="h-12 w-12 opacity-20" />
                                        <p>Simule para ver qual contrato paga menos imposto.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 animate-in fade-in duration-500">
                                        {/* Arrendamento */}
                                        <Card className={`border-white/10 ${comparison.recommendation === 'ARRENDAMENTO' ? 'bg-emerald-900/20 ring-1 ring-emerald-500/50' : 'bg-white/5'}`}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base text-slate-200 flex justify-between">
                                                    Arrendamento
                                                    {comparison.recommendation === 'ARRENDAMENTO' && <span className="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-0.5 rounded-full">Recomendado</span>}
                                                </CardTitle>
                                                <CardDescription className="text-xs text-slate-400">Renda fixa mensal (trib. como aluguel PF)</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <div className="text-2xl font-bold text-white">{formatCurrency(comparison.arrendamento.netIncome)}/ano líquido</div>
                                                <div className="text-sm text-red-400">Imposto: {formatCurrency(comparison.arrendamento.tax)}</div>
                                            </CardContent>
                                        </Card>

                                        {/* Parceria */}
                                        <Card className={`border-white/10 ${comparison.recommendation === 'PARCERIA' ? 'bg-amber-900/20 ring-1 ring-amber-500/50' : 'bg-white/5'}`}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base text-slate-200 flex justify-between">
                                                    Parceria Rural
                                                    {comparison.recommendation === 'PARCERIA' && <span className="text-amber-400 text-xs bg-amber-400/10 px-2 py-0.5 rounded-full">Recomendado</span>}
                                                </CardTitle>
                                                <CardDescription className="text-xs text-slate-400">% da produção (trib. como rural - 20%)</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <div className="text-2xl font-bold text-white">{formatCurrency(comparison.parceria.netIncome)}/ano líquido</div>
                                                <div className="text-sm text-red-400">Imposto: {formatCurrency(comparison.parceria.tax)}</div>
                                            </CardContent>
                                        </Card>

                                        {/* Economia */}
                                        <div className="md:col-span-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-white">Economia ao Escolher {comparison.recommendation === 'PARCERIA' ? 'Parceria' : 'Arrendamento'}</h4>
                                                <p className="text-sm text-slate-400">
                                                    {comparison.recommendation === 'PARCERIA'
                                                        ? 'A tributação rural (20% da receita) ganha do aluguel PF (até 27.5%).'
                                                        : 'Para seu perfil, o aluguel fixo tem menor carga tributária.'}
                                                </p>
                                            </div>
                                            <div className="text-3xl font-bold text-emerald-400">
                                                {formatCurrency(comparison.savings)}/ano
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </>
    );
}
