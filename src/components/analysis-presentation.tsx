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
import { Briefcase, FileText, Target, TrendingUp, Wallet } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


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
    className={`flex h-full min-h-[450px] w-full flex-col justify-center rounded-lg bg-secondary/30 p-8 text-center ${className}`}
  >
    {children}
  </div>
);

export function AnalysisPresentation({ analysis }: AnalysisPresentationProps) {
  if (!analysis) return null;

  return (
    <Carousel className="w-full mt-4">
      <CarouselContent>
        {/* Slide 1: Executive Summary */}
        <CarouselItem>
          <Slide>
            <Target className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 mb-2 text-2xl font-bold text-foreground">Resumo Executivo</h2>
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
              <h2 className="mb-4 text-2xl font-bold text-foreground">{scenario.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <Card className="bg-background/70">
                      <CardHeader className='pb-2'>
                          <CardTitle className='text-base flex items-center gap-2'><TrendingUp className='text-primary'/>Carga Tributária Total</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-3xl font-bold text-accent">{scenario.totalTaxValue}</p>
                          <p className="text-sm font-semibold text-foreground">Alíquota Efetiva: {scenario.effectiveRate}</p>
                      </CardContent>
                  </Card>
                   <Card className="bg-background/70">
                      <CardHeader className='pb-2'>
                          <CardTitle className='text-base flex items-center gap-2'><Wallet className='text-primary'/>Lucro Líquido para o Sócio</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-3xl font-bold text-green-400">{scenario.netProfitDistribution}</p>
                           <p className="text-sm text-muted-foreground">Disponível após impostos</p>
                      </CardContent>
                  </Card>
              </div>

              <div className="mt-4 text-left">
                <h3 className="font-semibold text-foreground mb-2">Detalhamento dos Tributos</h3>
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Tributo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Alíquota</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {scenario.taxBreakdown.map((tax, idx) => (
                        <TableRow key={idx}>
                            <TableCell>{tax.name}</TableCell>
                            <TableCell>{tax.value}</TableCell>
                            <TableCell>{tax.rate}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <p className="text-xs text-muted-foreground mt-2">{scenario.notes}</p>
              </div>
            </Slide>
          </CarouselItem>
        ))}

      </CarouselContent>
      <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2" />
      <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2" />
    </Carousel>
  );
}
