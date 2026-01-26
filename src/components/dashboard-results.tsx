'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AnalysisState } from '@/app/actions';
import type { GenerateTaxScenariosOutput, ScenarioDetail } from '@/ai/flows/types';
import { BestScenarioCard } from '@/components/dashboard/best-scenario-card';
import { ScenarioMetrics } from '@/components/dashboard/scenario-metrics';
import { ScenarioTaxBreakdown } from '@/components/dashboard/scenario-tax-breakdown';
import { ClientPresentation } from '@/components/dashboard/client-presentation';

import { PrintLayout } from '@/components/dashboard/print-layout';
import { ProLaboreOptimizer } from '@/components/dashboard/pro-labore-optimizer';
import { ComplianceCard } from '@/components/dashboard/compliance-card';
import { SensitivityAnalysisChart } from '@/components/dashboard/sensitivity-analysis-chart';
import { ScenarioComparisonChart } from './scenario-comparison-chart';
import { SimulatorPanel } from '@/components/dashboard/simulator-panel';
import { AnnualTimeline } from '@/components/dashboard/annual-timeline';
import { SavingsHighlight } from '@/components/dashboard/savings-highlight';
import { MarkdownRenderer } from './markdown-renderer';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from './ui/sheet';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { generateDocx } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { saveAs } from 'file-saver';
import { AlertCircle, Download, FileText, Layers, Menu, MonitorPlay, Presentation, Printer, Target, TrendingUp, Zap } from 'lucide-react';
import type { IrpfImpact } from '@/types/irpf';

const NAV_ITEMS = [
  { label: 'Visão Geral', href: '#overview', icon: <Layers className="h-4 w-4" /> },
  { label: 'Cenário Recom.', href: '#recommended', icon: <Target className="h-4 w-4" /> },
  { label: 'Simulador', href: '#simulator', icon: <Target className="h-4 w-4" /> },
  { label: 'Otimizador', href: '#optimizer', icon: <TrendingUp className="h-4 w-4" /> },
  { label: 'Cenários', href: '#scenarios', icon: <FileText className="h-4 w-4" /> },
  { label: 'Dados Base', href: '#data', icon: <FileText className="h-4 w-4" /> },
  { label: 'Resumo', href: '#summary', icon: <Layers className="h-4 w-4" /> },
  { label: 'Reforma Tributária', href: '/reforma-tributaria', icon: <Zap className="h-4 w-4" /> },
];

const WEBHOOK_ENDPOINT = process.env.NEXT_PUBLIC_WEBHOOK_URL ?? '';

type DashboardResultsProps = {
  analysis: GenerateTaxScenariosOutput;
  clientName: string;
  consultingFirm?: string;
  irpfImpacts?: Record<string, IrpfImpact> | null;
  webhookResponse?: string | null;
  historyRecordId?: string | null;
  historyError?: string | null;
  initialParameters?: AnalysisState['initialParameters'];
};

