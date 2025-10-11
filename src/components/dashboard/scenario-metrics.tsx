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
  const cards = [
    {
      key: 'best',
      props: {
        title: 'Melhor Cenário',
        value: bestScenario?.name.replace(/Cenário para .*?:\s*/i, '') ?? 'Aguardando análise',
        subValue: bestScenario
          ? 'Menor carga tributária indicada para o faturamento atual.'
          : 'Envie dados para gerar os cenários.',
        icon: <Crown className="h-6 w-6" />,
        highlight: 'primary' as const,
      },
    },
    {
      key: 'monthly',
      props: {
        title: 'Economia Mensal',
        value: formatCurrency(monthlySavings),
        subValue: worstScenario
          ? `Comparação com ${worstScenario.name.split(':')[0].trim()}`
          : 'Dependente da análise completa.',
        icon: <Banknote className="h-6 w-6" />,
        highlight: 'accent' as const,
      },
    },
    {
      key: 'annual',
      props: {
        title: 'Economia Anual',
        value: formatCurrency(annualSavings),
        subValue: 'Projeção em 12 meses mantendo o faturamento.',
        icon: <Banknote className="h-6 w-6" />,
        highlight: 'neutral' as const,
        hint: 'Referência útil para planos de reinvestimento em estrutura e pessoal.',
      },
    },
    {
      key: 'percentage',
      props: {
        title: '% de Economia',
        value: formatPercentage(economyShare),
        subValue: 'Redução percentual em relação ao cenário menos eficiente.',
        icon: <Percent className="h-6 w-6" />,
        highlight: 'success' as const,
        trend: {
          direction: economyShare >= 0 ? 'up' : 'down',
          label: economyShare >= 0 ? 'Economia positiva' : 'Economia negativa',
        },
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap">
      {cards.map(card => (
        <div
          key={card.key}
          className="flex flex-1 basis-[260px] flex-col gap-4 sm:max-w-[320px]"
        >
          <KpiCard {...card.props} className="h-full" />
        </div>
      ))}
    </div>
  )
}
