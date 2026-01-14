import { GenerateTaxScenariosOutput } from "@/ai/flows/types";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { CheckCircle2, Building2, TrendingUp } from "lucide-react";
import { AnnualTimeline } from "./annual-timeline";

interface PrintLayoutProps {
    analysis: GenerateTaxScenariosOutput;
    clientName: string;
    consultingFirm: string;
}

export function PrintLayout({ analysis, clientName, consultingFirm }: PrintLayoutProps) {
    // Ordenar cenários pelo valor total de imposto para identificar melhor e pior
    const sortedScenarios = [...analysis.scenarios].sort((a, b) => (a.totalTaxValue ?? 0) - (b.totalTaxValue ?? 0));

    const bestScenario = sortedScenarios[0];
    const worstScenario = sortedScenarios[sortedScenarios.length - 1];

    const monthlySavings = (worstScenario?.totalTaxValue ?? 0) - (bestScenario?.totalTaxValue ?? 0);
    const scenarios = analysis.scenarios;
    const year = new Date().getFullYear();

    return (
        <div className="hidden print:block font-sans text-black bg-white">
            {/* CAPA */}
            <div className="h-screen flex flex-col justify-between p-0 break-after-page text-center relative overflow-hidden bg-slate-900 text-white">
                {/* Background Shapes */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

                <div className="relative z-10 flex flex-col h-full p-16">
                    <div className="pt-20">
                        <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl mx-auto flex items-center justify-center mb-12 shadow-2xl border border-white/20">
                            <Building2 className="w-12 h-12 text-emerald-400" />
                        </div>
                        <p className="text-emerald-400 uppercase tracking-[0.3em] text-sm font-semibold mb-4">Relatório Confidencial</p>
                        <h1 className="text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
                            Planejamento<br />Tributário {year}
                        </h1>
                        <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 mx-auto rounded-full mb-8"></div>
                        <h2 className="text-2xl font-light text-slate-300">
                            Análise Estratégica para <br />
                            <span className="font-semibold text-white">{clientName}</span>
                        </h2>
                    </div>

                    <div className="mt-auto">
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Elaborado por</p>
                                <p className="text-lg font-semibold text-white">{consultingFirm}</p>
                            </div>
                            <div className="h-8 w-px bg-white/20"></div>
                            <div className="text-left">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Data</p>
                                <p className="text-sm font-medium text-white">{new Date().toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="break-after-page"></div>

            {/* RESULTADO EXECUTIVO */}
            <div className="p-12 min-h-screen">
                <h3 className="text-2xl font-bold text-slate-900 mb-8 border-b pb-2">Resumo Executivo</h3>

                <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-2 uppercase text-xs tracking-wider">Cenário Recomendado</h4>
                    {bestScenario && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                <span className="text-3xl font-bold text-slate-900">{bestScenario.name}</span>
                            </div>
                            <p className="text-slate-600 leading-relaxed max-w-2xl">
                                Com base na análise do faturamento de {formatCurrency(analysis.monthlyRevenue)} e suas despesas, este regime oferece a menor carga tributária efetiva.
                            </p>

                            <div className="grid grid-cols-3 gap-8 pt-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Imposto Mensal Est.</p>
                                    <p className="text-xl font-bold text-slate-900">{formatCurrency(bestScenario.totalTaxValue ?? 0)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Carga Efetiva</p>
                                    <p className="text-xl font-bold text-slate-900">{formatPercentage((bestScenario.effectiveRate ?? 0) / 100)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Lucro Líquido Est.</p>
                                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(bestScenario.netProfitDistribution ?? 0)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Projeção de Longo Prazo (NOVO) */}
                    {monthlySavings > 0 && (
                        <div className="mb-12">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-emerald-600" />
                                Impacto Patrimonial (5 Anos)
                            </h3>
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-none">
                                <AnnualTimeline monthlySavings={monthlySavings} />
                            </div>
                            <p className="mt-4 text-sm text-slate-500 text-center">
                                *Projeção estimada considerando a aplicação da economia mensal em investimentos conservadores (CDI).
                            </p>
                        </div>
                    )}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-6 mt-12">Detalhamento dos Cenários</h3>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 uppercase text-xs font-semibold text-slate-500">
                        <tr>
                            <th className="p-3 rounded-l-lg">Regime</th>
                            <th className="p-3">Imposto Total</th>
                            <th className="p-3">Pró-Labore</th>
                            <th className="p-3">Alíquota</th>
                            <th className="p-3 rounded-r-lg text-right">Lucro Líquido</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {scenarios.map((scenario) => {
                            const isBest = scenario === bestScenario;
                            return (
                                <tr key={scenario.name} className={isBest ? "bg-emerald-50/50 font-medium" : ""}>
                                    <td className="p-3">{scenario.name} {isBest && <span className="text-xs text-emerald-600 ml-2 font-bold">(Melhor)</span>}</td>
                                    <td className="p-3">{formatCurrency(scenario.totalTaxValue ?? 0)}</td>
                                    <td className="p-3">{formatCurrency(scenario.proLaboreAnalysis?.baseValue ?? 0)}</td>
                                    <td className="p-3">{formatPercentage((scenario.effectiveRate ?? 0) / 100)}</td>
                                    <td className="p-3 text-right">{formatCurrency(scenario.netProfitDistribution ?? 0)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="mt-16 pt-8 border-t text-center text-xs text-slate-400">
                    <p className="mb-1">Este relatório é uma simulação baseada nas informações fornecidas e na legislação vigente.</p>
                    <p>{consultingFirm} - Soluções Contábeis para Médicos</p>
                </div>
            </div>
        </div>
    );
}
