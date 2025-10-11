'use client';

import type { ScenarioDetail } from '@/ai/flows/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Award, LineChart, TrendingUp } from 'lucide-react';

type BestScenarioCardProps = {
  scenario: ScenarioDetail;
  className?: string;
};

export function BestScenarioCard({ scenario, className }: BestScenarioCardProps) {
  const { proLaboreAnalysis } = scenario;

  return (
    <Card
      className={cn(
        'relative overflow-hidden border border-[hsl(var(--accent))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-elevated',
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-[hsl(var(--accent)_/_0.25)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-[hsl(var(--accent)_/_0.1)]" aria-hidden />
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-200">
          <Award className="h-4 w-4" />
          Cenário Recomendado
        </div>
        <CardTitle className="max-w-2xl text-xl font-semibold leading-tight text-foreground sm:text-2xl">
          {scenario.name.replace(/Cenário para .*?:\s*/i, '')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Faturamento analisado: {formatCurrency(scenario.scenarioRevenue)}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[hsl(var(--accent))] bg-[hsl(var(--secondary))] p-4">
            <p className="text-xs uppercase tracking-wide text-brand-600 dark:text-brand-200">Carga Tributária</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatCurrency(scenario.totalTaxValue)}
            </p>
            <Badge
              variant="secondary"
              className="mt-3 border-[hsl(var(--accent))] bg-[hsl(var(--accent)_/_0.16)] text-xs text-brand-600 dark:text-brand-200"
            >
              {formatPercentage((scenario.effectiveRate || 0) / 100)} do faturamento
            </Badge>
          </div>
          <div className="rounded-xl border border-emerald-400/60 bg-emerald-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-200">Lucro Líquido para Sócios</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-200">
              {formatCurrency(scenario.netProfitDistribution)}
            </p>
            {scenario.taxCostPerEmployee !== undefined && (
              <p className="mt-3 text-xs text-muted-foreground">
                Custo tributário por funcionário: {formatCurrency(scenario.taxCostPerEmployee)}
              </p>
            )}
          </div>
        </div>
        <Separator className="border-[hsl(var(--accent))]" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-lg border border-[hsl(var(--accent))] bg-[hsl(var(--secondary))] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-200">
              <TrendingUp className="h-4 w-4" /> Alíquota Efetiva
            </div>
            <p className="text-lg font-semibold text-foreground">
              {formatPercentage((scenario.effectiveRateOnProfit || scenario.effectiveRate || 0) / 100)}
            </p>
            <p className="text-xs text-muted-foreground">
              Calculada sobre o lucro incluindo tributação direta sobre o pró-labore.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-[hsl(var(--accent))] bg-[hsl(var(--secondary))] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-200">
              <LineChart className="h-4 w-4" /> Pró-Labore
            </div>
            {proLaboreAnalysis ? (
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(proLaboreAnalysis.baseValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  INSS: {formatCurrency(proLaboreAnalysis.inssValue)} • IRRF: {formatCurrency(proLaboreAnalysis.irrfValue)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem informações de pró-labore.</p>
            )}
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-[hsl(var(--accent))] bg-[hsl(var(--secondary))] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-200">
              <TrendingUp className="h-4 w-4 rotate-180" /> Destaques
            </div>
            <p className="text-sm text-muted-foreground">
              {scenario.notes}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
