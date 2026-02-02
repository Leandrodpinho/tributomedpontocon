import { auth } from "@clerk/nextjs/server";
import { getAnalysesByUserId, SavedAnalysis } from "@/lib/firebase-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function HistoricoPage() {
    const { userId } = await auth();

    if (!userId) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Card className="bg-slate-900 border-slate-800 max-w-md">
                    <CardHeader>
                        <CardTitle className="text-white">Acesso Restrito</CardTitle>
                        <CardDescription>Faça login para ver seu histórico de simulações.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/sign-in">
                            <Button className="w-full">Fazer Login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const analyses: SavedAnalysis[] = await getAnalysesByUserId(userId);

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <header className="flex h-16 items-center px-6 md:px-12 border-b border-white/5 backdrop-blur-sm">
                <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Hub
                </Link>
            </header>

            <main className="container mx-auto px-6 py-12 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Histórico de Simulações</h1>
                    <p className="text-slate-400">
                        {analyses.length > 0
                            ? `Você tem ${analyses.length} simulação(ões) salva(s).`
                            : "Nenhuma simulação encontrada."}
                    </p>
                </div>

                {analyses.length === 0 ? (
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <FileText className="h-16 w-16 text-slate-600 mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">Nenhuma simulação ainda</h3>
                            <p className="text-slate-400 mb-6 max-w-sm">
                                Acesse um dos módulos e faça sua primeira simulação tributária para vê-la aqui.
                            </p>
                            <Link href="/">
                                <Button>Iniciar Nova Simulação</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {analyses.map((analysis) => {
                            const aiResponse = analysis.aiResponse as { scenarios?: Array<{ name: string; totalTax: number }> } | null;
                            const scenarios = aiResponse?.scenarios ?? [];
                            const bestScenario = scenarios.length > 0
                                ? scenarios.reduce((a, b) => a.totalTax < b.totalTax ? a : b)
                                : null;

                            return (
                                <Card key={analysis.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                                    <CardContent className="flex items-center justify-between p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                                                <FileText className="h-6 w-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">
                                                    {analysis.clientName || "Simulação sem nome"}
                                                </h3>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {analysis.createdAt.toLocaleDateString("pt-BR", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </span>
                                                    {bestScenario && (
                                                        <span className="flex items-center gap-1 text-emerald-400">
                                                            <TrendingUp className="h-3 w-3" />
                                                            Melhor: {bestScenario.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm text-slate-400">
                                                {scenarios.length} cenário(s)
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
