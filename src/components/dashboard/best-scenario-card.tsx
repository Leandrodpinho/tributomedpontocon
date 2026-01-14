'use client';

import type { ScenarioDetail } from '@/ai/flows/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Award, CheckCircle2, DollarSign, TrendingUp, Building2, Calculator } from 'lucide-react';

type BestScenarioCardProps = {
  scenario: ScenarioDetail;
  className?: string;
};

export function BestScenarioCard({ scenario, className }: BestScenarioCardProps) {
  const { proLaboreAnalysis } = scenario;

  // Calculate tax composition percentages for the visual bar
  const totalValue = (scenario.totalTaxValue || 0) + (scenario.netProfitDistribution || 0);
  const taxPercentage = totalValue > 0 ? ((scenario.totalTaxValue || 0) / totalValue) * 100 : 0;
  const profitPercentage = 100 - taxPercentage;

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-none bg-white dark:bg-slate-950 shadow-2xl ring-1 ring-slate-900/5',
        className
      )}
    >
      {/* Decorative header background */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-500 to-emerald-500" />

      <CardHeader className="pb-2 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Award className="h-4 w-4" />
              Recomendação Estratégica
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {scenario.name.replace(/Cenário para .*?:\s*/i, '')}
            </CardTitle>
          </div>
          <Badge variant="outline" className="w-fit bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 text-sm font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Melhor Eficiência
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lucro Líquido Box (Highlighted) */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-5 shadow-sm dark:from-emerald-950/20 dark:to-slate-900 dark:border-emerald-900/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 uppercase tracking-wide">
                Lucro Líquido Real
              </p>
              <DollarSign className="h-5 w-5 text-emerald-500/50" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(scenario.netProfitDistribution)}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-2 flex-1 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${profitPercentage}%` }} />
              </div>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {profitPercentage.toFixed(1)}% da Receita
              </span>
            </div>
          </div>

          {/* Carga Tributária Box */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 shadow-sm dark:bg-slate-900/50 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Carga Tributária Total
              </p>
              <Building2 className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-700 dark:text-slate-200 tracking-tight">
              {formatCurrency(scenario.totalTaxValue)}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${taxPercentage}%` }} />
              </div>
              <span className="text-xs font-medium text-slate-500">
                {formatPercentage((scenario.effectiveRate || 0) / 100)} Efetivo
              </span>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-100 dark:bg-slate-800" />

        {/* Detailed Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase">Faturamento Base</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-200">
              {formatCurrency(scenario.scenarioRevenue)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase">Pró-Labore</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-200">
              {proLaboreAnalysis ? formatCurrency(proLaboreAnalysis.baseValue) : '-'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase">Alíquota Efetiva</p>
            <div className="flex items-center gap-1.5 text-lg font-semibold text-slate-900 dark:text-slate-200">
              <Calculator className="h-4 w-4 text-slate-400" />
              {formatPercentage((scenario.effectiveRate || 0) / 100)}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase">Custo/Funcionário</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-200">
              {scenario.taxCostPerEmployee ? formatCurrency(scenario.taxCostPerEmployee) : '-'}
            </p>
          </div>
        </div>

        {/* Notes Section with Styled Background */}
        <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-4 dark:bg-indigo-950/20 dark:border-indigo-900/50">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 bg-indigo-100 rounded-md dark:bg-indigo-900/50">
              <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                Análise do Especialista
              </p>
              <p className="text-sm text-indigo-700/80 leading-relaxed dark:text-indigo-300/80">
                {scenario.notes}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
