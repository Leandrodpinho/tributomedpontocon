"use client";

import { useState } from "react";
import { ArrowLeft, Briefcase, Calculator, Code2, Scale, Zap, DollarSign, Users, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { calculateSimplesNacional } from "@/lib/tax-engine/calculators/simples-nacional";
import { calculateLucroPresumido } from "@/lib/tax-engine/calculators/lucro-presumido-real";
import { optimizeFatorR, compareDividendVsSalary } from "@/lib/tax-engine/calculators/payroll";
import { SectorPresentation, SectorAnalysis } from "@/components/dashboard/sector-presentation";
import { ReformImpactCard } from "@/components/dashboard/reform-impact-card";

export default function ServicesPage() {
    // Regime Inputs
    const [regimeInputs, setRegimeInputs] = useState({
        monthlyRevenue: 50000,
        payroll: 15000,
        partners: 2,
        type: 'tech' as 'tech' | 'legal' | 'engineering',
        isSUP: false
    });

    // Fator R Inputs
    const [fatorRInputs, setFatorRInputs] = useState({
        monthlyRevenue: 50000,
        currentPayroll: 10000
    });

    // Dividend Inputs
    const [dividendInputs, setDividendInputs] = useState({
        targetNetIncome: 20000,
        isSimples: true,
        anexo: 'III' as 'III' | 'IV' | 'V'
    });

    // Results
    const [regimeResult, setRegimeResult] = useState<any>(null);
    const [fatorRResult, setFatorRResult] = useState<ReturnType<typeof optimizeFatorR> | null>(null);
    const [dividendResult, setDividendResult] = useState<ReturnType<typeof compareDividendVsSalary> | null>(null);
    const [showPresentation, setShowPresentation] = useState(false);

    const handleRegimeCalculate = () => {
        const rFactor = regimeInputs.payroll / regimeInputs.monthlyRevenue;
        let targetAnexo = rFactor >= 0.28 ? 'III' : 'V';
        if (regimeInputs.type === 'legal') targetAnexo = 'IV';

        const simples = calculateSimplesNacional(regimeInputs.monthlyRevenue * 12, regimeInputs.monthlyRevenue, targetAnexo as any);
        let simplesTotal = simples.totalTax;
        if (regimeInputs.type === 'legal') {
            simplesTotal += regimeInputs.payroll * 0.20; // CPP patronal Anexo IV
        }

        const issRate = regimeInputs.isSUP ? 0 : 5;
        const fixedISS = regimeInputs.isSUP ? (regimeInputs.partners * 200) : 0;
        const lp = calculateLucroPresumido(regimeInputs.monthlyRevenue, 'Geral', issRate, 0);
        const presumidoTotal = lp.totalTax + fixedISS;

        setRegimeResult({
            simples: { tax: simplesTotal, rate: (simplesTotal / regimeInputs.monthlyRevenue) * 100, anexo: targetAnexo },
            presumido: { tax: presumidoTotal, rate: (presumidoTotal / regimeInputs.monthlyRevenue) * 100, isSUP: regimeInputs.isSUP },
            fatorR: rFactor * 100,
            best: simplesTotal < presumidoTotal ? 'SIMPLES' : 'PRESUMIDO'
        });
    };

    const handleFatorRCalculate = () => {
        const result = optimizeFatorR(fatorRInputs);
        setFatorRResult(result);
    };

    const handleDividendCalculate = () => {
        const result = compareDividendVsSalary(dividendInputs);
        setDividendResult(result);
    };

    return (
        <>
            {/* Presentation Modal */}
            {showPresentation && regimeResult && (
                <SectorPresentation
                    analysis={{
                        sectorName: 'Serviços & Tech',
                        clientName: regimeInputs.type === 'tech' ? 'Empresa de TI' : regimeInputs.type === 'legal' ? 'Escritório de Advocacia' : 'Engenharia',
                        consultingFirm: 'Tributo.Med',
                        scenarios: [
                            {
                                name: `Simples Nacional (Anexo ${regimeResult.simples.anexo})`,
                                totalTax: regimeResult.simples.tax,
                                effectiveRate: regimeResult.simples.rate,
                                isRecommended: regimeResult.best === 'SIMPLES',
                                notes: regimeResult.fatorR >= 28 ? 'Fator R atingido! Anexo III aplicável.' : 'Anexo V (Fator R < 28%).'
                            },
                            {
                                name: regimeResult.presumido.isSUP ? 'Lucro Presumido (SUP)' : 'Lucro Presumido',
                                totalTax: regimeResult.presumido.tax,
                                effectiveRate: regimeResult.presumido.rate,
                                isRecommended: regimeResult.best === 'PRESUMIDO',
                                notes: regimeResult.presumido.isSUP ? 'Sociedade Uniprofissional - ISS Fixo.' : undefined
                            }
                        ],
                        monthlySavings: Math.abs(regimeResult.simples.tax - regimeResult.presumido.tax),
                        annualSavings: Math.abs(regimeResult.simples.tax - regimeResult.presumido.tax) * 12,
                        extraMetrics: [
                            { label: 'Fator R', value: `${regimeResult.fatorR.toFixed(1)}%`, highlight: regimeResult.fatorR >= 28 },
                            { label: 'Faturamento Mensal', value: regimeInputs.monthlyRevenue }
                        ]
                    }}
                    onClose={() => setShowPresentation(false)}
                />
            )}
            <div className="flex min-h-screen flex-col bg-slate-950 text-white font-sans selection:bg-cyan-500/30">

                {/* Header */}
                <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-white/5 bg-slate-950/80 px-6 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => window.location.href = '/'} className="text-slate-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
                                <Code2 className="h-5 w-5" />
                                Serviços & Tech (Expert)
                            </h1>
                            <p className="text-xs text-slate-500">Fator R, Pró-Labore e Dividendos</p>
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-6 py-10 max-w-6xl">

                    <Tabs defaultValue="regime" className="w-full">
                        <TabsList className="bg-slate-900 border border-white/10 w-full justify-start mb-6">
                            <TabsTrigger value="regime" className="text-cyan-400">Regime Tributário</TabsTrigger>
                            <TabsTrigger value="fatorr" className="text-emerald-400">Otimizador Fator R</TabsTrigger>
                            <TabsTrigger value="dividend" className="text-amber-400">Dividendos vs Salário</TabsTrigger>
                        </TabsList>

                        {/* TAB 1: REGIME */}
                        <TabsContent value="regime" className="grid gap-8 lg:grid-cols-12">
                            <section className="lg:col-span-4 space-y-6">
                                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-white">Perfil do Profissional</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Área de Atuação</Label>
                                            <Select value={regimeInputs.type} onValueChange={(v: any) => setRegimeInputs(prev => ({ ...prev, type: v }))}>
                                                <SelectTrigger className="bg-slate-900/50 border-white/10 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                                    <SelectItem value="tech">Tecnologia (TI / Dev)</SelectItem>
                                                    <SelectItem value="legal">Advocacia</SelectItem>
                                                    <SelectItem value="engineering">Engenharia / Arquitetura</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Faturamento Mensal</Label>
                                            <Input type="number" value={regimeInputs.monthlyRevenue} onChange={(e) => setRegimeInputs(prev => ({ ...prev, monthlyRevenue: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Folha de Pagamento</Label>
                                            <Input type="number" value={regimeInputs.payroll} onChange={(e) => setRegimeInputs(prev => ({ ...prev, payroll: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white" />
                                            <p className="text-xs text-slate-500">Essencial para Fator R.</p>
                                        </div>

                                        {(regimeInputs.type === 'legal' || regimeInputs.type === 'engineering') && (
                                            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/30 p-3">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base text-white">Sociedade Uniprofissional?</Label>
                                                    <p className="text-xs text-slate-400">ISS Fixo anual</p>
                                                </div>
                                                <Switch checked={regimeInputs.isSUP} onCheckedChange={(c) => setRegimeInputs(prev => ({ ...prev, isSUP: c }))} />
                                            </div>
                                        )}

                                        <Button onClick={handleRegimeCalculate} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold mt-4">
                                            <Calculator className="h-4 w-4 mr-2" /> Analisar Oportunidade
                                        </Button>
                                    </CardContent>
                                </Card>
                            </section>

                            <section className="lg:col-span-8">
                                {!regimeResult ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 min-h-[300px] border-2 border-dashed border-white/5 rounded-2xl">
                                        <Briefcase className="h-16 w-16 opacity-20" />
                                        <p>Simule Fator R e ISS Fixo para ver a economia.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in duration-500">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Card className={`border-white/10 ${regimeResult.best === 'SIMPLES' ? 'bg-cyan-900/20 ring-1 ring-cyan-500/50' : 'bg-white/5'}`}>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-base text-cyan-300 flex justify-between">
                                                        Simples Nacional
                                                        {regimeResult.best === 'SIMPLES' && <span className="text-cyan-400 text-xs bg-cyan-400/10 px-2 py-0.5 rounded-full">Melhor Opção</span>}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs text-slate-400">Anexo {regimeResult.simples.anexo} (Fator R: {regimeResult.fatorR.toFixed(1)}%)</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold text-white">{formatCurrency(regimeResult.simples.tax)}</div>
                                                    <div className="text-sm text-slate-500">{regimeResult.simples.rate.toFixed(2)}% efetivo</div>
                                                </CardContent>
                                            </Card>

                                            <Card className={`border-white/10 ${regimeResult.best === 'PRESUMIDO' ? 'bg-blue-900/20 ring-1 ring-blue-500/50' : 'bg-white/5'}`}>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-base text-blue-300 flex justify-between">
                                                        Lucro Presumido
                                                        {regimeResult.best === 'PRESUMIDO' && <span className="text-blue-400 text-xs bg-blue-400/10 px-2 py-0.5 rounded-full">Melhor Opção</span>}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs text-slate-400">{regimeResult.presumido.isSUP ? 'ISS Fixo (SUP)' : 'ISS 5%'}</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold text-white">{formatCurrency(regimeResult.presumido.tax)}</div>
                                                    <div className="text-sm text-slate-500">{regimeResult.presumido.rate.toFixed(2)}% efetivo</div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {regimeResult.fatorR >= 28 && regimeResult.best === 'SIMPLES' && (
                                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
                                                <Zap className="h-6 w-6 text-emerald-400" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-emerald-300">Fator R Atingido!</h4>
                                                    <p className="text-xs text-emerald-200/70">Sua folha permitiu enquadrar no Anexo III (6%) em vez do Anexo V (15.5%).</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tax Reform Impact */}
                                        <ReformImpactCard
                                            currentMonthlyTax={regimeResult.best === 'SIMPLES' ? regimeResult.simples.tax : regimeResult.presumido.tax}
                                            monthlyRevenue={regimeInputs.monthlyRevenue}
                                            sector={regimeInputs.type === 'tech' ? 'SERVICE' : regimeInputs.type === 'legal' ? 'SERVICE' : 'SERVICE'}
                                            isSimples={regimeResult.best === 'SIMPLES'}
                                        />

                                        {/* Presentation Button */}
                                        <Button
                                            onClick={() => setShowPresentation(true)}
                                            className="w-full bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-700 hover:to-violet-700 text-white font-bold"
                                        >
                                            <Presentation className="h-4 w-4 mr-2" /> Ver Apresentação Executiva
                                        </Button>
                                    </div>
                                )}
                            </section>
                        </TabsContent>

                        {/* TAB 2: FATOR R OPTIMIZER */}
                        <TabsContent value="fatorr" className="grid gap-8 lg:grid-cols-12">
                            <section className="lg:col-span-4 space-y-6">
                                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-white flex items-center gap-2">
                                            <Users className="h-5 w-5 text-emerald-500" />
                                            Otimizador Fator R
                                        </CardTitle>
                                        <CardDescription className="text-slate-400">Descubra quanto falta para atingir 28%.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-slate-300">Faturamento Mensal</Label>
                                                    <span className="text-sm font-medium text-cyan-400">{formatCurrency(fatorRInputs.monthlyRevenue)}</span>
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={fatorRInputs.monthlyRevenue}
                                                    onChange={(e) => setFatorRInputs(prev => ({ ...prev, monthlyRevenue: Number(e.target.value) }))}
                                                    className="bg-slate-900/50 border-white/10 text-white hidden"
                                                />
                                                <Slider
                                                    value={[fatorRInputs.monthlyRevenue]}
                                                    min={1000}
                                                    max={200000}
                                                    step={1000}
                                                    onValueChange={(vals) => setFatorRInputs(prev => ({ ...prev, monthlyRevenue: vals[0] }))}
                                                    className="py-1"
                                                />
                                                <p className="text-xs text-slate-500">Arraste para ajustar o faturamento.</p>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-slate-300">Folha Atual (Mensal)</Label>
                                                    <span className="text-sm font-medium text-cyan-400">{formatCurrency(fatorRInputs.currentPayroll)}</span>
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={fatorRInputs.currentPayroll}
                                                    onChange={(e) => setFatorRInputs(prev => ({ ...prev, currentPayroll: Number(e.target.value) }))}
                                                    className="bg-slate-900/50 border-white/10 text-white hidden"
                                                />
                                                <Slider
                                                    value={[fatorRInputs.currentPayroll]}
                                                    min={0}
                                                    max={fatorRInputs.monthlyRevenue} // Max payroll shouldn't exceed revenue logically for this visualization
                                                    step={500}
                                                    onValueChange={(vals) => setFatorRInputs(prev => ({ ...prev, currentPayroll: vals[0] }))}
                                                    className="py-1"
                                                />
                                            </div>

                                            {/* Real-time Fator R Indicator */}
                                            <div className="pt-4 border-t border-white/10 space-y-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-white">Fator R Atual</span>
                                                    <span className={`text-lg font-bold ${(fatorRInputs.currentPayroll / fatorRInputs.monthlyRevenue) * 100 >= 28 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                        {((fatorRInputs.currentPayroll / fatorRInputs.monthlyRevenue) * 100 || 0).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={Math.min(100, ((fatorRInputs.currentPayroll / fatorRInputs.monthlyRevenue) * 100) * (100 / 28))}
                                                    className="h-2 bg-slate-800"
                                                // Note: Progress component typically takes simple classNames. Customizing filler color might require style or specific utility.
                                                // Shadcn Progress indicator class is usually hardcoded in component, let's trust default or wrapping div color.
                                                />
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>0%</span>
                                                    <span className="text-emerald-400 font-bold">Meta 28%</span>
                                                    <span>50%+</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button onClick={handleFatorRCalculate} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold mt-2">
                                            <Calculator className="h-4 w-4 mr-2" /> Analisar Detalhadamente
                                        </Button>
                                    </CardContent>
                                </Card>
                            </section>

                            <section className="lg:col-span-8">
                                {!fatorRResult ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 min-h-[300px] border-2 border-dashed border-white/5 rounded-2xl">
                                        <Users className="h-16 w-16 opacity-20" />
                                        <p>Descubra quanto precisa pagar de folha para economizar.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in duration-500">
                                        <Card className={`border-white/10 ${fatorRResult.isAnexoIII ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
                                            <CardHeader>
                                                <CardTitle className={`text-xl ${fatorRResult.isAnexoIII ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    Fator R Atual: {fatorRResult.currentFatorR}%
                                                </CardTitle>
                                                <CardDescription className="text-slate-400">
                                                    {fatorRResult.isAnexoIII ? '✅ Parabéns! Você está no Anexo III.' : '⚠️ Atenção! Você está no Anexo V (mais caro).'}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {!fatorRResult.isAnexoIII && (
                                                    <>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                                                                <span className="text-xs text-slate-400 block">Folha Necessária (Mensal)</span>
                                                                <span className="text-xl font-bold text-white">{formatCurrency(fatorRResult.minPayrollForAnexoIII)}</span>
                                                            </div>
                                                            <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                                                                <span className="text-xs text-slate-400 block">Gap (Falta Pagar)</span>
                                                                <span className="text-xl font-bold text-amber-400">{formatCurrency(fatorRResult.payrollGap)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 p-4">
                                                            <h4 className="font-bold text-white">Economia Potencial (por mês)</h4>
                                                            <p className="text-sm text-slate-400">Se aumentar a folha e migrar para Anexo III:</p>
                                                            <div className="text-2xl font-bold text-emerald-400 mt-2">{formatCurrency(fatorRResult.savings.potentialSavings)}</div>
                                                        </div>
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </section>
                        </TabsContent>

                        {/* TAB 3: DIVIDENDOS VS SALÁRIO */}
                        <TabsContent value="dividend" className="grid gap-8 lg:grid-cols-12">
                            <section className="lg:col-span-4 space-y-6">
                                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-white flex items-center gap-2">
                                            <DollarSign className="h-5 w-5 text-amber-500" />
                                            Retirada do Sócio
                                        </CardTitle>
                                        <CardDescription className="text-slate-400">Quanto quer receber líquido?</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Valor Líquido Desejado</Label>
                                            <Input type="number" value={dividendInputs.targetNetIncome} onChange={(e) => setDividendInputs(prev => ({ ...prev, targetNetIncome: Number(e.target.value) }))} className="bg-slate-900/50 border-white/10 text-white" />
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <Label className="text-slate-300">Empresa no Simples?</Label>
                                            <Switch checked={dividendInputs.isSimples} onCheckedChange={c => setDividendInputs(prev => ({ ...prev, isSimples: c }))} />
                                        </div>
                                        <Button onClick={handleDividendCalculate} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold mt-4">
                                            <Calculator className="h-4 w-4 mr-2" /> Comparar Estratégias
                                        </Button>
                                    </CardContent>
                                </Card>
                            </section>

                            <section className="lg:col-span-8">
                                {!dividendResult ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 min-h-[300px] border-2 border-dashed border-white/5 rounded-2xl">
                                        <DollarSign className="h-16 w-16 opacity-20" />
                                        <p>Descubra a forma mais barata de retirar dinheiro.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-3 animate-in fade-in duration-500">
                                        <Card className={`border-white/10 ${dividendResult.recommendation === 'ALL_SALARY' ? 'bg-cyan-900/20 ring-1 ring-cyan-500/50' : 'bg-white/5'}`}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base text-slate-200">Tudo Pró-Labore</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-xl font-bold text-white">{formatCurrency(dividendResult.allSalary.totalCost)}</div>
                                                <p className="text-xs text-slate-400 mt-1">Custo total para empresa</p>
                                            </CardContent>
                                        </Card>

                                        <Card className={`border-white/10 ${dividendResult.recommendation === 'ALL_DIVIDEND' ? 'bg-emerald-900/20 ring-1 ring-emerald-500/50' : 'bg-white/5'}`}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base text-slate-200">Tudo Dividendos</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-xl font-bold text-white">{formatCurrency(dividendResult.allDividend.totalCost)}</div>
                                                <p className="text-xs text-slate-400 mt-1">IR Isento (por enquanto)</p>
                                            </CardContent>
                                        </Card>

                                        <Card className={`border-white/10 ${dividendResult.recommendation === 'HYBRID' ? 'bg-amber-900/20 ring-1 ring-amber-500/50' : 'bg-white/5'}`}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base text-slate-200 flex justify-between">
                                                    Híbrido
                                                    {dividendResult.recommendation === 'HYBRID' && <span className="text-amber-400 text-xs bg-amber-400/10 px-2 py-0.5 rounded-full">Melhor</span>}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-xl font-bold text-white">{formatCurrency(dividendResult.hybrid.totalCost)}</div>
                                                <p className="text-xs text-slate-400 mt-1">1 SM Salário + Resto Dividendo</p>
                                            </CardContent>
                                        </Card>

                                        <div className="md:col-span-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 p-6 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-lg font-bold text-white">Economia Potencial</h4>
                                                <p className="text-sm text-slate-400">Escolhendo a melhor estratégia de retirada.</p>
                                            </div>
                                            <div className="text-3xl font-bold text-emerald-400">
                                                {formatCurrency(dividendResult.savings)}/mês
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
