import { useState } from 'react';
import type { GenerateTaxScenariosOutput, ScenarioDetail } from '@/ai/flows/types';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { ComparisonChart } from '@/components/dashboard/comparison-chart';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Download, TrendingDown, X } from 'lucide-react';
import { exportPresentationToPDF } from '@/lib/export-presentation-pdf';
import { useToast } from '@/hooks/use-toast';

type ClientPresentationProps = {
    analysis: GenerateTaxScenariosOutput;
    clientName: string;
    consultingFirm: string;
    onClose: () => void;
};

export function ClientPresentation({ analysis, clientName, consultingFirm, onClose }: ClientPresentationProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    // Identify best and worst scenarios
    const scenarios = analysis.scenarios || [];
    const bestScenario = scenarios.reduce<ScenarioDetail | undefined>((acc, scenario) => {
        // IGNORA cenários marcados explicitamente como INELEGÍVEIS
        if (scenario.isEligible === false) return acc;

        if (!acc) return scenario;
        return (scenario.totalTaxValue ?? 0) < (acc.totalTaxValue ?? 0) ? scenario : acc;
    }, undefined);

    const worstScenario = scenarios.reduce<ScenarioDetail | undefined>((acc, scenario) => {
        // Ignorar CLT (é apenas simulação, não um cenário real para abertura de empresa)
        if (scenario.scenarioType === 'clt') return acc;
        // Ignorar MEI inelegível
        if (scenario.scenarioType === 'mei' && scenario.isEligible === false) return acc;

        if (!acc) return scenario;
        return (scenario.totalTaxValue ?? 0) > (acc.totalTaxValue ?? 0) ? scenario : acc;
    }, undefined);

    const monthlySavings = bestScenario && worstScenario
        ? (worstScenario.totalTaxValue ?? 0) - (bestScenario.totalTaxValue ?? 0)
        : 0;
    const annualSavings = monthlySavings * 12;

    const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, 1));
    const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            await exportPresentationToPDF(clientName, consultingFirm);
            toast({
                title: 'PDF gerado com sucesso!',
                description: 'A apresentação foi baixada para o seu computador.',
            });
        } catch (error) {
            toast({
                title: 'Erro ao gerar PDF',
                description: error instanceof Error ? error.message : 'Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50/50 backdrop-blur-sm flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm supports-[backdrop-filter]:bg-white/60">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="h-6 w-1 bg-gradient-to-b from-blue-600 to-violet-600 rounded-full"></span>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            {clientName}
                        </h1>
                    </div>
                    <p className="text-xs font-medium text-slate-500 pl-3 uppercase tracking-wider">
                        Apresentação Executiva • {consultingFirm}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:text-blue-700"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? 'Gerando PDF...' : 'Baixar PDF'}
                    </Button>
                    <div className="h-8 w-px bg-slate-200 mx-1"></div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Slides Container */}
            <div className="flex-1 overflow-hidden relative">
                {/* Slide 1: Comparativo */}
                <div
                    data-slide="1"
                    className={cn(
                        "absolute inset-0 transition-transform duration-500 ease-in-out",
                        currentSlide === 0 ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <Slide1Comparativo
                        bestScenario={bestScenario}
                        worstScenario={worstScenario}
                        monthlySavings={monthlySavings}
                        annualSavings={annualSavings}
                    />
                </div>

                {/* Slide 2: Detalhamento */}
                <div
                    data-slide="2"
                    className={cn(
                        "absolute inset-0 transition-transform duration-500 ease-in-out",
                        currentSlide === 1 ? "translate-x-0" : "translate-x-full"
                    )}
                >
                    <Slide2Detalhamento bestScenario={bestScenario} />
                </div>
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between px-8 py-6 bg-white border-t border-slate-200">
                <Button
                    variant="ghost"
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="text-slate-600 hover:text-slate-900 disabled:opacity-30"
                >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Anterior
                </Button>

                <div className="flex gap-2">
                    {[0, 1].map((index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={cn(
                                "h-2 rounded-full transition-all",
                                currentSlide === index ? "w-8 bg-brand-500" : "w-2 bg-slate-300"
                            )}
                        />
                    ))}
                </div>

                <Button
                    variant="ghost"
                    onClick={nextSlide}
                    disabled={currentSlide === 1}
                    className="text-slate-600 hover:text-slate-900 disabled:opacity-30"
                >
                    Próximo
                    <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
            </div>
        </div>
    );
}

// Slide 1: Comparativo Atual vs Proposto
function Slide1Comparativo({
    bestScenario,
    worstScenario,
    monthlySavings,
    annualSavings,
}: {
    bestScenario?: ScenarioDetail;
    worstScenario?: ScenarioDetail;
    monthlySavings: number;
    annualSavings: number;
}) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 overflow-y-auto">
            <div className="max-w-6xl w-full space-y-8">
                {/* Title */}
                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-bold text-slate-900">Oportunidade de Economia</h2>
                    <p className="text-lg text-slate-600">Comparativo entre cenário atual e proposta otimizada</p>
                </div>

                {/* Comparison Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Current Scenario */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm uppercase tracking-wider text-slate-500 font-semibold">Cenário Atual</span>
                            <div className="h-3 w-3 rounded-full bg-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                {worstScenario?.name.replace(/Cenário para .*?:\s*/i, '') || 'Não identificado'}
                            </h3>
                            <p className="text-sm text-slate-600">Regime tributário menos eficiente</p>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Carga Tributária Mensal</p>
                                <p className="text-3xl font-bold text-amber-600">{formatCurrency(worstScenario?.totalTaxValue ?? 0)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Alíquota Efetiva</p>
                                <p className="text-xl font-semibold text-slate-700">{formatPercentage((worstScenario?.effectiveRate ?? 0) / 100)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Proposed Scenario */}
                    <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-8 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm uppercase tracking-wider text-emerald-700 font-semibold">Cenário Proposto</span>
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                {bestScenario?.name.replace(/Cenário para .*?:\s*/i, '') || 'Aguardando análise'}
                            </h3>
                            <p className="text-sm text-emerald-700">Regime tributário otimizado</p>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-emerald-700 uppercase font-medium">Carga Tributária Mensal</p>
                                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(bestScenario?.totalTaxValue ?? 0)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-emerald-700 uppercase font-medium">Alíquota Efetiva</p>
                                <p className="text-xl font-semibold text-emerald-600">{formatPercentage((bestScenario?.effectiveRate ?? 0) / 100)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visual Comparison Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        Comparação Visual
                        <InfoTooltip content="Gráfico comparativo mostrando a diferença de carga tributária entre o cenário atual e o proposto." />
                    </h3>
                    <ComparisonChart
                        currentValue={worstScenario?.totalTaxValue ?? 0}
                        proposedValue={bestScenario?.totalTaxValue ?? 0}
                        currentLabel={worstScenario?.name.replace(/Cenário para .*?:\s*/i, '') || 'Atual'}
                        proposedLabel={bestScenario?.name.replace(/Cenário para .*?:\s*/i, '') || 'Proposto'}
                    />
                </div>

                {/* Savings Highlight */}
                <div className="bg-brand-600 rounded-2xl p-8 text-center space-y-4 shadow-lg">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <TrendingDown className="h-8 w-8 text-white" />
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                            Economia Projetada
                            <InfoTooltip content="Valor que sua empresa economizará mensalmente e anualmente ao migrar para o regime tributário proposto." />
                        </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-sm text-brand-100 uppercase mb-2 font-medium">Economia Mensal</p>
                            <p className="text-5xl font-bold text-white">{formatCurrency(monthlySavings)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-brand-100 uppercase mb-2 font-medium">Economia Anual</p>
                            <p className="text-5xl font-bold text-white">{formatCurrency(annualSavings)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Slide 2: Detalhamento e Próximos Passos
function Slide2Detalhamento({ bestScenario }: { bestScenario?: ScenarioDetail }) {
    const taxBreakdown = bestScenario?.taxBreakdown || [];
    const hasProLabore = bestScenario?.proLaboreAnalysis && bestScenario.proLaboreAnalysis.baseValue > 0;

    return (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 overflow-y-auto">
            <div className="max-w-6xl w-full space-y-8">
                {/* Title */}
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-slate-900">Detalhamento da Proposta</h2>
                    <p className="text-base text-slate-600">Composição tributária e principais benefícios</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Tax Breakdown */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-4 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            Composição dos Tributos
                        </h3>
                        {taxBreakdown.length > 0 ? (
                            <div className="space-y-3">
                                {taxBreakdown.map((tax, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{tax.name}</p>
                                            <p className="text-xs text-slate-500">{formatPercentage((tax.rate || 0) / 100)}</p>
                                        </div>
                                        <p className="text-base font-semibold text-emerald-600">{formatCurrency(tax.value)}</p>
                                    </div>
                                ))}
                                <div className="pt-3 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-slate-900">Total Mensal</p>
                                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(bestScenario?.totalTaxValue ?? 0)}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-slate-600">Regime simplificado sem detalhamento de tributos individuais.</p>
                                <div className="pt-3 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-slate-900">Carga Total Mensal</p>
                                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(bestScenario?.totalTaxValue ?? 0)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Key Metrics & Benefits */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-4 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-brand-500" />
                            Principais Benefícios
                        </h3>
                        <div className="space-y-4">
                            {/* Effective Rate */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase flex items-center gap-1 font-medium">
                                            Alíquota Efetiva
                                            <InfoTooltip content="Percentual real de impostos sobre o faturamento, considerando todos os tributos aplicáveis ao regime." />
                                        </p>
                                        <p className="text-sm text-slate-600">Carga tributária real</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-emerald-600">{formatPercentage((bestScenario?.effectiveRate ?? 0) / 100)}</p>
                            </div>

                            {/* Net Profit */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase flex items-center gap-1 font-medium">
                                            Lucro Líquido
                                            <InfoTooltip content="Valor disponível para distribuição aos sócios após o pagamento de todos os impostos e despesas." />
                                        </p>
                                        <p className="text-sm text-slate-600">Disponível para distribuição</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(bestScenario?.netProfitDistribution ?? 0)}</p>
                            </div>

                            {/* Pro Labore if available */}
                            {hasProLabore && (
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase flex items-center gap-1 font-medium">
                                                Pró-Labore Sugerido
                                                <InfoTooltip content="Remuneração mensal sugerida para o sócio, otimizada para reduzir a carga tributária total." />
                                            </p>
                                            <p className="text-sm text-slate-600">Remuneração do sócio</p>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-brand-600">{formatCurrency(bestScenario?.proLaboreAnalysis?.baseValue ?? 0)}</p>
                                </div>
                            )}

                            {/* Notes/Observations */}
                            {bestScenario?.notes && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs text-blue-700 uppercase mb-1 font-medium">Observação Importante</p>
                                    <p className="text-xs text-blue-900 leading-relaxed">{bestScenario.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
