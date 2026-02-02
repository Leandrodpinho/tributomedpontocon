"use client";

import { useState } from "react";
import { ArrowLeft, Building2, ChevronRight, FileCheck, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { HoldingDiagnosisState } from "@/types/holding";
import { AssetGrid } from "@/components/holding/asset-grid";
import { FamilyForm } from "@/components/holding/family-form";
import { GovernanceForm } from "@/components/holding/governance-form";
import { ComplianceStep } from "@/components/holding/compliance-step";
import { calculateHoldingScenario, calculateHoldingProjections } from "@/lib/holding-calculator";
import { generateFamilyProtocol, generateAssetIntegrationList } from "@/lib/doc-engine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

export default function HoldingPage() {
    const [state, setState] = useState<HoldingDiagnosisState>({
        family: [],
        assets: [],
        liabilities: [],
        governance: {
            allowInLaws: false,
            forcedMediation: true,
            saleApprovalRatio: 75,
            mandatoryDividend: 25,
            managementSuccession: 'VOTE'
        },
        compliance: {
            federalDebt: true,
            laborDebt: true,
            propertyDeeds: true,
            environmentalRisk: true,
            tenantContracts: true
        },
        financial: {
            appreciationRate: 5,
            vacancyRate: 10,
            maintenanceCost: 1,
            adminCost: 1200 // R$ 1200 mensal de contador
        },
        step: 1
    });

    const nextStep = () => setState(prev => ({ ...prev, step: prev.step + 1 }));
    const prevStep = () => setState(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));

    // Cálculo Dinâmico
    const totalMarket = state.assets.reduce((sum, a) => sum + a.marketValue, 0);
    const totalBook = state.assets.reduce((sum, a) => sum + a.bookValue, 0);
    const totalRent = state.assets.reduce((sum, a) => sum + (a.rentalIncome || 0), 0);

    const analysis = calculateHoldingScenario({
        estateValueMarket: totalMarket,
        estateValueBook: totalBook,
        rentalIncome: totalRent,
        state: 'SP',
        heirs: state.family.filter(m => m.role === 'HEIR').length || 1
    });

    const projections = calculateHoldingProjections(totalMarket, totalRent, {
        appreciation: state.financial.appreciationRate,
        vacancy: state.financial.vacancyRate,
        maintenance: state.financial.maintenanceCost,
        admin: state.financial.adminCost
    });

    const totalProjectedProfit = projections.reduce((acc, year) => acc + year.netIncome, 0);

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-white font-sans selection:bg-amber-500/30">

            {/* Header */}
            <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-white/5 bg-slate-950/80 px-6 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => window.location.href = '/'} className="text-slate-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold flex items-center gap-2 text-amber-500">
                            <Building2 className="h-5 w-5" />
                            Holding Patrimonial 4.0
                        </h1>
                        <p className="text-xs text-slate-500">Sistema Completo de Gestão Patrimonial (ERP)</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="hidden md:flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(step => (
                        <div key={step} className={`h-2 w-8 rounded-full transition-colors ${state.step >= step ? 'bg-amber-500' : 'bg-slate-800'}`} />
                    ))}
                </div>
            </header>

            <main className="container mx-auto px-6 py-10 max-w-5xl">

                {/* Step 1: Família */}
                {state.step === 1 && (
                    <div className="animate-in slide-in-from-right-8 duration-500 space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">Quem vamos proteger?</h2>
                            <p className="text-slate-400">Mapeie a estrutura familiar para identificar herdeiros e riscos de conflito.</p>
                        </div>
                        <FamilyForm
                            members={state.family}
                            onChange={members => setState(prev => ({ ...prev, family: members }))}
                        />
                        <div className="flex justify-end pt-8">
                            <Button onClick={nextStep} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8">Próximo</Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Inventário */}
                {state.step === 2 && (
                    <div className="animate-in slide-in-from-right-8 duration-500 space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">Inventário Patrimonial</h2>
                            <p className="text-slate-400">Liste os bens para calcularmos o "Gap Sucessório".</p>
                        </div>
                        <AssetGrid
                            assets={state.assets}
                            onChange={assets => setState(prev => ({ ...prev, assets: assets }))}
                        />
                        <div className="flex justify-between pt-8">
                            <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                            <Button onClick={nextStep} disabled={state.assets.length === 0} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8">Próximo</Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Governança */}
                {state.step === 3 && (
                    <div className="animate-in slide-in-from-right-8 duration-500 space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">Regras da Família</h2>
                            <p className="text-slate-400">Defina o "Acordo de Sócios" preventivo.</p>
                        </div>
                        <GovernanceForm
                            rules={state.governance}
                            onChange={rules => setState(prev => ({ ...prev, governance: rules }))}
                        />
                        <div className="flex justify-between pt-8">
                            <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                            <Button onClick={nextStep} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8">Próximo</Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Compliance (NOVO) */}
                {state.step === 4 && (
                    <div className="animate-in slide-in-from-right-8 duration-500 space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">Due Diligence & Compliance</h2>
                            <p className="text-slate-400">Checklist de segurança jurídica para blindagem efetiva.</p>
                        </div>
                        <ComplianceStep
                            data={state.compliance}
                            onChange={comp => setState(prev => ({ ...prev, compliance: comp }))}
                        />
                        <div className="flex justify-between pt-8">
                            <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                            <Button onClick={nextStep} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8">
                                Gerar Dossiê Final 🚀
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 5: Relatório Final */}
                {state.step === 5 && (
                    <div className="animate-in zoom-in-95 duration-500 space-y-8">
                        <Tabs defaultValue="diagnosis" className="w-full">
                            <TabsList className="bg-slate-900 border border-white/10 w-full justify-start">
                                <TabsTrigger value="diagnosis">Diagnóstico & ROI</TabsTrigger>
                                <TabsTrigger value="financial" className="text-emerald-400">Projeção Financeira</TabsTrigger>
                                <TabsTrigger value="docs" className="text-amber-400">Minutas Jurídicas</TabsTrigger>
                            </TabsList>

                            {/* ABA 1: DIAGNÓSTICO GERAL */}
                            <TabsContent value="diagnosis" className="space-y-8 mt-6">
                                {/* Alerta de Viabilidade */}
                                {!analysis.holdingWorthIt && (
                                    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
                                        <span className="text-xl">⚠️</span>
                                        <div>
                                            <p className="font-semibold text-amber-400">Holding pode não ser vantajosa para este perfil</p>
                                            <p className="text-sm text-slate-400">
                                                A economia mensal é insuficiente para compensar os custos de manutenção.
                                                Avalie se o benefício sucessório justifica a estrutura.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <Card className="md:col-span-12 border-amber-500/30 bg-gradient-to-br from-slate-900 to-slate-950">
                                    <CardHeader>
                                        <CardTitle className="text-amber-500">Resumo da Viabilidade</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-8 md:grid-cols-4">
                                        <div className="space-y-1">
                                            <span className="text-xs text-slate-500 uppercase">Lucro Projetado (10 Anos)</span>
                                            <div className="text-3xl font-bold text-emerald-400">{formatCurrency(totalProjectedProfit)}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-slate-500 uppercase">Economia Sucessória</span>
                                            <div className="text-3xl font-bold text-emerald-400">{formatCurrency(analysis.savings.successionAmount)}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-slate-500 uppercase">Breakeven (Anos)</span>
                                            <div className={`text-3xl font-bold ${analysis.breakevenYears && analysis.breakevenYears < 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {analysis.breakevenYears !== null ? `${analysis.breakevenYears} anos` : '∞'}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs text-slate-500 uppercase">Economia Mensal</span>
                                            <div className={`text-3xl font-bold ${analysis.savings.monthlyAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {analysis.savings.monthlyAmount >= 0 ? '+' : ''}{formatCurrency(analysis.savings.monthlyAmount)}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {analysis.savings.monthlyAmount < 0 ? 'PF é mais barato' : 'Holding é mais barata'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-white/10 bg-white/5">
                                    <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
                                        <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900">
                                            <span className="text-slate-400">Custo Anual Holding (Est.)</span>
                                            <span className="font-bold text-white">{formatCurrency(analysis.annualHoldingCost)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900">
                                            <span className="text-slate-400">Status de Compliance</span>
                                            <span className={`font-bold ${Object.values(state.compliance).some(v => !v) ? 'text-amber-400' : 'text-blue-400'}`}>
                                                {Object.values(state.compliance).some(v => !v) ? '⚠️ Pendências' : '✅ 100% Regular'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* ABA 2: FINANCEIRO (NOVO) */}
                            <TabsContent value="financial" className="mt-6">
                                <Card className="border-white/10 bg-white/5">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-emerald-400">
                                            <TrendingUp className="h-5 w-5" /> Fluxo de Caixa (10 Anos)
                                        </CardTitle>
                                        <CardDescription>DRE Projetado considerando Receitas, Impostos e Custo Administrativo.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="rounded-md border border-white/10 overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-900 text-slate-400 font-medium">
                                                    <tr>
                                                        <th className="p-3">Ano</th>
                                                        <th className="p-3 text-right">Patrimônio</th>
                                                        <th className="p-3 text-right">Receita Bruta</th>
                                                        <th className="p-3 text-right text-red-400">Impostos</th>
                                                        <th className="p-3 text-right text-red-400">Custos</th>
                                                        <th className="p-3 text-right text-emerald-400">Lucro Líq.</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {projections.map(year => (
                                                        <tr key={year.year} className="hover:bg-white/5">
                                                            <td className="p-3 text-slate-300">{year.year}º</td>
                                                            <td className="p-3 text-right text-slate-400">{formatCurrency(year.propertyValue)}</td>
                                                            <td className="p-3 text-right text-white">{formatCurrency(year.rentalIncome)}</td>
                                                            <td className="p-3 text-right text-red-400/80">-{formatCurrency(year.taxes)}</td>
                                                            <td className="p-3 text-right text-red-400/80">-{formatCurrency(year.maintenanceCost)}</td>
                                                            <td className="p-3 text-right font-bold text-emerald-400">{formatCurrency(year.netIncome)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* ABA 3: DOCUMENTOS (JÁ EXISTENTE) */}
                            <TabsContent value="docs" className="space-y-6 mt-6">
                                <div className="grid md:grid-cols-2 gap-6 h-[500px]">
                                    <Card className="border-white/10 bg-white/5 flex flex-col">
                                        <CardHeader>
                                            <CardTitle className="text-amber-400 flex items-center gap-2">
                                                <FileCheck className="h-5 w-5" /> Protocolo Familiar
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-1 min-h-0">
                                            <ScrollArea className="h-full rounded-md border border-white/10 bg-slate-950 p-4">
                                                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                                                    {generateFamilyProtocol(state)}
                                                </pre>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-white/10 bg-white/5 flex flex-col">
                                        <CardHeader>
                                            <CardTitle className="text-blue-400 flex items-center gap-2">
                                                <FileText className="h-5 w-5" /> Integralização de Capital
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-1 min-h-0">
                                            <ScrollArea className="h-full rounded-md border border-white/10 bg-slate-900 p-4">
                                                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                                                    {generateAssetIntegrationList(state)}
                                                </pre>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>


                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={prevStep} className="text-slate-400 hover:text-white">
                                Revisar Configurações
                            </Button>
                            <Button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-700 text-white border border-white/10">
                                🖨️ Imprimir Dossiê Completo
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
