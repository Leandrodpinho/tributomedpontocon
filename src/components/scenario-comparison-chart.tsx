"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, type LegendProps } from "recharts"
import { formatCurrency } from "@/lib/formatters";

interface ChartData {
  name: string;
  totalTax: number;
  netProfit: number;
}

interface ScenarioComparisonChartProps {
  data: ChartData[];
}

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const totalTax = payload.find((p) => p.dataKey === 'totalTax')?.value || 0;
    const netProfit = payload.find((p) => p.dataKey === 'netProfit')?.value || 0;
    const total = totalTax + netProfit;

    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Lucro Líquido
            </span>
            <span className="text-xs font-medium tabular-nums text-slate-900 dark:text-slate-50">
              {formatCurrency(netProfit)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Carga Tributária
            </span>
            <span className="text-xs font-medium tabular-nums text-slate-900 dark:text-slate-50">
              {formatCurrency(totalTax)}
            </span>
          </div>
          <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {((netProfit / total) * 100).toFixed(1)}%
            </span> de margem líquida
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const LegendContent = ({ payload }: LegendProps) => {
  if (!payload?.length) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground justify-center">
      {payload.map(item => (
        <span key={item.dataKey ?? item.value} className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.value}
        </span>
      ))}
    </div>
  )
}

export function ScenarioComparisonChart({ data }: ScenarioComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(320, data.length * 80)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 32, left: 0, bottom: 20 }}
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} opacity={0.5} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          stroke="hsl(var(--muted-foreground))"
          domain={[0, 'dataMax']}
          fontSize={11}
          tickFormatter={(value) =>
            new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact',
              compactDisplay: 'short',
            }).format(value)
          }
        />
        <YAxis
          type="category"
          dataKey="name"
          width={180}
          tickLine={false}
          axisLine={false}
          stroke="hsl(var(--foreground))"
          fontSize={12}
          fontWeight={500}
        />
        <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.3)' }} content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          align="center"
          height={36}
          content={({ payload }) => <LegendContent payload={payload} />}
        />
        <Bar
          dataKey="netProfit"
          name="Lucro Líquido"
          fill="hsl(158, 64%, 52%)"
          radius={[0, 4, 4, 0]}
          barSize={24}
        />
        <Bar
          dataKey="totalTax"
          name="Carga Tributária"
          fill="hsl(215, 16%, 47%)"
          radius={[0, 4, 4, 0]}
          barSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
