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
    'bg-white text-brand-700 border border-brand-200 shadow-md dark:bg-slate-900/70 dark:text-brand-200 dark:border-brand-500/40',
  success:
    'bg-gradient-to-br from-lime-300 via-lime-400 to-lime-500 text-emerald-900 border-transparent shadow-lg',
  neutral:
    'bg-white text-slate-900 border border-slate-200 shadow-sm dark:bg-slate-900/80 dark:text-slate-100 dark:border-slate-700',
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
      : 'text-brand-600 bg-brand-500/10 dark:bg-brand-500/20';
  const trendBadge = isVibrant
    ? 'bg-white/20 text-white'
    : 'bg-brand-500/10 text-brand-700 dark:text-brand-200';

  return (
    <Card
      className={cn(
        'relative overflow-hidden border transition-transform duration-150 hover:-translate-y-0.5',
        highlightClasses[highlight],
        className
      )}
    >
      {icon && (
        <div className={cn('absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-70', iconWrapper)} aria-hidden />
      )}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardDescription className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
              {title}
            </CardDescription>
            <CardTitle className="mt-1 text-2xl font-semibold md:text-3xl">
              {value}
            </CardTitle>
          </div>
          {icon && <div className={cn('ml-4 mt-1', isVibrant ? 'text-white' : 'text-brand-600')}>{icon}</div>}
        </div>
        {hint && <p className="mt-3 text-xs text-slate-500 dark:text-slate-300">{hint}</p>}
      </CardHeader>
      {(subValue || trend) && (
        <CardContent className="pt-0">
          {subValue && <p className="text-sm text-slate-600 dark:text-slate-300">{subValue}</p>}
          {trend && (
            <div className={cn('mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium', trendBadge)}>
              {trendIconMap[trend.direction]}
              <span>{trend.label}</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
