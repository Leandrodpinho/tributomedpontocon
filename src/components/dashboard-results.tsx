'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { GenerateTaxScenariosOutput, ScenarioDetail } from '@/ai/flows/types';
import { BestScenarioCard } from '@/components/dashboard/best-scenario-card';
import { ScenarioMetrics } from '@/components/dashboard/scenario-metrics';
import { ScenarioTaxBreakdown } from '@/components/dashboard/scenario-tax-breakdown';
import { ScenarioComparisonChart } from './scenario-comparison-chart';
import { MarkdownRenderer } from './markdown-renderer';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { generateDocx } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { saveAs } from 'file-saver';
import { Download, FileText, Layers, Printer, Target } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Visão Geral', href: '#overview', icon: <Layers className="h-4 w-4" /> },
  { label: 'Cenário Recom.', href: '#recommended', icon: <Target className="h-4 w-4" /> },
  { label: 'Cenários', href: '#scenarios', icon: <FileText className="h-4 w-4" /> },
  { label: 'Dados Base', href: '#data', icon: <FileText className="h-4 w-4" /> },
  { label: 'Resumo', href: '#summary', icon: <Layers className="h-4 w-4" /> },
];

type DashboardResultsProps = {
  analysis: GenerateTaxScenariosOutput;
  clientName: string;
};

