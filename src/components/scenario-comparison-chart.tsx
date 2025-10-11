"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, type LegendProps } from "recharts"

interface ChartData {
    name: string;
    totalTax: number;
    netProfit: number;
}

interface ScenarioComparisonChartProps {
    data: ChartData[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const LegendContent = ({ payload }: LegendProps) => {
  if (!payload?.length) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
      {payload.map(item => (
        <span key={item.dataKey ?? item.value} className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: item.color ?? "hsl(var(--primary))" }}
          />
          {item.value}
        </span>
      ))}
    </div>
  )
}

export function ScenarioComparisonChart({ data }: ScenarioComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 72)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 16, right: 32, left: 0, bottom: 16 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          stroke="hsl(var(--muted-foreground))"
          domain={[0, 'dataMax']}
          fontSize={12}
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
          width={200}
          tickLine={false}
          axisLine={false}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--secondary))' }}
          contentStyle={{
            background: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius)',
          }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Legend
          verticalAlign="bottom"
          align="left"
          height={48}
          content={props => <LegendContent {...props} />}
        />
        <Bar dataKey="totalTax" name="Carga Tributária" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="netProfit" name="Lucro Líquido" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
