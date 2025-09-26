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
        'relative overflow-hidden border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white text-foreground shadow-elevated dark:border-brand-500/40 dark:from-brand-500 dark:via-brand-600 dark:to-brand-700 dark:text-white',
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-brand-200/60 dark:bg-white/10"
        aria-hidden
      />
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-white/40 dark:bg-white/5" aria-hidden />
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-brand-700 dark:text-white/80">
          <Award className="h-4 w-4" />
          Cenário Recomendado
        </div>
        <CardTitle className="text-2xl font-semibold text-foreground md:text-3xl dark:text-white">
          {scenario.name.replace(/Cenário para .*?:\s*/i, '')}
        </CardTitle>
        <p className="text-sm text-muted-foreground dark:text-white/80">
          Faturamento analisado: {formatCurrency(scenario.scenarioRevenue)}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-brand-100 bg-brand-50/80 p-4 dark:border-white/20 dark:bg-white/10">
            <p className="text-xs uppercase tracking-wide text-brand-700 dark:text-white/70">Carga Tributária</p>
            <p className="mt-2 text-2xl font-semibold text-foreground dark:text-white">
              {formatCurrency(scenario.totalTaxValue)}
            </p>
            <Badge
              variant="secondary"
              className="mt-3 border-brand-200 bg-brand-100 text-xs text-brand-700 dark:border-white/40 dark:bg-white/20 dark:text-white"
            >
              {formatPercentage((scenario.effectiveRate || 0) / 100)} do faturamento
            </Badge>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-white/20 dark:bg-white/10">
            <p className="text-xs uppercase tracking-wide text-emerald-600 dark:text-white/70">Lucro Líquido para Sócios</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700 dark:text-lime-200">
              {formatCurrency(scenario.netProfitDistribution)}
            </p>
            {scenario.taxCostPerEmployee !== undefined && (
              <p className="mt-3 text-xs text-muted-foreground dark:text-white/70">
                Custo tributário por funcionário: {formatCurrency(scenario.taxCostPerEmployee)}
              </p>
            )}
          </div>
        </div>
        <Separator className="border-brand-100 dark:border-white/20" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-lg border border-brand-100 bg-white/70 p-3 dark:border-white/20 dark:bg-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-white/70">
              <TrendingUp className="h-4 w-4" /> Alíquota Efetiva
            </div>
            <p className="text-lg font-semibold text-foreground dark:text-white">
              {formatPercentage((scenario.effectiveRateOnProfit || scenario.effectiveRate || 0) / 100)}
            </p>
            <p className="text-xs text-muted-foreground dark:text-white/60">
              Calculada sobre o lucro incluindo tributação direta sobre o pró-labore.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-brand-100 bg-white/70 p-3 dark:border-white/20 dark:bg-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-white/70">
              <LineChart className="h-4 w-4" /> Pró-Labore
            </div>
            {proLaboreAnalysis ? (
              <div>
                <p className="text-lg font-semibold text-foreground dark:text-white">
                  {formatCurrency(proLaboreAnalysis.baseValue)}
                </p>
                <p className="text-xs text-muted-foreground dark:text-white/70">
                  INSS: {formatCurrency(proLaboreAnalysis.inssValue)} • IRRF: {formatCurrency(proLaboreAnalysis.irrfValue)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground dark:text-white/70">Sem informações de pró-labore.</p>
            )}
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-brand-100 bg-white/70 p-3 dark:border-white/20 dark:bg-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-white/70">
              <TrendingUp className="h-4 w-4 rotate-180" /> Destaques
            </div>
            <p className="text-sm text-muted-foreground dark:text-white/80">
              {scenario.notes}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
