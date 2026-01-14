/**
 * Componente de Análise de Impactos da Reforma Tributária
 * Exibe comparação entre cenários atuais e pós-reforma (CBS/IBS)
 */

'use client';

import { useReformImpact } from '@/hooks/use-reform-impact';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    TrendingDown,
    TrendingUp,
    Calendar,
    AlertCircle,
    Lightbulb,
    ArrowRight,
    Loader2,
    FileText
} from 'lucide-react';

export function ImpactAnalysis() {
    const { impactReport, loading, error, hasData } = useReformImpact();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Carregando análise...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-3 p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                    <p className="font-semibold text-destructive">Erro ao carregar análise</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    if (!hasData || !impactReport) {
        return (
            <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Análise Personalizada</h3>
                <p className="text-muted-foreground mb-4">
                    A análise de impacto será exibida automaticamente após gerar cenários tributários
                </p>
                <Button onClick={() => window.location.href = '/'} variant="outline">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Ir para o Planejador
                </Button>
            </div>
        );
    }

    const { comparison, timeline, executiveSummary } = impactReport;
    const isReduction = !comparison.difference.isIncrease;

    return (
        <div className="space-y-6">
            {/* Header com resumo */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl">
                                Análise de Impactos - {impactReport.clientName}
                            </CardTitle>
                            <CardDescription>
                                Comparação entre cenário atual e pós-reforma tributária (CBS/IBS)
                            </CardDescription>
                        </div>
                        <Badge
                            variant={isReduction ? 'default' : 'destructive'}
                            className="text-sm px-3 py-1"
                        >
                            {isReduction ? (
                                <><TrendingDown className="h-4 w-4 mr-1" /> Redução de Carga</>
                            ) : (
                                <><TrendingUp className="h-4 w-4 mr-1" /> Aumento de Carga</>
                            )}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Faturamento Mensal</p>
                            <p className="text-2xl font-bold">
                                R$ {impactReport.clientData.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Regime Atual</p>
                            <p className="text-lg font-semibold">{impactReport.clientData.currentRegime}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Setor</p>
                            <p className="text-lg font-semibold">{impactReport.clientData.sector}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Comparação Antes vs Depois */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cenário Atual */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-lg">📊 Hoje (2025)</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Regime</p>
                            <p className="text-xl font-bold">{comparison.current.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Carga Tributária Mensal</p>
                            <p className="text-3xl font-bold text-primary">
                                R$ {comparison.current.totalTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {comparison.current.effectiveRate.toFixed(2)}% do faturamento
                            </p>
                        </div>
                        <div className="pt-4 border-t">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Composição:</p>
                            {comparison.current.taxBreakdown.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm mb-1">
                                    <span>{item.name}</span>
                                    <span className="font-semibold">
                                        R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Cenário Pós-Reforma */}
                <Card className="border-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-lg">🚀 Pós-Reforma (2033)</span>
                            <Badge variant="outline">CBS + IBS</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Regime</p>
                            <p className="text-xl font-bold">{comparison.reform.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Carga Tributária Mensal</p>
                            <p className="text-3xl font-bold text-primary">
                                R$ {comparison.reform.totalTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {comparison.reform.effectiveRate.toFixed(2)}% do faturamento
                            </p>
                        </div>
                        <div className="pt-4 border-t">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Composição:</p>
                            {comparison.reform.breakdown.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm mb-1">
                                    <span>{item.name}</span>
                                    <span className="font-semibold">
                                        R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Impacto Financeiro */}
            <Card className={isReduction ? 'border-green-500' : 'border-orange-500'}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        💰 Impacto Financeiro
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Diferença Mensal</p>
                            <p className={`text-2xl font-bold ${isReduction ? 'text-green-600' : 'text-orange-600'}`}>
                                {isReduction ? '-' : '+'} R$ {Math.abs(comparison.difference.absolute).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {Math.abs(comparison.difference.percentage).toFixed(1)}% {isReduction ? 'de redução' : 'de aumento'}
                            </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Impacto Anual</p>
                            <p className={`text-2xl font-bold ${isReduction ? 'text-green-600' : 'text-orange-600'}`}>
                                {isReduction ? '-' : '+'} R$ {Math.abs(comparison.difference.annualImpact).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Resultado</p>
                            <p className="text-lg font-semibold">
                                {isReduction ? '✅ Economia' : '⚠️ Aumento de Custos'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mudanças Operacionais */}
            <Card>
                <CardHeader>
                    <CardTitle>🔄 Mudanças Operacionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1">Split Payment</Badge>
                            <div className="flex-1">
                                <p className="font-semibold mb-1">Retenção Automática</p>
                                <p className="text-sm text-muted-foreground">
                                    {comparison.operationalChanges.splitPayment.description}
                                </p>
                            </div>
                            <Badge variant="default">Positivo</Badge>
                        </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1">Creditamento</Badge>
                            <div className="flex-1">
                                <p className="font-semibold mb-1">Não-Cumulatividade Total</p>
                                <p className="text-sm text-muted-foreground">
                                    {comparison.operationalChanges.creditamento.description}
                                </p>
                            </div>
                            <Badge variant="default">Positivo</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Oportunidades */}
            {comparison.opportunities.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            Oportunidades
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {comparison.opportunities.map((opp, index) => (
                                <div key={index} className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                                    <p className="font-semibold text-green-900 dark:text-green-100">{opp.title}</p>
                                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">{opp.description}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Alertas */}
            {comparison.warnings.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Pontos de Atenção
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {comparison.warnings.map((warning, index) => (
                                <div key={index} className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <Badge variant={
                                            warning.severity === 'high' ? 'destructive' :
                                                warning.severity === 'medium' ? 'default' : 'secondary'
                                        }>
                                            {warning.severity === 'high' ? 'Alta' :
                                                warning.severity === 'medium' ? 'Média' : 'Baixa'}
                                        </Badge>
                                        <div className="flex-1">
                                            <p className="font-semibold text-orange-900 dark:text-orange-100">{warning.title}</p>
                                            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">{warning.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Timeline de Transição */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Cronograma de Transição (2026-2033)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {timeline.map((item, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                        {item.year}
                                    </div>
                                    {index < timeline.length - 1 && (
                                        <div className="w-0.5 h-full bg-border mt-2" />
                                    )}
                                </div>
                                <div className="flex-1 pb-8">
                                    <h4 className="font-semibold text-lg mb-1">{item.phase}</h4>
                                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                                    <p className="text-sm font-medium mb-2">
                                        <span className="text-muted-foreground">Impacto esperado:</span> {item.expectedImpact}
                                    </p>
                                    {item.actionItems.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs font-semibold text-muted-foreground mb-1">Ações recomendadas:</p>
                                            <ul className="text-sm space-y-1">
                                                {item.actionItems.map((action, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-primary mt-0.5">•</span>
                                                        <span>{action}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Resumo Executivo */}
            <Card className="bg-muted">
                <CardHeader>
                    <CardTitle>📋 Resumo Executivo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Principais Conclusões:</h4>
                            <ul className="space-y-2">
                                {executiveSummary.keyFindings.map((finding, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <span className="text-primary mt-0.5">✓</span>
                                        <span>{finding}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Recomendações:</h4>
                            <ul className="space-y-2">
                                {executiveSummary.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <span className="text-primary mt-0.5">→</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