export function DashboardResults({ analysis, clientName }: DashboardResultsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  if (!analysis?.scenarios?.length) {
    return null;
  }

  const selectedRevenue = analysis.monthlyRevenue ?? 0;

  const { scenariosForRevenue, chartData, bestScenario, worstScenario } = useMemo(() => {
    const scenariosForRevenue = analysis.scenarios.filter((scenario: ScenarioDetail) => {
      return Math.abs((scenario.scenarioRevenue ?? 0) - selectedRevenue) < 0.01;
    });

    const normalizedName = (name: string) =>
      name
        .replace(/ com Faturamento de R\$ \d+[.,]\d+/i, '')
        .replace(/Cenário para .*?:\s*/i, '')
        .trim();

    const chartData = scenariosForRevenue.map((scenario, index) => ({
      name: normalizedName(scenario.name || `Cenário ${index + 1}`),
      totalTax: scenario.totalTaxValue ?? 0,
      netProfit: scenario.netProfitDistribution ?? 0,
    }));

    const bestScenario = scenariosForRevenue.reduce<ScenarioDetail | undefined>((acc, scenario) => {
      if (!acc) return scenario;
      return (scenario.totalTaxValue ?? 0) < (acc.totalTaxValue ?? 0) ? scenario : acc;
    }, undefined);

    const worstScenario = scenariosForRevenue.reduce<ScenarioDetail | undefined>((acc, scenario) => {
      if (!acc) return scenario;
      return (scenario.totalTaxValue ?? 0) > (acc.totalTaxValue ?? 0) ? scenario : acc;
    }, undefined);

    return { scenariosForRevenue, chartData, bestScenario, worstScenario };
  }, [analysis.scenarios, selectedRevenue]);

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

  const normalizedBestName = bestScenario?.name ?? '';

  const handlePrint = () => {
    const reportElement = document.getElementById('report-content');
    if (!reportElement || !bestScenario) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Imprimir',
        description: 'Não foi possível preparar o relatório para impressão.',
      });
      return;
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

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
      const stylesHTML = styles.map(style => style.outerHTML).join('');
      printWindow.document.write(
        `<!DOCTYPE html><html><head><title>Relatório Tributário - ${clientName}</title>${stylesHTML}</head><body class="p-8">${clonedReport.innerHTML}</body></html>`
      );
      printWindow.document.close();
      printWindow.onload = function () {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
    }
  };

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

  const SideNavItem = ({ icon, label, href }: { icon: ReactNode; label: string; href: string }) => (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {icon}
      {label}
    </a>
  );

  return (
    <div className="grid min-h-[calc(100vh-4rem)] w-full bg-slate-50 text-slate-900 lg:grid-cols-[260px_1fr] print:block dark:bg-slate-900 dark:text-slate-100">
      <aside className="hidden border-r border-border/40 bg-white shadow-sm lg:block no-print dark:bg-slate-900/80">
        <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col gap-6 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">Relatório</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">Painel de Planejamento</h2>
          </div>
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map(item => (
              <SideNavItem key={item.href} icon={item.icon} label={item.label} href={item.href} />
            ))}
          </nav>
        </div>
      </aside>

      <section className="flex flex-col print:w-full">
        <header className="flex flex-col gap-4 border-b border-border/60 bg-white px-4 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 no-print dark:bg-slate-900/80">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Planejamento tributário</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              {clientName} <span className="text-brand-600 dark:text-brand-400">| Doctor.con</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Baseado nos dados de faturamento mensal ({formatCurrency(selectedRevenue)}).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={handlePrint} className="border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
            </Button>
            <Button size="sm" onClick={handleDownloadDocx} disabled={isDownloading} className="bg-brand-600 text-white hover:bg-brand-500">
              <Download className="mr-2 h-4 w-4" /> {isDownloading ? 'Gerando...' : 'Baixar Word'}
            </Button>
          </div>
        </header>

        <main
          id="report-content"
          className="flex flex-1 flex-col gap-8 px-4 py-6 lg:px-8" data-selected-revenue={selectedRevenue}
        >
          <section id="overview" data-section="overview" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Visão Geral</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Resumo das economias e comparação dos regimes avaliados para o faturamento informado.
              </p>
            </div>
            <ScenarioMetrics
              bestScenario={bestScenario}
              worstScenario={worstScenario}
              monthlySavings={monthlySavings}
              annualSavings={annualSavings}
              economyShare={economyShare}
            />
            {chartData.length > 0 && (
              <Card className="border border-slate-200 shadow-sm dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Comparativo de Cenários</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    Avalie o impacto de cada regime sobre a carga tributária e o lucro líquido.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScenarioComparisonChart data={chartData} />
                </CardContent>
              </Card>
            )}
          </section>

          {bestScenario && (
            <section id="recommended" data-section="recommended" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Cenário Recomendado</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Regime com menor carga tributária projetada mantendo o faturamento atual.
                  </p>
                </div>
                <Badge variant="secondary" className="bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                  Otimização média de {formatCurrency(monthlySavings)} / mês
                </Badge>
              </div>
              <BestScenarioCard scenario={bestScenario} />
              <ScenarioTaxBreakdown scenario={bestScenario} className="border-none shadow-md" />
            </section>
          )}

          {otherScenarios.length > 0 && (
            <section id="scenarios" data-section="scenarios" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Demais Cenários Simulados</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Compare as principais métricas de cada regime avaliado pela inteligência artificial.
                </p>
              </div>
              <div className="grid gap-4">
                {otherScenarios.map(scenario => {
                  const deltaVersusBest = bestScenario
                    ? (scenario.totalTaxValue ?? 0) - (bestScenario.totalTaxValue ?? 0)
                    : 0;
                  const deltaLabel = deltaVersusBest >= 0
                    ? `+${formatCurrency(deltaVersusBest)} em tributos vs. recomendado`
                    : `${formatCurrency(deltaVersusBest)} em tributos vs. recomendado`;

                  return (
                    <Card
                      key={scenario.name}
                      data-scenario-card="true"
                      data-best={String(scenario === bestScenario)}
                      className={cn(
                        'border border-slate-200 bg-white shadow-sm transition-all hover:border-brand-400/60 dark:border-slate-700 dark:bg-slate-900/80',
                        scenario === bestScenario && 'ring-2 ring-brand-500/50'
                      )}
                    >
                      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                            {scenario.name.replace(/Cenário para .*?:\s*/i, '')}
                          </CardTitle>
                          <CardDescription>
                            Faturamento considerado: {formatCurrency(scenario.scenarioRevenue ?? selectedRevenue)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {deltaVersusBest === 0 ? 'Mesmo custo do recomendado' : deltaLabel}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Carga Tributária</p>
                            <p className="mt-2 text-xl font-semibold text-destructive">
                              {formatCurrency(scenario.totalTaxValue ?? 0)}
                            </p>
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                              {formatPercentage((scenario.effectiveRate ?? 0) / 100)} sobre o faturamento.
                            </p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Lucro Líquido</p>
                            <p className="mt-2 text-xl font-semibold text-emerald-600 dark:text-emerald-300">
                              {formatCurrency(scenario.netProfitDistribution ?? 0)}
                            </p>
                            {scenario.taxCostPerEmployee !== undefined && (
                              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                Custo tributário por colaborador: {formatCurrency(scenario.taxCostPerEmployee)}
                              </p>
                            )}
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Observações</p>
                            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                              {scenario.notes}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          <section id="data" data-section="data" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Dados Utilizados na Análise</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Informações fornecidas pelo cliente e transcritas automaticamente para alimentar os cálculos.
              </p>
            </div>
            <Card className="border border-slate-200 shadow-sm dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Transcrição de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[320px] overflow-auto rounded-md bg-slate-100 p-4 text-sm leading-relaxed dark:bg-slate-900/70">
                  {analysis.transcribedText ? (
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">{analysis.transcribedText}</p>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-300">Nenhum documento foi anexado para transcrição.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="summary" data-section="summary" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Resumo Estratégico</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Síntese executiva com recomendações e pontos de atenção para a tomada de decisão.
              </p>
            </div>
            <Card className="border border-slate-200 shadow-sm dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Resumo Executivo</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-slate-700 dark:text-slate-200">
                <MarkdownRenderer content={analysis.executiveSummary} />
              </CardContent>
            </Card>
            {analysis.breakEvenAnalysis && (
              <Card className="border border-slate-200 shadow-sm dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Pontes de Equilíbrio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap dark:text-slate-300">
                    {analysis.breakEvenAnalysis}
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </main>
      </section>
    </div>
  );
}
