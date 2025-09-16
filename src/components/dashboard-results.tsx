
'use client';
import type { GenerateTaxScenariosOutput, ScenarioDetail } from '@/ai/flows/generate-tax-scenarios';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Briefcase, ChevronRight, Download, FileText, GanttChart, Printer, Target } from 'lucide-react';
import { ScenarioComparisonChart } from './scenario-comparison-chart';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MarkdownRenderer } from './markdown-renderer';
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
    const { toast } = useToast();
    if (!analysis || !analysis.scenarios) return null;

    const monthlyRevenueFormatted = analysis.monthlyRevenue ? formatCurrency(analysis.monthlyRevenue) : '';
    const currentRevenueScenarios = analysis.scenarios.filter(s => s.name.includes(monthlyRevenueFormatted));

    const chartData = currentRevenueScenarios.map((scenario, index) => ({
        name: `Agrupamento ${index + 1}`,
        scenarioName: scenario.name?.replace(/ com Faturamento de R\$ \d+\.\d+,\d+/i, '')?.replace(/Cenário para .*?: /i, '') || 'N/A',
        totalTax: scenario.totalTaxValue || 0,
        netProfit: scenario.netProfitDistribution || 0,
    }));

    const bestScenario = currentRevenueScenarios.length > 0 ? [...currentRevenueScenarios].sort((a, b) => a.totalTaxValue - b.totalTaxValue)[0] : undefined;
    const worstScenario = currentRevenueScenarios.length > 0 ? [...currentRevenueScenarios].sort((a, b) => b.totalTaxValue - a.totalTaxValue)[0] : undefined;

    const monthlySavings = (bestScenario?.totalTaxValue !== undefined && worstScenario?.totalTaxValue !== undefined) ? worstScenario.totalTaxValue - bestScenario.totalTaxValue : 0;
    const annualSavings = monthlySavings * 12;
    const economyPercentage = (bestScenario?.totalTaxValue !== undefined && worstScenario?.totalTaxValue !== undefined && worstScenario.totalTaxValue > 0) ? (monthlySavings / worstScenario.totalTaxValue) * 100 : 0;

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadDocx = async () => {
        setIsDownloading(true);
        const reportElement = document.getElementById('report-content');
        if (reportElement) {
          try {
            const htmlContent = reportElement.outerHTML;
            const result = await generateDocx(htmlContent);
    
            if (result.error || !result.docx) {
              throw new Error(result.error || 'Failed to generate DOCX buffer.');
            }
            
            // Convert base64 back to a Blob
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
        }
    };


    const SideNavItem = ({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) => (
        <a href={href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10">
            {icon}
            {label}
        </a>
    );

    const KpiCard = ({ title, value, subValue, className = '' }: { title: string, value: string, subValue?: string, className?: string }) => (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardDescription className="text-sm">{title}</CardDescription>
                <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
            {subValue &&
                <CardContent>
                    <p className="text-xs text-muted-foreground">{subValue}</p>
                </CardContent>
            }
        </Card>
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
                    {/* DASH Section */}
                    <div id="dash" className="space-y-6 animate-in fade-in-50">
                        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                            <KpiCard title="Melhor Opção" value={bestScenario?.name?.replace(/Cenário para .*?: /i, '')?.split(' com Faturamento')[0] || 'N/A'} subValue="Menor carga tributária" />
                            <KpiCard title="Economia Mensal" value={formatCurrency(monthlySavings)} subValue="Em relação ao pior cenário" />
                            <KpiCard title="Economia Anual" value={formatCurrency(annualSavings)} subValue="Projeção para 12 meses" />
                            <KpiCard title="% Economia Gerada" value={formatPercentage(economyPercentage / 100)} subValue="Potencial de economia" className="text-green-500" />
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Comparativo de Agrupamentos (Faturamento Atual)</CardTitle>
                                <CardDescription>Análise da Carga Tributária (Despesa) vs. Lucro Líquido para o faturamento de {analysis.monthlyRevenue}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Agrupamento</TableHead>
                                            <TableHead>Faturamento</TableHead>
                                            <TableHead>Despesa</TableHead>
                                            <TableHead>% Despesa</TableHead>
                                            <TableHead className='text-right'>Resultado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentRevenueScenarios.map((scenario, index) => (
                                            <TableRow key={index} className={scenario.name === bestScenario?.name ? 'bg-primary/10' : ''}>
                                                <TableCell className='font-medium text-sm'>{`Agrupamento ${index + 1}`} <p className='text-xs text-muted-foreground'>{scenario.name?.replace(/Cenário para .*?: /i, '')?.split(' com Faturamento')[0] || 'N/A'}</p></TableCell>
                                                <TableCell className='text-sm'>{formatCurrency(analysis.monthlyRevenue || 0)}</TableCell>
                                                <TableCell className='text-sm'>{formatCurrency(scenario.totalTaxValue || 0)}</TableCell>
                                                <TableCell className='text-sm'>{formatPercentage((scenario.effectiveRate || 0) / 100)}</TableCell>
                                                <TableCell className='text-right font-bold text-sm'>{formatCurrency(scenario.netProfitDistribution || 0)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="min-h-[300px]">
                                    <ScenarioComparisonChart data={chartData} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Scenarios Section */}
                    <div id="scenarios" className="space-y-6 pt-10">
                         <h2 className="text-xl font-bold tracking-tight">Análise Detalhada dos Cenários</h2>
                         {analysis.scenarios.map((scenario: ScenarioDetail, index: number) => (
                            <Card key={index}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-3 text-sm'>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="p-3 bg-secondary/30 rounded-lg">
                                            <p className="font-semibold text-muted-foreground text-xs">Carga Tributária Total</p>
                                            <p className="text-destructive font-bold text-xl">{formatCurrency(scenario.totalTaxValue || 0)}</p>
                                            <Badge variant="secondary" className="mt-1 text-xs">{formatPercentage((scenario.effectiveRate || 0) / 100)} sobre Faturamento</Badge>
                                            {scenario.effectiveRateOnProfit !== undefined && (
                                                <Badge variant="outline" className="mt-1 ml-2 text-xs">{formatPercentage((scenario.effectiveRateOnProfit || 0) / 100)} sobre Lucro</Badge>
                                            )}
                                        </div>
                                        <div className="p-3 bg-secondary/30 rounded-lg">
                                            <p className="font-semibold text-muted-foreground text-xs">Lucro Líquido para o Sócio</p>
                                            <p className="text-green-400 font-bold text-xl">{formatCurrency(scenario.netProfitDistribution || 0)}</p>
                                            {scenario.taxCostPerEmployee !== undefined && (
                                                <p className="text-xs text-muted-foreground mt-1">Custo Tributário por Funcionário: {formatCurrency(scenario.taxCostPerEmployee || 0)}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <Accordion type="single" collapsible>
                                        <AccordionItem value="tax-breakdown">
                                            <AccordionTrigger className='text-sm font-semibold'>
                                                <div className='flex items-center gap-2'>
                                                  <ChevronRight className="h-3 w-3" /> Detalhamento dos Tributos
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="text-xs">Tributo</TableHead>
                                                            <TableHead className="text-xs">Alíquota</TableHead>
                                                            <TableHead className="text-right text-xs">Valor</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {scenario.taxBreakdown?.map((tax: { name: string; rate: number; value: number }, taxIdx: number) => (
                                                            <TableRow key={taxIdx}>
                                                                <TableCell className="text-xs">{tax.name || 'N/A'}</TableCell>
                                                                <TableCell className="text-xs">{formatPercentage((tax.rate || 0) / 100)}</TableCell>
                                                                <TableCell className="text-right text-xs">{formatCurrency(tax.value || 0)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>


                                    <h5 className="font-semibold mt-3 text-sm">Análise do Pró-Labore:</h5>
                                    <div className="p-3 border rounded-md bg-secondary/50 space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Valor Bruto:</span>
                                            <span>{formatCurrency(scenario.proLaboreAnalysis?.baseValue || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-red-400">INSS (sócio):</span>
                                            <span className="text-red-400">{formatCurrency(scenario.proLaboreAnalysis?.inssValue || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-red-400">IRRF:</span>
                                            <span className="text-red-400">{formatCurrency(scenario.proLaboreAnalysis?.irrfValue || 0)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold pt-2 border-t mt-2">
                                            <span>Valor Líquido Recebido:</span>
                                            <span className="text-base">{formatCurrency(scenario.proLaboreAnalysis?.netValue || 0)}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground mt-3 italic">
                                        <span className="font-semibold">Notas da IA:</span> {scenario.notes || 'N/A'}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Data Section */}
                     <div id="data" className="space-y-6 pt-10">
                        <h2 className="text-2xl font-bold tracking-tight">Dados Considerados na Análise</h2>
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações Transcritas</CardTitle>
                                <CardDescription>Este foi o texto extraído dos documentos e/ou inserido manualmente, utilizado pela IA como base para a análise.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <pre className="whitespace-pre-wrap bg-muted/50 p-4 rounded-md text-sm font-mono max-h-96 overflow-auto">
                                    {analysis.transcribedText || "Nenhum documento anexado."}
                                </pre>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary Section */}
                    <div id="summary" className="space-y-4 pt-8">
                         <h2 className="text-xl font-bold tracking-tight">Resumo Executivo e Recomendações</h2>
                        <Card className='bg-primary/10 border-primary'>
                            <CardHeader>
                                 <CardTitle className="text-lg">Conclusão da IA</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm">
                                <MarkdownRenderer content={analysis.executiveSummary || 'N/A'} />
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}

