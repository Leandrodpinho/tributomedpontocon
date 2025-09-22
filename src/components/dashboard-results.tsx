
'use client';
import type { GenerateTaxScenariosOutput, ScenarioDetail } from '@/ai/flows/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Briefcase, ChevronRight, Download, FileText, GanttChart, Printer, Target, TrendingUp } from 'lucide-react';
import { ScenarioComparisonChart } from './scenario-comparison-chart';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MarkdownRenderer } from './markdown-renderer';
import { KpiCard } from './kpi-card';
import { saveAs } from 'file-saver';
import { generateDocx } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import React from 'react';


// Helper to parse currency strings like "R$ 1.234,56" into numbers
// Helper to format numbers as currency
const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Helper to format numbers as percentage
const formatPercentage = (value: number): string => {
    return value.toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type DashboardResultsProps = {
    analysis: GenerateTaxScenariosOutput;
    clientName: string;
};

export function DashboardResults({ analysis, clientName }: DashboardResultsProps) {
    const [isDownloading, setIsDownloading] = React.useState(false);
    const selectedRevenue = analysis.monthlyRevenue; // Faturamento é fixo por análise
    const { toast } = useToast();
    if (!analysis || !analysis.scenarios) return null;

    const derivedData = React.useMemo(() => {
        const scenariosForRevenue = analysis.scenarios.filter((s: ScenarioDetail) => 
            Math.abs(s.scenarioRevenue - (selectedRevenue || 0)) < 0.01);

        const chartData = scenariosForRevenue.map((scenario: ScenarioDetail, index: number) => ({
            name: `Agrupamento ${index + 1}`,
            scenarioName: scenario.name?.replace(/ com Faturamento de R\$ \d+\.\d+,\d+/i, '')?.replace(/Cenário para .*?: /i, '') || 'N/A',
            totalTax: scenario.totalTaxValue || 0,
            netProfit: scenario.netProfitDistribution || 0,
        }));

        const bestScenario = scenariosForRevenue.length > 0 ? [...scenariosForRevenue].sort((a, b) => a.totalTaxValue - b.totalTaxValue)[0] : undefined;
        const worstScenario = scenariosForRevenue.length > 0 ? [...scenariosForRevenue].sort((a, b) => b.totalTaxValue - a.totalTaxValue)[0] : undefined;

        return { scenariosForRevenue, chartData, bestScenario, worstScenario };
    }, [analysis.scenarios, selectedRevenue]);

    const { scenariosForRevenue, chartData, bestScenario, worstScenario } = derivedData;

    const monthlySavings = (bestScenario?.totalTaxValue !== undefined && worstScenario?.totalTaxValue !== undefined) ? worstScenario.totalTaxValue - bestScenario.totalTaxValue : 0;
    const annualSavings = monthlySavings * 12;
    const economyPercentage = (bestScenario?.totalTaxValue !== undefined && worstScenario?.totalTaxValue !== undefined && worstScenario.totalTaxValue > 0) ? (monthlySavings / worstScenario.totalTaxValue) * 100 : 0;

    const handlePrint = () => {
        const reportElement = document.getElementById('report-content');
        const bestScenarioName = bestScenario?.name;

        if (reportElement && bestScenarioName) {
            const clonedReport = reportElement.cloneNode(true) as HTMLElement;

            // Remove unwanted sections for printing
            clonedReport.querySelector('div[data-value="dash"]')?.remove();
            clonedReport.querySelector('div[data-value="data"]')?.remove();

            // Filter scenarios to keep only the best one
            const scenariosSection = clonedReport.querySelector('#scenarios');
            if (scenariosSection) {
                // Remove the accordion trigger for a cleaner look
                scenariosSection.closest('div[data-value="scenarios"]')?.querySelector('button[data-radix-collection-item]')?.remove();
                Array.from(scenariosSection.children).forEach(child => {
                    if (child.tagName.toLowerCase() === 'h2') {
                        child.textContent = "Regime Tributário Recomendado";
                        return;
                    }
                    const titleElement = child.querySelector<HTMLElement>('.text-lg');
                    if (!titleElement || titleElement.textContent !== bestScenarioName) {
                        child.remove();
                    }
                });
            }

            // Remove the summary accordion trigger
            clonedReport.querySelector('div[data-value="summary"]')?.querySelector('button[data-radix-collection-item]')?.remove();

            const printWindow = window.open('', '', 'height=800,width=1000');
            if (printWindow) {
                const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
                const stylesHTML = styles.map(style => style.outerHTML).join('');

                printWindow.document.write(`<!DOCTYPE html><html><head><title>Relatório Tributário - ${clientName}</title>${stylesHTML}</head><body class="p-8"><h1 class="text-2xl font-semibold md:text-3xl mb-6">${clientName} | Doctor.con</h1>${clonedReport.innerHTML}</body></html>`);
                printWindow.document.close();
                printWindow.onload = function() {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                };
            }
        } else {
            toast({
                variant: "destructive",
                title: "Erro ao Imprimir",
                description: "Cenário recomendado não encontrado para gerar a impressão.",
            });
        }
    };

    const handleDownloadDocx = async () => {
        setIsDownloading(true);
        const reportElement = document.getElementById('report-content');
        const bestScenarioName = bestScenario?.name;

        if (reportElement && bestScenarioName) {
          try {
            const clonedReport = reportElement.cloneNode(true) as HTMLElement;
 
            // Remove unwanted sections for the DOCX report
            clonedReport.querySelector('div[data-value="dash"]')?.remove();
            clonedReport.querySelector('div[data-value="data"]')?.remove();
 
            // Filter scenarios to keep only the best one
            const scenariosSection = clonedReport.querySelector('#scenarios');
            if (scenariosSection) {
                // Remove the accordion trigger for a cleaner look in the report
                scenariosSection.closest('div[data-value="scenarios"]')?.querySelector('button[data-radix-collection-item]')?.remove();
                const children = Array.from(scenariosSection.children);
                children.forEach(child => {
                    // Keep and rename the title of the section
                    if (child.tagName.toLowerCase() === 'h2') {
                        (child as HTMLElement).textContent = "Regime Tributário Recomendado";
                        return;
                    }
 
                    // Check if it's the best scenario card by its title
                    const titleElement = child.querySelector<HTMLElement>('.text-lg');
                    if (!titleElement || titleElement.textContent !== bestScenarioName) {
                        child.remove();
                    }
                });
            }

            // Also remove the summary accordion trigger
            clonedReport.querySelector('div[data-value="summary"]')?.querySelector('button[data-radix-collection-item]')?.remove();
 
            const htmlContent = clonedReport.outerHTML;
            const result = await generateDocx(htmlContent);
    
            if (result.error || !result.docx) {
              throw new Error(result.error || 'Failed to generate DOCX buffer.');
            }
            
            const byteCharacters = atob(result.docx);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    
            saveAs(blob, `Relatorio_Tributario_${clientName.replace(/\s/g, '_')}.docx`);
    
          } catch (error) {
            console.error("Error downloading DOCX:", error);
            toast({
              variant: "destructive",
              title: "Erro no Download",
              description: error instanceof Error ? error.message : "Não foi possível gerar o arquivo Word.",
            });
          } finally {
            setIsDownloading(false);
          }
        } else {
            toast({
                variant: "destructive",
                title: "Erro no Download",
                description: "Não foi possível gerar o arquivo. Análise ou cenário recomendado não encontrado.",
            });
            setIsDownloading(false);
        }
    };


    const SideNavItem = ({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) => (
        <a href={href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10">
            {icon}
            {label}
        </a>
    );

    return (
        <div className="grid min-h-[calc(100vh-4rem)] w-full lg:grid-cols-[280px_1fr] print:block">
            <div className="hidden border-r bg-muted/40 lg:block no-print">
                <div className="flex h-full max-h-screen flex-col gap-2 sticky top-16">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <div className="flex items-center gap-2 font-semibold">
                            <Briefcase className="h-6 w-6" />
                            <span>Dashboard de Análise</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                            <SideNavItem icon={<GanttChart className="h-4 w-4" />} label="DASH" href="#dash" />
                            <SideNavItem icon={<BarChart className="h-4 w-4" />} label="Cenários" href="#scenarios" />
                            <SideNavItem icon={<FileText className="h-4 w-4" />} label="Dados" href="#data" />
                            <SideNavItem icon={<Target className="h-4 w-4" />} label="Resumo" href="#summary" />
                        </nav>
                    </div>
                </div>
            </div>
            <div className="flex flex-col print:w-full">
                <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 no-print">
                     <div className="flex items-center gap-2">
                        <h1 className="text-lg font-semibold md:text-2xl">{clientName} | Doctor.con</h1>
                     </div>
                     <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                            <span className="ml-2 hidden sm:inline">Imprimir / Salvar PDF</span>
                        </Button>
                        <Button size="sm" onClick={handleDownloadDocx} disabled={isDownloading}>
                            <Download className="h-4 w-4" />
                            <span className="ml-2 hidden sm:inline">{isDownloading ? 'Gerando...' : 'Baixar Relatório (Word)'}</span>
                        </Button>
                    </div>
                </header>
                <main id="report-content" className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 print:p-0 print:m-0 print:gap-0">
                    <Accordion type="multiple" defaultValue={['dash']} className="w-full space-y-4">
                        <AccordionItem value="dash">
                            <AccordionTrigger className="text-xl font-bold tracking-tight no-print">Dashboard Comparativo</AccordionTrigger>
                            <AccordionContent>
                                <div id="dash" className="space-y-6 animate-in fade-in-50 pt-4">
                                    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                                        <KpiCard title="Melhor Opção" value={bestScenario?.name?.replace(/Cenário para .*?: /i, '')?.split(' com Faturamento')[0] || 'N/A'} subValue="Menor carga tributária" />
                                        <KpiCard title="Economia Mensal" value={formatCurrency(monthlySavings)} subValue="Em relação ao pior cenário" />
                                        <KpiCard title="Economia Anual" value={formatCurrency(annualSavings)} subValue="Projeção para 12 meses" />
                                        <KpiCard title="% Economia Gerada" value={formatPercentage(economyPercentage / 100)} subValue="Potencial de economia" className="text-green-500" />
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="scenarios">
                            <AccordionTrigger className="text-xl font-bold tracking-tight no-print">Análise do Melhor Cenário</AccordionTrigger>
                            <AccordionContent>
                                <div id="scenarios" className="space-y-6 pt-4">
                                    <h2 className="text-xl font-bold tracking-tight print:hidden">Análise do Melhor Cenário</h2>
                                    {bestScenario && (
                                        <Card>
                                            <CardHeader><CardTitle className="text-lg">{bestScenario.name}</CardTitle></CardHeader>
                                            <CardContent className='space-y-3 text-sm'>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="p-3 bg-secondary/30 rounded-lg">
                                                        <p className="font-semibold text-muted-foreground text-xs">Carga Tributária Total</p>
                                                        <p className="text-destructive font-bold text-xl">{formatCurrency(bestScenario.totalTaxValue || 0)}</p>
                                                        <Badge variant="secondary" className="mt-1 text-xs">{formatPercentage((bestScenario.effectiveRate || 0) / 100)} sobre Faturamento</Badge>
                                                        {bestScenario.effectiveRateOnProfit !== undefined && (<Badge variant="outline" className="mt-1 ml-2 text-xs">{formatPercentage((bestScenario.effectiveRateOnProfit || 0) / 100)} sobre Lucro</Badge>)}
                                                    </div>
                                                    <div className="p-3 bg-secondary/30 rounded-lg">
                                                        <p className="font-semibold text-muted-foreground text-xs">Lucro Líquido para o Sócio</p>
                                                        <p className="text-green-400 font-bold text-xl">{formatCurrency(bestScenario.netProfitDistribution || 0)}</p>
                                                        {bestScenario.taxCostPerEmployee !== undefined && (<p className="text-xs text-muted-foreground mt-1">Custo Tributário por Funcionário: {formatCurrency(bestScenario.taxCostPerEmployee || 0)}</p>)}
                                                    </div>
                                                </div>
                                                <Accordion type="single" collapsible>
                                                    <AccordionItem value="tax-breakdown">
                                                        <AccordionTrigger className='text-sm font-semibold'><div className='flex items-center gap-2'><ChevronRight className="h-3 w-3" /> Detalhamento dos Tributos</div></AccordionTrigger>
                                                        <AccordionContent>
                                                            <Table>
                                                                <TableHeader><TableRow><TableHead className="text-xs">Tributo</TableHead><TableHead className="text-xs">Alíquota</TableHead><TableHead className="text-right text-xs">Valor</TableHead></TableRow></TableHeader>
                                                                <TableBody>
                                                                    {bestScenario.taxBreakdown?.map((tax: { name: string; rate: number; value: number }, taxIdx: number) => (
                                                                        <TableRow key={taxIdx}><TableCell className="text-xs">{tax.name || 'N/A'}</TableCell><TableCell className="text-xs">{formatPercentage((tax.rate || 0) / 100)}</TableCell><TableCell className="text-right text-xs">{formatCurrency(tax.value || 0)}</TableCell></TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                                <h5 className="font-semibold mt-3 text-sm">Análise do Pró-Labore:</h5>
                                                <div className="p-3 border rounded-md bg-secondary/50 space-y-1 text-xs">
                                                    <div className="flex justify-between"><span className="font-semibold">Valor Bruto:</span><span>{formatCurrency(bestScenario.proLaboreAnalysis?.baseValue || 0)}</span></div>
                                                    <div className="flex justify-between"><span className="font-semibold text-red-400">INSS (sócio):</span><span className="text-red-400">{formatCurrency(bestScenario.proLaboreAnalysis?.inssValue || 0)}</span></div>
                                                    <div className="flex justify-between"><span className="font-semibold text-red-400">IRRF:</span><span className="text-red-400">{formatCurrency(bestScenario.proLaboreAnalysis?.irrfValue || 0)}</span></div>
                                                    <div className="flex justify-between font-bold pt-2 border-t mt-2"><span>Valor Líquido Recebido:</span><span className="text-base">{formatCurrency(bestScenario.proLaboreAnalysis?.netValue || 0)}</span></div>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-3 italic"><span className="font-semibold">Notas da IA:</span> {bestScenario.notes || 'N/A'}</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="data">
                            <AccordionTrigger className="text-xl font-bold tracking-tight no-print">Dados Considerados na Análise</AccordionTrigger>
                            <AccordionContent>
                                <div id="data" className="space-y-6 pt-4">
                                    <h2 className="text-2xl font-bold tracking-tight print:hidden">Dados Considerados na Análise</h2>
                                    <Card><CardHeader><CardTitle>Informações Transcritas</CardTitle><CardDescription>Este foi o texto extraído dos documentos e/ou inserido manualmente, utilizado pela IA como base para a análise.</CardDescription></CardHeader><CardContent><pre className="whitespace-pre-wrap bg-muted/50 p-4 rounded-md text-sm font-mono max-h-96 overflow-auto">{analysis.transcribedText || "Nenhuma informação transcrita foi retornada pela análise. Verifique se os documentos foram anexados corretamente."}</pre></CardContent></Card>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="summary">
                            <AccordionTrigger className="text-xl font-bold tracking-tight no-print">Resumo Executivo e Recomendações</AccordionTrigger>
                            <AccordionContent>
                                <div id="summary" className="space-y-4 pt-4">
                                    <h2 className="text-xl font-bold tracking-tight print:hidden">Resumo Executivo e Recomendações</h2>
                                    <Card className='bg-primary/10 border-primary'>
                                        <CardHeader><CardTitle className="text-lg">Conclusão da IA</CardTitle></CardHeader>
                                        <CardContent className="text-sm"><MarkdownRenderer content={analysis.executiveSummary || 'N/A'} /></CardContent>
                                    </Card>
                                    {analysis.breakEvenAnalysis && analysis.breakEvenAnalysis !== "N/A para análise de faturamento único." && (
                                        <Card className='bg-secondary/50 border-secondary'>
                                            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Análise de Ponto de Equilíbrio</CardTitle><CardDescription>Insights da IA sobre os pontos de virada de faturamento entre os regimes.</CardDescription></CardHeader>
                                            <CardContent className="text-sm"><p>{analysis.breakEvenAnalysis}</p></CardContent>
                                        </Card>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </main>
            </div>
        </div>
    );
}
