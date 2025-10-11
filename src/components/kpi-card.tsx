'use client';

import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type KpiTrend = {
  direction: 'up' | 'down' | 'flat';
  label: string;
};

type KpiCardProps = {
  title: string;
  value: string;
  subValue?: string;
  hint?: string;
  icon?: ReactNode;
  highlight?: 'primary' | 'accent' | 'success' | 'neutral';
  trend?: KpiTrend;
  className?: string;
};

const highlightClasses: Record<NonNullable<KpiCardProps['highlight']>, string> = {
  primary:
    'bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white border-transparent shadow-lg',
  accent:
    'bg-[hsl(var(--accent)_/_0.18)] text-brand-700 dark:text-brand-200 border border-[hsl(var(--accent))] shadow-md',
  success:
    'bg-gradient-to-br from-lime-300 via-lime-400 to-lime-500 text-emerald-900 border-transparent shadow-lg',
  neutral:
    'bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border border-[hsl(var(--border))] shadow-sm',
};

const trendIconMap: Record<KpiTrend['direction'], ReactNode> = {
  up: <ArrowUpRight className="h-4 w-4" aria-hidden />,
  down: <ArrowDownRight className="h-4 w-4" aria-hidden />,
  flat: <ArrowRight className="h-4 w-4" aria-hidden />,
};

export const KpiCard = ({
  title,
  value,
  subValue,
  hint,
  icon,
  trend,
  highlight = 'neutral',
  className = '',
}: KpiCardProps) => {
  const isVibrant = highlight === 'primary' || highlight === 'success';
  const iconWrapper = highlight === 'primary'
    ? 'text-white/90 bg-white/15'
    : highlight === 'success'
      ? 'text-emerald-900 bg-white/30'
      : 'text-brand-600 dark:text-brand-200 bg-[hsl(var(--accent)_/_0.18)]';
  const trendBadge = isVibrant
    ? 'bg-white/20 text-white'
    : 'bg-[hsl(var(--accent)_/_0.18)] text-brand-700 dark:text-brand-200';

  return (
    <Card
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden border transition-transform duration-150 hover:-translate-y-0.5',
        highlightClasses[highlight],
        className
      )}
    >
      {icon && (
        <div className={cn('absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-70', iconWrapper)} aria-hidden />
      )}
      <CardHeader className="flex flex-col gap-2 pb-0">
        <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
          {title}
        </CardDescription>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl font-semibold leading-tight md:text-2xl lg:text-[1.55rem] lg:leading-8 min-h-[2.75rem]">
            {value}
          </CardTitle>
          {icon && <div className={cn('shrink-0 pt-1', isVibrant ? 'text-white' : 'text-brand-600')}>{icon}</div>}
        </div>
      </CardHeader>
      <CardContent className="mt-auto space-y-3 pt-3">
        {subValue && (
          <p className="text-sm text-muted-foreground min-h-[3.6rem]">
            {subValue}
          </p>
        )}
        {hint && (
          <p className="text-xs text-muted-foreground/90 min-h-[2.2rem]">
            {hint}
          </p>
        )}
        {trend && (
          <div className={cn('inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium', trendBadge)}>
            {trendIconMap[trend.direction]}
            <span>{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
