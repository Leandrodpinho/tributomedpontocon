'use client';

import type { ScenarioDetail } from '@/ai/flows/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const colors = ['from-brand-500 to-brand-400', 'from-accent to-brand-500', 'from-lime-300 to-lime-400', 'from-amber-300 to-orange-400', 'from-rose-400 to-rose-500'];

type ScenarioTaxBreakdownProps = {
  scenario: ScenarioDetail;
  className?: string;
};

export function ScenarioTaxBreakdown({ scenario, className }: ScenarioTaxBreakdownProps) {
  const breakdown = scenario.taxBreakdown ?? [];
  const maxValue = breakdown.length > 0 ? Math.max(...breakdown.map(tax => tax.value)) : 0;

  return (
    <Card className={cn('border border-slate-200 shadow-sm transition-colors duration-200 dark:border-slate-700', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Detalhamento dos Tributos</CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Distribuição dos impostos que compõem a carga tributária total.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {breakdown.length === 0 && (
          <p className="text-sm text-slate-600 dark:text-slate-300">Nenhum tributo detalhado para este cenário.</p>
        )}
        {breakdown.map((tax, index) => {
          const width = maxValue > 0 ? Math.max((tax.value / maxValue) * 100, 12) : 0;
          return (
            <div key={tax.name + index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800 dark:text-white">{tax.name}</span>
                <span className="text-slate-600 dark:text-slate-300">{formatCurrency(tax.value)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-2 rounded-full bg-gradient-to-r transition-all duration-300 shadow-sm',
                    colors[index % colors.length]
                  )}
                  style={{ width: `${width}%` }}
                />
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {formatPercentage((tax.rate || 0) / 100, 1)}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
