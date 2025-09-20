'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const KpiCard = ({ title, value, subValue, className = '' }: { title: string, value: string, subValue?: string, className?: string }) => (
    <Card className={className}>
        <CardHeader className="pb-2">
            <CardDescription className="text-sm">{title}</CardDescription>
            <CardTitle className="text-xl">{value}</CardTitle>
        </CardHeader>
        {subValue &&
            <CardContent>
                <p className="text-xs text-muted-foreground">{subValue}</p>
            </CardContent>
        }
    </Card>
);