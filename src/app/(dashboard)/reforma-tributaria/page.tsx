'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/reform/chat-interface';
import {
    MessageSquare,
    TrendingUp,
    Newspaper,
    BookOpen,
    Calendar,
    DollarSign,
    ShoppingCart,
    Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { REFORM_TIMELINE, DIFFERENTIATED_REGIMES, BASIC_BASKET, KEY_CONCEPTS } from '@/lib/reform-knowledge';
import { useReformNews } from '@/hooks/use-reform-news';
import { NewsCard } from '@/components/reform/news-card';
import { ImpactAnalysis } from '@/components/reform/impact-analysis';
import { Loader2, AlertCircle } from 'lucide-react';

// Componente para exibir notícias dinâmicas
function DynamicNews() {
    const { news, loading, error } = useReformNews();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Carregando notícias...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-3 p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                    <p className="font-semibold text-destructive">Erro ao carregar notícias</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    if (news.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold mb-2">Nenhuma notícia disponível</p>
                <p className="text-sm">
                    As notícias serão atualizadas automaticamente diariamente
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {news.map((item) => (
                <NewsCard key={item.id} news={item} />
            ))}
        </div>
    );
}

export default function ReformaTributariaPage() {
    const [activeTab, setActiveTab] = useState('chat');

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold tracking-tight">
                                <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-blue-600 bg-clip-text text-transparent dark:from-white dark:via-blue-300 dark:to-blue-400">
                                    Reforma
                                </span>
                                {" "}
                                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                                    Tributária
                                </span>
                            </h1>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold">
                                LC 214/2025
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Seu assistente especializado em Reforma Tributária Brasileira • PLP 108/2024
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/'}
                        className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar ao Planejador
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="chat" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Chat com Especialista
                    </TabsTrigger>
                    <TabsTrigger value="impactos" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Análise de Impactos
                    </TabsTrigger>
                    <TabsTrigger value="novidades" className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4" />
                        Novidades
                    </TabsTrigger>
                    <TabsTrigger value="guia" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Guia Completo
                    </TabsTrigger>
                </TabsList>

                {/* Chat Tab */}
                <TabsContent value="chat" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Converse com o Especialista
                            </CardTitle>
                            <CardDescription>
                                Tire suas dúvidas sobre CBS, IBS, Split Payment, Cesta Básica e muito mais
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChatInterface />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Impactos Tab */}
                <TabsContent value="impactos" className="space-y-4">
                    <ImpactAnalysis />
                </TabsContent>

                {/* Novidades Tab */}
                <TabsContent value="novidades" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Newspaper className="h-5 w-5" />
                                Novidades da Reforma
                            </CardTitle>
                            <CardDescription>
                                Acompanhe as últimas atualizações e mudanças
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DynamicNews />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Guia Tab */}
                <TabsContent value="guia" className="space-y-4">
                    {/* Cronograma */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Cronograma da Transição (2026-2033)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {REFORM_TIMELINE.map((item, index) => (
                                    <div key={index} className="border-l-2 border-primary/30 pl-4 pb-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline">{item.year}</Badge>
                                            <span className="font-semibold text-sm">{item.phase}</span>
                                        </div>
                                        {item.changes && (
                                            <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                                                {item.changes.map((change, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-primary mt-1">•</span>
                                                        <span>{change}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Regimes Diferenciados */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Regimes Diferenciados
                            </CardTitle>
                            <CardDescription>
                                Setores com alíquotas reduzidas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {DIFFERENTIATED_REGIMES.map((regime, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold">{regime.name}</h3>
                                            <Badge variant="secondary">{regime.reduction_percentage}% redução</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            {regime.description}
                                        </p>
                                        {regime.sectors && regime.sectors.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-xs font-semibold mb-1">Setores:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {regime.sectors.slice(0, 3).map((sector, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            {sector}
                                                        </Badge>
                                                    ))}
                                                    {regime.sectors.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{regime.sectors.length - 3} mais
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cesta Básica */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Cesta Básica Nacional (Alíquota Zero)
                            </CardTitle>
                            <CardDescription>
                                Produtos essenciais com isenção total de CBS e IBS
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {BASIC_BASKET.map((item, index) => (
                                    <div key={index} className="border rounded p-2 text-center">
                                        <p className="font-semibold text-sm">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">{item.category}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Conceitos-Chave */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Conceitos-Chave
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(KEY_CONCEPTS).map(([key, concept], index) => (
                                    <div key={index} className="border-b pb-3 last:border-0">
                                        <h3 className="font-semibold mb-1">{concept.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">{concept.description}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
