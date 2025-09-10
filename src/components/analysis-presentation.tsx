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
import { BarChart, Briefcase, FileText, Target } from 'lucide-react';

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
    className={`flex h-full min-h-[350px] w-full flex-col justify-center rounded-lg bg-secondary/30 p-8 text-center ${className}`}
  >
    {children}
  </div>
);

export function AnalysisPresentation({ analysis }: AnalysisPresentationProps) {
  if (!analysis) return null;

  return (
    <Carousel className="w-full mt-4">
      <CarouselContent>
        {/* Slide 1: Monthly Revenue */}
        <CarouselItem>
          <Slide>
            <Briefcase className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-lg font-semibold text-muted-foreground">
              Faturamento Mensal
            </h2>
            <p className="text-4xl font-bold text-foreground">
              {analysis.monthlyRevenue || 'N/A'}
            </p>
          </Slide>
        </CarouselItem>

        {/* Slide 2: Scenarios */}
        <CarouselItem>
          <Slide>
            <BarChart className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mb-4 text-2xl font-bold text-foreground">Cenários Tributários</h2>
            <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
              {analysis.scenarios?.map((scenario, index) => (
                <Card key={index} className="bg-background/70 text-left">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{scenario.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-accent">
                      {scenario.taxValue}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      Alíquota: {scenario.taxRate}
                    </p>
                     <p className="text-xs text-muted-foreground mt-2">{scenario.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Slide>
        </CarouselItem>
        
        {/* Slide 3: IRPF Impact */}
        <CarouselItem>
            <Slide>
                 <FileText className="mx-auto h-12 w-12 text-primary" />
                 <h2 className="mt-4 mb-2 text-2xl font-bold text-foreground">Impacto no IRPF</h2>
                 <p className="whitespace-pre-wrap text-sm text-foreground/80 max-w-prose mx-auto">
                    {analysis.irpfImpact}
                 </p>
            </Slide>
        </CarouselItem>

        {/* Slide 4: Recommendation */}
        <CarouselItem>
            <Slide>
                 <Target className="mx-auto h-12 w-12 text-primary" />
                 <h2 className="mt-4 mb-2 text-2xl font-bold text-foreground">Recomendação</h2>
                 <p className="whitespace-pre-wrap text-sm font-medium text-foreground/80 max-w-prose mx-auto">
                    {analysis.recommendation}
                 </p>
            </Slide>
        </CarouselItem>

      </CarouselContent>
      <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2" />
      <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2" />
    </Carousel>
  );
}
