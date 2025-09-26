'use client';

import type { ScenarioDetail } from '@/ai/flows/types';
import { KpiCard } from '@/components/kpi-card';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { Banknote, Crown, Percent } from 'lucide-react';

type ScenarioMetricsProps = {
  bestScenario?: ScenarioDetail;
  worstScenario?: ScenarioDetail;
  monthlySavings: number;
  annualSavings: number;
  economyShare: number; // valor em decimal (0.12 = 12%)
};

export function ScenarioMetrics({
  bestScenario,
  worstScenario,
  monthlySavings,
  annualSavings,
  economyShare,
}: ScenarioMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Melhor Cenário"
        value={bestScenario?.name.replace(/Cenário para .*?:\s*/i, '') ?? 'Aguardando análise'}
        subValue={bestScenario ? 'Menor carga tributária para o faturamento atual.' : 'Envie dados para gerar os cenários.'}
        icon={<Crown className="h-6 w-6" />}
        highlight="primary"
        className="min-h-[160px]"
      />
      <KpiCard
        title="Economia Mensal"
        value={formatCurrency(monthlySavings)}
        subValue={worstScenario ? `Comparação com ${worstScenario.name.split(':')[0].trim()}` : 'Dependente da análise completa.'}
        icon={<Banknote className="h-6 w-6" />}
        highlight="accent"
        className="min-h-[160px]"
      />
      <KpiCard
        title="Economia Anual"
        value={formatCurrency(annualSavings)}
        subValue="Projeção em 12 meses mantendo o faturamento."
        icon={<Banknote className="h-6 w-6" />}
        highlight="neutral"
        hint="Ideal para orientar planos de reinvestimento em estrutura e pessoal."
        className="min-h-[160px]"
      />
      <KpiCard
        title="% de Economia"
        value={formatPercentage(economyShare)}
        subValue="Redução percentual sobre o cenário menos eficiente."
        icon={<Percent className="h-6 w-6" />}
        highlight="success"
        trend={{
          direction: economyShare >= 0 ? 'up' : 'down',
          label: economyShare >= 0 ? 'Economia positiva' : 'Economia negativa',
        }}
        className="min-h-[160px]"
      />
    </div>
  );
}
