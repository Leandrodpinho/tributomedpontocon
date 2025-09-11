'use client';

import type { GenerateTaxScenariosOutput } from '@/ai/flows/generate-tax-scenarios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Target, TrendingUp, Wallet, PieChart } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScenarioComparisonChart } from '@/components/scenario-comparison-chart';


type AnalysisPresentationProps = {
  analysis: GenerateTaxScenariosOutput;
};

const Slide = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`flex h-full min-h-[550px] w-full flex-col justify-center rounded-lg bg-secondary/30 p-6 md:p-8 text-center ${className}`}
  >
    {children}
  </div>
);

// Helper to parse currency strings like "R$ 1.234,56" into numbers
const parseCurrency = (value: string): number => {
    if (!value) return 0;
    return parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
}

export function AnalysisPresentation({ analysis }: AnalysisPresentationProps) {
  if (!analysis) return null;

  const currentRevenueScenarios = analysis.scenarios.filter(s => s.name.includes(analysis.monthlyRevenue));

  const chartData = currentRevenueScenarios.map(scenario => ({
    name: scenario.name.replace(/ com Faturamento de R\$ \d+\.\d+,\d+/i, ''), // Simplify name for chart
    totalTax: parseCurrency(scenario.totalTaxValue),
    netProfit: parseCurrency(scenario.netProfitDistribution),
  }));


  return (
    <Carousel className="w-full mt-4">
      <CarouselContent>
         {/* Slide 0: Visual Comparison Chart */}
         <CarouselItem>
            <Slide className="justify-start">
                 <h2 className="mb-4 text-2xl font-bold text-foreground">Comparativo Visual (Faturamento Atual)</h2>
                 <p className="text-sm text-muted-foreground mb-4">Análise da Carga Tributária vs. Lucro Líquido para o Sócio.</p>
                 <Card className='bg-background/70 pt-6'>
                    <CardContent>
                        <ScenarioComparisonChart data={chartData} />
                    </CardContent>
                 </Card>
            </Slide>
        </CarouselItem>

        {/* Slide 1: Executive Summary */}
        <CarouselItem>
          <Slide>
            <Target className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 mb-2 text-2xl font-bold text-foreground">Resumo Executivo e Projeções</h2>
            <p className="whitespace-pre-wrap text-sm font-medium text-foreground/80 max-w-prose mx-auto">
              {analysis.executiveSummary}
            </p>
            <p className="mt-6 text-lg font-semibold text-muted-foreground">
              Faturamento Mensal Analisado: <span className="text-foreground font-bold">{analysis.monthlyRevenue || 'N/A'}</span>
            </p>
          </Slide>
        </CarouselItem>

        {/* Slides for each Scenario */}
        {analysis.scenarios?.map((scenario, index) => (
          <CarouselItem key={index}>
            <Slide className="justify-start">
              <h2 className="mb-4 text-xl md:text-2xl font-bold text-foreground">{scenario.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <Card className="bg-background/70">
                      <CardHeader className='pb-2'>
                          <CardTitle className='text-base flex items-center gap-2'><TrendingUp className='text-primary'/>Carga Tributária Total</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-3xl font-bold text-destructive">{scenario.totalTaxValue}</p>
                          <p className="text-sm font-semibold text-foreground">Alíquota Efetiva: {scenario.effectiveRate}</p>
                      </CardContent>
                  </Card>
                   <Card className="bg-background/70">
                      <CardHeader className='pb-2'>
                          <CardTitle className='text-base flex items-center gap-2'><Wallet className='text-primary'/>Lucro Líquido para o Sócio</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-3xl font-bold text-green-400">{scenario.netProfitDistribution}</p>
                           <p className="text-sm text-muted-foreground">Disponível após impostos e pró-labore</p>
                      </CardContent>
                  </Card>
              </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 text-left">
              <Card className="bg-background/70">
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base'>Análise do Pró-Labore</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                   <p>
                    <span className="font-semibold">Valor Bruto:</span> {scenario.proLaboreAnalysis.baseValue}
                  </p>
                  <p>
                    <span className="font-semibold text-red-400">INSS (11%):</span> {scenario.proLaboreAnalysis.inssValue}
                  </p>
                  <p>
                    <span className="font-semibold text-red-400">IRRF:</span> {scenario.proLaboreAnalysis.irrfValue}
                  </p>
                  <p className="font-bold pt-1">
                    <span >Valor Líquido:</span> {scenario.proLaboreAnalysis.netValue}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-background/70">
                 <CardHeader className='pb-2'>
                    <CardTitle className='text-base flex items-center gap-2'><PieChart className='text-primary'/>Detalhamento dos Tributos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table className="text-xs">
                        <TableHeader>
                            <TableRow>
                            <TableHead className="h-8">Tributo</TableHead>
                            <TableHead className="h-8 text-right">Valor</TableHead>
                            <TableHead className="h-8 text-right">Alíquota</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scenario.taxBreakdown.map((tax, idx) => (
                            <TableRow key={idx} className="h-8">
                                <TableCell className="py-1">{tax.name}</TableCell>
                                <TableCell className="py-1 text-right">{tax.value}</TableCell>
                                <TableCell className="py-1 text-right">{tax.rate}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
              </Card>
            </div>
             <p className="text-xs text-muted-foreground mt-4 text-left italic">
                <span className="font-semibold">Notas da IA:</span> {scenario.notes}
            </p>
            </Slide>
          </CarouselItem>
        ))}

      </CarouselContent>
      <CarouselPrevious className="hidden md:flex absolute left-[-50px] top-1/2 -translate-y-1/2" />
      <CarouselNext className="hidden md:flex absolute right-[-50px] top-1/2 -translate-y-1/2" />
    </Carousel>
  );
}
