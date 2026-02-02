"use client";

import { useState } from "react";
import { ArrowLeft, Calculator, Fuel, ShoppingCart, Store, TrendingDown, Droplets, Package, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { calculateLucroPresumido } from "@/lib/tax-engine/calculators/lucro-presumido-real";
import { calculateSimplesNacional } from "@/lib/tax-engine/calculators/simples-nacional";
import { calculatePumpMargin, analyzeConvenienceStore, calculateIcmsST } from "@/lib/tax-engine/calculators/icms-st";
import { SectorPresentation, SectorAnalysis } from "@/components/dashboard/sector-presentation";
import { ReformImpactCard } from "@/components/dashboard/reform-impact-card";

export default function VarejoPage() {
    // Inputs para cada aba
    const [regimeInputs, setRegimeInputs] = useState({
        monthlyRevenue: 150000,
        payroll: 20000,
        sector: 'general' as 'general' | 'gas_station' | 'supermarket',
        icmsRate: 18
    });

    const [pumpInputs, setPumpInputs] = useState({
        costPerLiter: 5.50,
        sellingPricePerLiter: 5.99,
        icmsPerLiter: 1.37,
        isEthanol: false
    });

    const [convenienceInputs, setConvenienceInputs] = useState({
        fuelRevenueMonthly: 500000,
        storeRevenueMonthly: 80000,
        isSeparateCNPJ: false
    });

    // Results
    const [regimeResult, setRegimeResult] = useState<any>(null);
    const [pumpResult, setPumpResult] = useState<ReturnType<typeof calculatePumpMargin> | null>(null);
    const [convenienceResult, setConvenienceResult] = useState<ReturnType<typeof analyzeConvenienceStore> | null>(null);
    const [showPresentation, setShowPresentation] = useState(false);

    const handleRegimeCalculate = () => {
        const simples = calculateSimplesNacional(
            regimeInputs.monthlyRevenue * 12,
            regimeInputs.monthlyRevenue,
            'I'
        );

        const useMonofasico = regimeInputs.sector === 'gas_station';
        const lpOptimized = calculateLucroPresumido(
            regimeInputs.monthlyRevenue,
            useMonofasico ? 'ComercioMonofasico' : 'Comercio',
            0,
            regimeInputs.icmsRate
        );

        setRegimeResult({
            simples: { tax: simples.totalTax, rate: simples.effectiveRate },
            presumido: { tax: lpOptimized.totalTax, rate: lpOptimized.effectiveRate },
            isMonofasico: useMonofasico
        });
    };

    const handlePumpCalculate = () => {
        const result = calculatePumpMargin(pumpInputs);
        setPumpResult(result);
    };

    const handleConvenienceCalculate = () => {
        const result = analyzeConvenienceStore(convenienceInputs);
        setConvenienceResult(result);
    };

    return (
        <>
            {/* Presentation Modal */}
            {showPresentation && regimeResult && (
                <SectorPresentation
                    analysis={{
                        sectorName: 'Varejo & Postos',
                        clientName: regimeInputs.sector === 'gas_station' ? 'Posto de Combustível' : 'Comércio Varejista',
                        consultingFirm: 'Tributo.Med',
                        scenarios: [
                            {
                                name: 'Simples Nacional (Anexo I)',
                                totalTax: regimeResult.simples.tax,
                                effectiveRate: regimeResult.simples.rate,
                                isRecommended: regimeResult.simples.tax < regimeResult.presumido.tax
                            },
                            {
                                name: regimeResult.isMonofasico ? 'Lucro Presumido (Monofásico)' : 'Lucro Presumido',
                                totalTax: regimeResult.presumido.tax,
                                effectiveRate: regimeResult.presumido.rate,
                                isRecommended: regimeResult.presumido.tax < regimeResult.simples.tax,
                                notes: regimeResult.isMonofasico ? 'PIS/COFINS zerado na revenda de combustíveis.' : undefined
                            }
                        ],
                        monthlySavings: Math.abs(regimeResult.simples.tax - regimeResult.presumido.tax),
                        annualSavings: Math.abs(regimeResult.simples.tax - regimeResult.presumido.tax) * 12,
                        extraMetrics: [
                            { label: 'Faturamento Mensal', value: regimeInputs.monthlyRevenue }
                        ]
                    }}
                    onClose={() => setShowPresentation(false)}
                />
            )}
            <div className="flex min-h-screen flex-col bg-slate-950 text-white font-sans selection:bg-violet-500/30">

                {/* Header */}
                <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-white/5 bg-slate-950/80 px-6 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => window.location.href = '/'} className="text-slate-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold flex items-center gap-2 text-violet-400">
                                <ShoppingCart className="h-5 w-5" />
                                Varejo & Postos (Expert)
                            </h1>
                            <p className="text-xs text-slate-500">Monofásico, ICMS-ST e Preço de Bomba</p>
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-6 py-10 max-w-6xl">

                    <Tabs defaultValue="regime" className="w-full">
                        <TabsList className="bg-slate-900 border border-white/10 w-full justify-start mb-6">
                            <TabsTrigger value="regime" className="text-violet-400">Regime Tributário</TabsTrigger>
                            <TabsTrigger value="pump" className="text-amber-400">Preço de Bomba ⛽</TabsTrigger>
                            <TabsTrigger value="convenience" className="text-emerald-400">Loja Conveniência</TabsTrigger>
                        </TabsList>

                        {/* TAB 1: REGIME TRIBUTÁRIO */}
                        <TabsContent value="regime" className="grid gap-8 lg:grid-cols-12">
                            <section className="lg:col-span-4 space-y-6">
                                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-white">Dados da Empresa</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Setor de Atuação</Label>
                                            <Select value={regimeInputs.sector} onValueChange={(v: any) => setRegimeInputs(prev => ({ ...prev, sector: v }))}>
                                                <SelectTrigger className="bg-slate-900/50 border-white/10 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                                    <SelectItem value="general">Comércio Geral (Varejo)</SelectItem>
                                                    <SelectItem value="supermarket">Supermercado / Mercearia</SelectItem>
                                                    <SelectItem value="gas_station">Posto de Combustíveis ⛽</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {regimeInputs.sector === 'gas_station' && (
                                                <p className="text-xs text-emerald-400 flex items-center gap-1">
                                                    <TrendingDown className="h-3 w-3" /> Regime Monofásico detectado
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Faturamento Mensal</Label>
                                            <Input type="number" value={regimeInputs.monthlyRevenue} onChange={(e) => setRegimeInputs(prev => ({ ...prev, monthlyRevenue: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Alíquota ICMS (%)</Label>
                                            <Input type="number" value={regimeInputs.icmsRate} onChange={(e) => setRegimeInputs(prev => ({ ...prev, icmsRate: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white" />
                                        </div>

                                        <Button onClick={handleRegimeCalculate} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold mt-4">
                                            <Calculator className="h-4 w-4 mr-2" /> Comparar Regimes
                                        </Button>
                                    </CardContent>
                                </Card>
                            </section>

                            <section className="lg:col-span-8">
                                {!regimeResult ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 min-h-[300px] border-2 border-dashed border-white/5 rounded-2xl">
                                        <Store className="h-16 w-16 opacity-20" />
                                        <p>Escolha o setor para ver a análise.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 animate-in fade-in duration-500">
                                        <Card className="bg-white/5 border-white/10">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base text-slate-200">Simples Nacional</CardTitle>
                                                <CardDescription className="text-xs text-slate-400">Anexo I Progressivo</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-white">{formatCurrency(regimeResult.simples.tax)}</div>
                                                <div className="text-sm text-slate-500">{regimeResult.simples.rate.toFixed(2)}% efetivo</div>
                                            </CardContent>
                                        </Card>

                                        <Card className={`border-violet-500/20 ${regimeResult.isMonofasico ? 'bg-violet-500/10' : 'bg-white/5'}`}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base text-violet-300 flex justify-between">
                                                    Lucro Presumido
                                                    {regimeResult.isMonofasico && <span className="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">Monofásico</span>}
                                                </CardTitle>
                                                <CardDescription className="text-xs text-slate-400">{regimeResult.isMonofasico ? 'PIS/COFINS Zero na revenda' : 'Regime Geral'}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-white">{formatCurrency(regimeResult.presumido.tax)}</div>
                                                <div className="text-sm text-slate-500">{regimeResult.presumido.rate.toFixed(2)}% efetivo</div>
                                            </CardContent>
                                        </Card>

                                        {/* Tax Reform Impact */}
                                        <div className="md:col-span-2">
                                            <ReformImpactCard
                                                currentMonthlyTax={regimeResult.simples.tax < regimeResult.presumido.tax ? regimeResult.simples.tax : regimeResult.presumido.tax}
                                                monthlyRevenue={regimeInputs.monthlyRevenue}
                                                sector={regimeInputs.sector === 'gas_station' ? 'COMMERCE' : 'COMMERCE'}
                                                isSimples={regimeResult.simples.tax < regimeResult.presumido.tax}
                                            />
                                        </div>

                                        {/* Presentation Button */}
                                        <Button
                                            onClick={() => setShowPresentation(true)}
                                            className="md:col-span-2 w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white font-bold"
                                        >
                                            <Presentation className="h-4 w-4 mr-2" /> Ver Apresentação Executiva
                                        </Button>
                                    </div>
                                )}
                            </section>
                        </TabsContent>

                        {/* TAB 2: PREÇO DE BOMBA */}
                        <TabsContent value="pump" className="grid gap-8 lg:grid-cols-12">
                            <section className="lg:col-span-4 space-y-6">
                                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-white flex items-center gap-2">
                                            <Fuel className="h-5 w-5 text-amber-500" />
                                            Simulador de Bomba
                                        </CardTitle>
                                        <CardDescription className="text-slate-400">Calcule a margem líquida por litro.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-slate-300">Custo por Litro (Distribuidora)</Label>
                                                    <span className="text-sm font-medium text-amber-400">{formatCurrency(pumpInputs.costPerLiter)}</span>
                                                </div>
                                                <Slider
                                                    value={[pumpInputs.costPerLiter]}
                                                    min={2}
                                                    max={8}
                                                    step={0.01}
                                                    onValueChange={(vals) => setPumpInputs(prev => ({ ...prev, costPerLiter: vals[0] }))}
                                                    className="py-1"
                                                />
                                                <Input type="number" step="0.01" value={pumpInputs.costPerLiter} onChange={(e) => setPumpInputs(prev => ({ ...prev, costPerLiter: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white hidden" />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-slate-300">Preço na Bomba (R$/L)</Label>
                                                    <span className="text-sm font-medium text-emerald-400">{formatCurrency(pumpInputs.sellingPricePerLiter)}</span>
                                                </div>
                                                <Slider
                                                    value={[pumpInputs.sellingPricePerLiter]}
                                                    min={3}
                                                    max={10}
                                                    step={0.01}
                                                    onValueChange={(vals) => setPumpInputs(prev => ({ ...prev, sellingPricePerLiter: vals[0] }))}
                                                    className="py-1"
                                                />
                                                <Input type="number" step="0.01" value={pumpInputs.sellingPricePerLiter} onChange={(e) => setPumpInputs(prev => ({ ...prev, sellingPricePerLiter: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white hidden" />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-slate-300">ICMS Fixo (R$/L) - CONFAZ</Label>
                                                <Input type="number" step="0.01" value={pumpInputs.icmsPerLiter} onChange={(e) => setPumpInputs(prev => ({ ...prev, icmsPerLiter: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white" />
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <Label className="text-slate-300">É Etanol?</Label>
                                                <Switch checked={pumpInputs.isEthanol} onCheckedChange={c => setPumpInputs(prev => ({ ...prev, isEthanol: c }))} />
                                            </div>
                                        </div>

                                        <Button onClick={handlePumpCalculate} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold mt-2">
                                            <Droplets className="h-4 w-4 mr-2" /> Calcular Margem
                                        </Button>
                                    </CardContent>
                                </Card>
                            </section>

                            <section className="lg:col-span-8">
                                {!pumpResult ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 min-h-[300px] border-2 border-dashed border-white/5 rounded-2xl">
                                        <Fuel className="h-16 w-16 opacity-20" />
                                        <p>Simule para descobrir sua margem real por litro.</p>
                                    </div>
                                ) : (
                                    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-950 animate-in fade-in duration-500">
                                        <CardHeader>
                                            <CardTitle className="text-amber-400">Análise por Litro</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between border-b border-white/10 pb-2">
                                                    <span className="text-slate-400">Preço de Venda</span>
                                                    <span className="font-bold text-white">R$ {pumpInputs.sellingPricePerLiter.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">(-) Custo Distribuidora</span>
                                                    <span className="text-red-400">-R$ {pumpInputs.costPerLiter.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">(-) ICMS (CONFAZ)</span>
                                                    <span className="text-red-400">-R$ {pumpResult.icms.toFixed(2)}</span>
                                                </div>
                                                {!pumpInputs.isEthanol && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">(-) CIDE</span>
                                                        <span className="text-red-400">-R$ {pumpResult.cide.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>PIS/COFINS (Já na distribuidora)</span>
                                                    <span>R$ 0.00</span>
                                                </div>
                                                <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                                                    <span className="font-bold text-white text-base">(=) Margem Líquida/Litro</span>
                                                    <span className={`font-bold text-2xl ${pumpResult.netMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        R$ {pumpResult.netMargin.toFixed(2)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 text-right">
                                                    Margem: {pumpResult.netMarginPercent.toFixed(2)}% do preço de bomba
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </section>
                        </TabsContent>

                        {/* TAB 3: LOJA DE CONVENIÊNCIA */}
                        <TabsContent value="convenience" className="grid gap-8 lg:grid-cols-12">
                            <section className="lg:col-span-4 space-y-6">
                                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-white flex items-center gap-2">
                                            <Package className="h-5 w-5 text-emerald-500" />
                                            Posto + Conveniência
                                        </CardTitle>
                                        <CardDescription className="text-slate-400">Mesmo CNPJ ou separar?</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Receita Combustíveis (Mês)</Label>
                                            <Input type="number" value={convenienceInputs.fuelRevenueMonthly} onChange={(e) => setConvenienceInputs(prev => ({ ...prev, fuelRevenueMonthly: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Receita Loja (Mês)</Label>
                                            <Input type="number" value={convenienceInputs.storeRevenueMonthly} onChange={(e) => setConvenienceInputs(prev => ({ ...prev, storeRevenueMonthly: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white" />
                                        </div>
                                        <Button onClick={handleConvenienceCalculate} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold mt-4">
                                            <Calculator className="h-4 w-4 mr-2" /> Comparar Estruturas
                                        </Button>
                                    </CardContent>
                                </Card>
                            </section>

                            <section className="lg:col-span-8">
                                {!convenienceResult ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 min-h-[300px] border-2 border-dashed border-white/5 rounded-2xl">
                                        <Package className="h-16 w-16 opacity-20" />
                                        <p>Simule para ver se vale separar a loja em outro CNPJ.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 animate-in fade-in duration-500">
                                        <Card className={`border-white/10 ${convenienceResult.recommendation === 'COMBINED' ? 'bg-emerald-900/20 ring-1 ring-emerald-500/50' : 'bg-white/5'}`}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base text-slate-200 flex justify-between">
                                                    Mesmo CNPJ
                                                    {convenienceResult.recommendation === 'COMBINED' && <span className="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-0.5 rounded-full">Recomendado</span>}
                                                </CardTitle>
                                                <CardDescription className="text-xs text-slate-400">Lucro Presumido Misto</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-white">{formatCurrency(convenienceResult.combinedScenario.totalTax)}/mês</div>
                                                <div className="text-sm text-slate-500">{convenienceResult.combinedScenario.effective.toFixed(2)}% efetivo</div>
                                            </CardContent>
                                        </Card>

                                        <Card className={`border-white/10 ${convenienceResult.recommendation === 'SEPARATED' ? 'bg-violet-900/20 ring-1 ring-violet-500/50' : 'bg-white/5'}`}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base text-slate-200 flex justify-between">
                                                    CNPJs Separados
                                                    {convenienceResult.recommendation === 'SEPARATED' && <span className="text-violet-400 text-xs bg-violet-400/10 px-2 py-0.5 rounded-full">Recomendado</span>}
                                                </CardTitle>
                                                <CardDescription className="text-xs text-slate-400">Posto LP + Loja Simples</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-white">{formatCurrency(convenienceResult.separatedScenario.totalTax)}/mês</div>
                                                <div className="text-sm text-slate-500">{convenienceResult.separatedScenario.effective.toFixed(2)}% efetivo</div>
                                            </CardContent>
                                        </Card>

                                        {convenienceResult.savings > 0 && (
                                            <div className="md:col-span-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 p-6 flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-lg font-bold text-white">Economia Potencial</h4>
                                                    <p className="text-sm text-slate-400">Ao {convenienceResult.recommendation === 'SEPARATED' ? 'separar' : 'manter junto'} os CNPJs.</p>
                                                </div>
                                                <div className="text-3xl font-bold text-emerald-400">
                                                    {formatCurrency(convenienceResult.savings)}/mês
                                                </div>
                                            </div>
                                        )}
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