export function DashboardResults({
  analysis,
  clientName,
  consultingFirm = 'Doctor.con',
  irpfImpacts,
  webhookResponse,
  historyRecordId,
  historyError,
  initialParameters,
}: DashboardResultsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [showClientPresentation, setShowClientPresentation] = useState(false);
  const { toast } = useToast();
  const isWebhookConfigured = WEBHOOK_ENDPOINT.length > 0;
  const webhookError = webhookResponse ? /falha|erro/i.test(webhookResponse.toLowerCase()) : false;


  const scenarios = useMemo(() => analysis?.scenarios ?? [], [analysis.scenarios]);
  const hasScenarios = scenarios.length > 0;
  const historyNotice = useMemo(() => {
    if (!historyError) return null;
    if (/firebase admin não configurado/i.test(historyError)) {
      return 'Configure as credenciais do Firebase para salvar o histórico automaticamente.';
    }
    return historyError;
  }, [historyError]);



  const normalizeRevenue = useCallback((value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 0;
    }
    return Number.parseFloat(value.toFixed(2));
  }, []);

  const revenueOptions = useMemo(() => {
    const unique = new Map<string, number>();
    scenarios.forEach(scenario => {
      const normalized = normalizeRevenue(scenario.scenarioRevenue);
      const key = normalized.toFixed(2);
      if (!unique.has(key)) {
        unique.set(key, normalized);
      }
    });
    return Array.from(unique.entries())
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => a.value - b.value);
  }, [scenarios, normalizeRevenue]);

  // Simplificação: Usa o monthlyRevenue da análise como source of truth primário
  const defaultRevenueKey = useMemo(() => {
    return normalizeRevenue(analysis.monthlyRevenue).toFixed(2);
  }, [analysis.monthlyRevenue, normalizeRevenue]);

  const [selectedRevenueKey, setSelectedRevenueKey] = useState(defaultRevenueKey);

  // Se o usuário mudar a chave, atualizamos. Se não, usamos o default.
  // Garante que nunca fique zerado se houver analysis.monthlyRevenue
  const selectedRevenue = useMemo(() => {
    const parsed = Number.parseFloat(selectedRevenueKey);
    return isNaN(parsed) || parsed === 0 ? normalizeRevenue(analysis.monthlyRevenue) : parsed;
  }, [selectedRevenueKey, analysis.monthlyRevenue, normalizeRevenue]);

  // Efeito para persistir estado no sessionStorage para evitar perda ao navegar
  useEffect(() => {
    if (analysis && analysis.scenarios.length > 0) {
      sessionStorage.setItem('last_tax_analysis', JSON.stringify({
        analysis,
        clientName,
        timestamp: Date.now(),
        initialParameters
      }));
    }
  }, [analysis, clientName, initialParameters]);

  // Efeito para restaurar (se este componente for montado vazio, o que não deve acontecer se for Server Component, 
  // mas se for Client Component wrapper, ajuda. Mas a lógica principal de restore deve ser na page raiz)

  // Ajuste na lógica de matching para ser mais tolerante (centavos)
  const scenariosForRevenue = useMemo(() => {
    if (!analysis.scenarios) return [];

    // Tenta encontrar match exato
    const matches = analysis.scenarios.filter(s =>
      Math.abs((s.scenarioRevenue || 0) - selectedRevenue) < 1.0 // Tolerância de R$ 1,00
    );

    // Se não achar match exato, retorna todos (assumindo que só tem 1 faixa calculada pela engine determinística)
    // A engine determinística atual calcula apenas para o faturamento informado.
    return matches.length > 0 ? matches : analysis.scenarios;
  }, [analysis.scenarios, selectedRevenue]);

  // Recalcula chartData e best/worst based on scenariosForRevenue
  const { chartData, bestScenario, worstScenario } = useMemo(() => {
    const effectiveScenarios = scenariosForRevenue;

    const normalizedName = (name: string) =>
      name
        .replace(/Cw+nário para .*?:\s*/i, '')
        .trim();

    const chartData = effectiveScenarios.map((scenario, index) => ({
      name: normalizedName(scenario.name || `Cenário ${index + 1}`),
      totalTax: scenario.totalTaxValue ?? 0,
      netProfit: scenario.netProfitDistribution ?? 0,
    }));

    const bestScenario = effectiveScenarios.reduce<ScenarioDetail | undefined>((acc, scenario) => {
      // Ignorar cenários de "Oportunidade" para a recomendação principal, a menos que seja o único
      // Se o usuário ativar Equiparação no form, o nome não terá "Oportunidade", então será elegível.
      const isOpportunity = scenario.name.toLowerCase().startsWith('oportunidade');
      const accIsOpportunity = acc?.name.toLowerCase().startsWith('oportunidade');

      if (!acc) return scenario;

      // Se ambos são "reais" ou ambos são "oportunidades", vence o menor imposto
      if (isOpportunity === accIsOpportunity) {
        return (scenario.totalTaxValue ?? 0) < (acc.totalTaxValue ?? 0) ? scenario : acc;
      }

      // Se um é real e o outro é oportunidade, vence o real
      if (!isOpportunity && accIsOpportunity) return scenario;
      if (isOpportunity && !accIsOpportunity) return acc;

      return acc;
    }, undefined);

    const worstScenario = effectiveScenarios.reduce<ScenarioDetail | undefined>((acc, scenario) => {
      if (!acc) return scenario;
      return (scenario.totalTaxValue ?? 0) > (acc.totalTaxValue ?? 0) ? scenario : acc;
    }, undefined);

    return { chartData, bestScenario, worstScenario };
  }, [scenariosForRevenue]);

  const monthlySavings =
    bestScenario && worstScenario
      ? (worstScenario.totalTaxValue ?? 0) - (bestScenario.totalTaxValue ?? 0)
      : 0;
  const annualSavings = monthlySavings * 12;
  const economyShare =
    bestScenario && worstScenario && (worstScenario.totalTaxValue ?? 0) > 0
      ? monthlySavings / (worstScenario.totalTaxValue ?? 1)
      : 0;

  const otherScenarios = bestScenario
    ? scenariosForRevenue.filter(scenario => scenario !== bestScenario)
    : scenariosForRevenue;
  const irpfImpactForBest = bestScenario ? irpfImpacts?.[bestScenario.name] : undefined;
  const outlierScenarios = useMemo(() => {
    return scenarios.filter(scenario => {
      const revenue = normalizeRevenue(scenario.scenarioRevenue ?? selectedRevenue);
      const taxValue = scenario.totalTaxValue ?? 0;
      const effectiveRate = scenario.effectiveRate ?? 0;
      const unrealisticTax = revenue > 0 && taxValue > revenue * 5;
      const unrealisticRate = effectiveRate > 100;
      return unrealisticTax || unrealisticRate;
    });
  }, [scenarios, normalizeRevenue, selectedRevenue]);
  const hasOutliers = outlierScenarios.length > 0;

  if (!hasScenarios) {
    return (
      <div className="glass-card flex flex-col rounded-xl p-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Nenhum cenário gerado</CardTitle>
          <CardDescription className="text-muted-foreground">
            Revise os dados enviados ou adicione anexos com detalhamento financeiro para permitir a simulação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Dados insuficientes</AlertTitle>
            <AlertDescription>
              A IA retornou sem projeções para este cliente. Informe faturamento, folha e anexos-chave para habilitar os cálculos.
            </AlertDescription>
          </Alert>
          {historyNotice && (
            <Alert className="border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-500/40 dark:bg-slate-500/10 dark:text-slate-100">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Histórico não salvo</AlertTitle>
              <AlertDescription>{historyNotice}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </div>
    );
  }



  const handleDownloadDocx = async () => {
    if (!bestScenario) {
      toast({
        variant: 'destructive',
        title: 'Erro no Download',
        description: 'Cenário recomendado não encontrado para gerar o relatório.',
      });
      return;
    }

    setIsDownloading(true);
    const reportElement = document.getElementById('report-content');

    try {
      if (!reportElement) {
        throw new Error('Elemento principal do relatório não encontrado.');
      }

      const clonedReport = reportElement.cloneNode(true) as HTMLElement;
      clonedReport.querySelector('[data-section="overview"]')?.remove();
      clonedReport.querySelector('[data-section="data"]')?.remove();

      const scenariosSection = clonedReport.querySelector('[data-section="scenarios"]');
      if (scenariosSection) {
        const heading = scenariosSection.querySelector('h2');
        if (heading) heading.textContent = 'Regime Tributário Recomendado';
        scenariosSection.querySelectorAll('[data-scenario-card]').forEach(card => {
          if (card instanceof HTMLElement && card.dataset.best !== 'true') {
            card.remove();
          }
        });
      }

      const htmlContent = clonedReport.outerHTML;
      const result = await generateDocx(htmlContent);

      if (result.error || !result.docx) {
        throw new Error(result.error || 'Não foi possível gerar o documento Word.');
      }

      const byteCharacters = atob(result.docx);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      saveAs(blob, `Relatorio_Tributario_${clientName.replace(/\s/g, '_')}.docx`);
    } catch (error) {
      console.error('Erro ao gerar DOCX:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no Download',
        description: error instanceof Error ? error.message : 'Não foi possível gerar o arquivo Word.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const IrpfImpactSummary = ({ impact }: { impact: IrpfImpact }) => {
    const details = impact.impactDetails;
    const netImpactValue = details.netImpact ?? 0;
    const netImpactIsPositive = netImpactValue >= 0;
    const netImpactLabel = netImpactIsPositive ? 'IRPF a recolher' : 'Saldo após deduções';
    const netImpactClass = netImpactIsPositive
      ? 'text-destructive'
      : 'text-emerald-600 dark:text-emerald-300';

    return (
      <div className="glass-card rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Impacto no IRPF</CardTitle>
          <CardDescription className="text-muted-foreground">
            Estimativa considerando o pró-labore orientado e a distribuição de lucros deste cenário.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex h-full min-h-[150px] flex-col rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)_/_0.9)] p-5 shadow-inner shadow-black/5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">Base Tributável</p>
            <p className="mt-auto text-2xl font-semibold text-foreground tabular-nums">{formatCurrency(details.taxableIncome)}</p>
          </div>
          <div className="flex h-full min-h-[150px] flex-col rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)_/_0.9)] p-5 shadow-inner shadow-black/5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">Faixa de Alíquota</p>
            <p className="mt-auto text-2xl font-semibold text-foreground tabular-nums">{details.taxBracket}</p>
          </div>
          <div className="flex h-full min-h-[150px] flex-col rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)_/_0.9)] p-5 shadow-inner shadow-black/5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">IRPF Bruto</p>
            <p className="mt-auto text-2xl font-semibold text-foreground tabular-nums">{formatCurrency(details.irpfDue)}</p>
          </div>
          <div className="flex h-full min-h-[150px] flex-col rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)_/_0.9)] p-5 shadow-inner shadow-black/5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">Deduções</p>
            <p className="mt-auto text-2xl font-semibold text-foreground tabular-nums">{formatCurrency(details.deductions)}</p>
          </div>
          <div className="flex h-full min-h-[150px] flex-col rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)_/_0.9)] p-5 shadow-inner shadow-black/5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">{netImpactLabel}</p>
            <p className={cn('mt-auto text-2xl font-semibold tabular-nums', netImpactClass)}>{formatCurrency(netImpactValue)}</p>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {details.summary}
          </p>
        </CardFooter>
      </div>
    );
  };

  const SideNavItem = ({ icon, label, href }: { icon: ReactNode; label: string; href: string }) => (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-[hsl(var(--secondary))] hover:text-brand-600"
    >
      {icon}
      {label}
    </a>
  );

  return (
    <div className={cn(
      "grid min-h-[calc(100vh-4rem)] w-full text-[hsl(var(--foreground))] print:block transition-all duration-500 ease-in-out",
      isPresentationMode ? "lg:grid-cols-1" : "lg:grid-cols-[260px_1fr]"
    )}>
      <aside className={cn(
        "glass hidden border-r border-white/20 shadow-sm lg:block no-print z-10 transition-all duration-500",
        isPresentationMode ? "-ml-[260px] opacity-0 overflow-hidden w-0" : "opacity-100"
      )}>
        <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col gap-6 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Relatório</p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">Painel de Planejamento</h2>
          </div>
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map(item => (
              <SideNavItem key={item.href} icon={item.icon} label={item.label} href={item.href} />
            ))}
          </nav>
        </div>
      </aside>

      <section className="flex flex-col print:w-full">
        <header className="glass sticky top-0 z-20 flex flex-col gap-4 border-b border-white/20 px-4 py-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-8 no-print">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Planejamento tributário</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">
              {clientName} <span className="text-brand-600">| {consultingFirm}</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Baseado no faturamento mensal selecionado ({formatCurrency(selectedRevenue)}).
            </p>
            {historyRecordId ? (
              <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                Histórico armazenado com sucesso para acompanhamento.
              </p>
            ) : historyNotice ? (
              <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-300">
                Histórico não foi salvo: {historyNotice}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn("sm:hidden", isPresentationMode && "hidden")}
                >
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Abrir navegação</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-80 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]"
              >
                <div className="mt-6 flex flex-col gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Relatório
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-foreground">
                      Painel de Planejamento
                    </h2>
                  </div>
                  <nav className="flex flex-col gap-2">
                    {NAV_ITEMS.map(item => (
                      <SheetClose key={item.href} asChild>
                        <SideNavItem icon={item.icon} label={item.label} href={item.href} />
                      </SheetClose>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
            {revenueOptions.length > 1 ? (
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Faturamento mensal
                </span>
                <Select value={selectedRevenueKey} onValueChange={setSelectedRevenueKey}>
                  <SelectTrigger className="w-[220px] border-[hsl(var(--border))] bg-[hsl(var(--background)_/_0.35)] text-left text-sm text-[hsl(var(--foreground))]">
                    <SelectValue placeholder="Escolha uma faixa" />
                  </SelectTrigger>
                  <SelectContent>
                    {revenueOptions.map(option => (
                      <SelectItem key={option.key} value={option.key}>
                        {formatCurrency(option.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Badge variant="outline" className="border-[hsl(var(--accent))] bg-[hsl(var(--accent)_/_0.12)] text-brand-600">
                {formatCurrency(selectedRevenue)}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()} className="no-print border-[hsl(var(--border))] text-foreground hover:bg-[hsl(var(--secondary))]">
              <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
            </Button>
            <Button size="sm" onClick={handleDownloadDocx} disabled={isDownloading} className="bg-brand-600 text-white hover:bg-brand-500">
              <Download className="mr-2 h-4 w-4" /> {isDownloading ? 'Gerando...' : 'Baixar Word'}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowClientPresentation(true)}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <Presentation className="mr-2 h-4 w-4" />
              Apresentação Cliente
            </Button>
            <Button
              variant={isPresentationMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPresentationMode(!isPresentationMode)}
              className={cn(
                "transition-all",
                isPresentationMode
                  ? "bg-brand-600/90 text-white hover:bg-brand-500 shadow-lg shadow-brand-500/20"
                  : "border-[hsl(var(--border))] text-foreground hover:bg-[hsl(var(--secondary))]"
              )}
            >
              <MonitorPlay className="mr-2 h-4 w-4" />
              {isPresentationMode ? 'Sair da Apresentação' : 'Modo Apresentação'}
            </Button>
          </div>
        </header>

        <main
          id="report-content"
          className="flex flex-1 flex-col gap-8 px-4 py-6 lg:px-8" data-selected-revenue={selectedRevenue}
        >
          <section id="overview" data-section="overview" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Visão Geral</h2>
              <p className="text-sm text-muted-foreground">
                Resumo das economias e comparação dos regimes avaliados para o faturamento informado.
              </p>
            </div>
            {hasOutliers && !isPresentationMode && (
              <Alert className="border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Números fora do padrão</AlertTitle>
                <AlertDescription>
                  Identificamos cenários com carga tributária ou alíquota efetiva muito acima do faturamento informado.
                  Revise os valores inseridos e confirme se os anexos (extratos, CNPJ e declarações) refletem o faturamento real.
                </AlertDescription>
              </Alert>
            )}
            <div className="print:break-inside-avoid">
              <ScenarioMetrics
                bestScenario={bestScenario}
                worstScenario={worstScenario}
                monthlySavings={monthlySavings}
                annualSavings={annualSavings}
                economyShare={economyShare}
              />
            </div>

            {/* Auditoria de Compliance */}
            {analysis.complianceAnalysis && (
              <div className="print:break-inside-avoid">
                <ComplianceCard analysis={analysis.complianceAnalysis} />
              </div>
            )}

            {/* Gráficos de Análise (Comparativo atual + Sensibilidade futura) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:break-inside-avoid">
              {chartData.length > 0 && (
                <div className="glass-card rounded-xl print:break-inside-avoid">
                  <CardHeader>
                    <CardTitle>Comparativo de Regimes (Cenário Atual)</CardTitle>
                    <CardDescription>
                      Visualização da carga tributária e lucro líquido para o faturamento de {formatCurrency(analysis.monthlyRevenue)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-0">
                    <ScenarioComparisonChart data={chartData} />
                  </CardContent>
                </div>
              )}

              <SensitivityAnalysisChart
                currentRevenue={analysis.monthlyRevenue}
                payrollExpenses={initialParameters?.payrollExpenses || 0}
                issRate={initialParameters?.issRate || 0}
                numberOfPartners={initialParameters?.numberOfPartners || 1}
                realProfitMargin={initialParameters?.realProfitMargin}
                isUniprofessional={initialParameters?.isUniprofessionalSociety || false}
              />
            </div>
          </section>

          <section id="simulator" data-section="simulator" className="space-y-6">
            <SimulatorPanel
              initialRevenue={selectedRevenue}
              initialPayroll={initialParameters?.payrollExpenses}
              initialIssRate={initialParameters?.issRate}
              initialPartners={initialParameters?.numberOfPartners}
              initialRealMargin={initialParameters?.realProfitMargin}
              initialIsSup={initialParameters?.isUniprofessionalSociety}
            />
          </section>

          <section id="optimizer" data-section="optimizer" className="space-y-6">
            <ProLaboreOptimizer initialRevenue={selectedRevenue} />
          </section>


          {bestScenario && (
            <section id="recommended" data-section="recommended" className="space-y-8">
              <div className="flex flex-col gap-2 mb-4">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Estratégia Recomendada</h2>
                <p className="text-muted-foreground">
                  Análise detalhada do regime tributário mais eficiente para o seu perfil.
                </p>
              </div>

              <SavingsHighlight
                monthlySavings={monthlySavings}
                annualSavings={annualSavings}
                currentTax={worstScenario?.totalTaxValue ?? 0}
                projectedTax={bestScenario.totalTaxValue ?? 0}
              />

              <BestScenarioCard scenario={bestScenario} />
              <ScenarioTaxBreakdown scenario={bestScenario} className="border-none shadow-md" />
              {irpfImpactForBest && <IrpfImpactSummary impact={irpfImpactForBest} />}
            </section>
          )}

          {otherScenarios.length > 0 && (
            <section id="scenarios" data-section="scenarios" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Demais Cenários Simulados</h2>
                <p className="text-sm text-muted-foreground">
                  Comparativo direto dos outros regimes avaliados.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                {otherScenarios.map(scenario => {
                  const deltaVersusBest = bestScenario
                    ? (scenario.totalTaxValue ?? 0) - (bestScenario.totalTaxValue ?? 0)
                    : 0;
                  const deltaLabel = deltaVersusBest >= 0
                    ? `+${formatCurrency(deltaVersusBest)}`
                    : `${formatCurrency(deltaVersusBest)}`;

                  return (
                    <div
                      key={scenario.name}
                      data-scenario-card="true"
                      data-best={String(scenario === bestScenario)}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white/50 p-5 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900"
                    >
                      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        {/* Title and Delta */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-base font-semibold text-foreground">
                              {scenario.name.replace(/Cenário para .*?:\s*/i, '')}
                            </h3>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs font-normal",
                                deltaVersusBest > 0 ? "text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300"
                              )}
                            >
                              {deltaVersusBest === 0 ? 'Mesmo Custo' : `${deltaLabel} vs. Recomendado`}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {scenario.notes}
                          </p>
                        </div>

                        {/* Metrics Horizontal Group */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:flex md:items-center md:gap-8">

                          <div className="space-y-0.5">
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Impostos</span>
                            <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">
                              {formatCurrency(scenario.totalTaxValue)}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatPercentage((scenario.effectiveRate ?? 0) / 100)} Efet.
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lucro Líquido</span>
                            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(scenario.netProfitDistribution)}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {scenario.taxCostPerEmployee ? `Custo/Colab: ${formatCurrency(scenario.taxCostPerEmployee)}` : 'Margem Final'}
                            </span>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {!isPresentationMode && (
            <section id="data" data-section="data" className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados Utilizados na Análise</h2>
                <p className="text-sm text-muted-foreground">
                  Informações fornecidas pelo cliente e transcritas automaticamente para alimentar os cálculos.
                </p>
              </div>
              <div className="glass-card rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Transcrição de Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[320px] overflow-auto rounded-md bg-[hsl(var(--secondary))] p-4 text-sm leading-relaxed">
                    {analysis.transcribedText ? (
                      <p className="whitespace-pre-wrap text-foreground">{analysis.transcribedText}</p>
                    ) : (
                      <p className="text-muted-foreground">Nenhum documento foi anexado para transcrição.</p>
                    )}
                  </div>
                </CardContent>
              </div>
              <div className="glass-card rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Retorno do Webhook</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {isWebhookConfigured ? (
                      <>
                        Payload enviado para{' '}
                        <a
                          href={WEBHOOK_ENDPOINT}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-brand-600 dark:text-brand-300"
                        >
                          {WEBHOOK_ENDPOINT}
                        </a>.
                      </>
                    ) : (
                      'Nenhum endpoint configurado. Defina as variáveis NEXT_PUBLIC_WEBHOOK_URL e WEBHOOK_URL para habilitar este envio.'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isWebhookConfigured && !webhookResponse && (
                    <Alert className="border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Envio desabilitado</AlertTitle>
                      <AlertDescription>
                        Configure um endpoint válido para registrar o histórico do planejamento em integrações externas.
                      </AlertDescription>
                    </Alert>
                  )}
                  {(isWebhookConfigured || webhookResponse) && (
                    <div className="max-h-[240px] overflow-auto rounded-md bg-[hsl(var(--secondary))] p-4 text-sm leading-relaxed">
                      {webhookResponse ? (
                        webhookError ? (
                          <Alert variant="destructive" className="border border-red-200 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Falha ao enviar</AlertTitle>
                            <AlertDescription className="space-y-2 text-sm">
                              <p>Revise o endpoint informado ou tente novamente mais tarde.</p>
                              <pre className="max-h-40 overflow-auto rounded bg-red-900/10 p-3 text-xs leading-relaxed text-red-900 dark:bg-red-300/10 dark:text-red-100">
                                {`${webhookResponse.length > 2000
                                  ? `${webhookResponse.slice(0, 2000)}…`
                                  : webhookResponse
                                  }`}
                              </pre>
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <pre className="whitespace-pre-wrap break-words text-foreground">
                            {`${webhookResponse.length > 2000
                              ? `${webhookResponse.slice(0, 2000)}…`
                              : webhookResponse
                              }`}
                          </pre>
                        )
                      ) : (
                        <p className="text-muted-foreground">
                          Nenhuma resposta recebida do endpoint até o momento.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </div>
            </section>
          )}

          <section id="summary" data-section="summary" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Resumo Estratégico</h2>
              <p className="text-sm text-muted-foreground">
                Síntese executiva com recomendações e pontos de atenção para a tomada de decisão.
              </p>
            </div>
            <div className="glass-card rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Resumo Executivo</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-foreground">
                <MarkdownRenderer content={analysis.executiveSummary ?? 'Nenhum resumo executivo disponível.'} />
              </CardContent>
            </div>
            {analysis.breakEvenAnalysis && (
              <div className="glass-card rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Pontes de Equilíbrio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {analysis.breakEvenAnalysis}
                  </p>
                </CardContent>
              </div>
            )}
          </section>
        </main>
      </section>

      {showClientPresentation && (
        <ClientPresentation
          analysis={analysis}
          clientName={clientName}
          consultingFirm={consultingFirm}
          onClose={() => setShowClientPresentation(false)}
        />
      )}

      <PrintLayout
        analysis={analysis}
        clientName={clientName}
        consultingFirm={consultingFirm}
      />
    </div>
  );
}
