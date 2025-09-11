"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

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

export function ScenarioComparisonChart({ data }: ScenarioComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 40, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          angle={-45}
          textAnchor="end"
          height={60}
          interval={0}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact',
            compactDisplay: 'short'
          }).format(value)}
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
          iconSize={10}
          wrapperStyle={{ fontSize: '12px', paddingTop: '40px' }}
          verticalAlign="bottom"
        />
        <Bar dataKey="totalTax" name="Carga Tributária" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="netProfit" name="Lucro Líquido" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
