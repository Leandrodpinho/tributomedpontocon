'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

type ComparisonChartProps = {
    currentValue: number;
    proposedValue: number;
    currentLabel: string;
    proposedLabel: string;
};

export function ComparisonChart({ currentValue, proposedValue, currentLabel, proposedLabel }: ComparisonChartProps) {
    const data = [
        {
            name: 'Atual',
            value: currentValue,
            label: currentLabel,
            color: '#f59e0b', // amber-500
        },
        {
            name: 'Proposto',
            value: proposedValue,
            label: proposedLabel,
            color: '#10b981', // emerald-500
        },
    ];

    const maxValue = Math.max(currentValue, proposedValue);
    const yAxisMax = Math.ceil(maxValue * 1.2 / 1000) * 1000; // Round up to nearest 1000

    return (
        <div className="w-full h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fill: '#475569', fontSize: 14, fontWeight: 500 }}
                    />
                    <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                        domain={[0, yAxisMax]}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            color: '#0f172a',
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Carga Tributária']}
                        labelStyle={{ color: '#475569', fontWeight: 600 }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={80}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
