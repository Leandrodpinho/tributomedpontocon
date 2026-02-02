"use client";

import { BookOpen, Lightbulb, Tractor, Building2, Stethoscope, ShoppingCart, ArrowLeft, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function PlaybookPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-white font-sans selection:bg-blue-500/30">

            <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-white/5 bg-slate-950/80 px-6 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => window.location.href = '/'} className="text-slate-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                            <BookOpen className="h-5 w-5" />
                            Guia Estratégico do Operador
                        </h1>
                        <p className="text-xs text-slate-500">O "Pulo do Gato" de cada ferramenta</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-10 max-w-4xl space-y-8">

                {/* Intro */}
                <div className="rounded-xl bg-blue-900/20 border border-blue-500/30 p-6">
                    <h2 className="text-lg font-bold text-blue-300 flex items-center gap-2 mb-2">
                        <Lightbulb className="h-5 w-5" />
                        Como usar este Planejador
                    </h2>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Esta ferramenta não apenas calcula impostos; ela vende soluções.
                        Cada módulo foi desenhado para explorar uma brecha ou benefício legal específico ("O Pulo do Gato").
                        Use este guia para entender onde está o dinheiro em cada simulação.
                    </p>
                </div>

                {/* Módulo Médico */}
                <section id="medico">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400"><Stethoscope className="h-6 w-6" /></div>
                        <h2 className="text-2xl font-bold text-white">Saúde & Clínicas</h2>
                    </div>
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader><CardTitle className="text-lg text-cyan-300">O Segredo: Fator R e Equiparação Hospitalar</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1" className="border-white/10">
                                    <AccordionTrigger className="text-slate-200">Fator R (Simples Nacional)</AccordionTrigger>
                                    <AccordionContent className="text-slate-400">
                                        Se a folha de pagamento for maior que 28% do faturamento, a clínica sai do Anexo V ( ~15,5% imposto) e cai para o Anexo III (~6% imposto).
                                        <br /><br />
                                        <strong>Estratégia:</strong> Aumentar o Pro-Labore dos sócios para atingir os 28%. O sistema calcula isso automaticamente.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2" className="border-white/10">
                                    <AccordionTrigger className="text-slate-200">Equiparação Hospitalar (Lucro Presumido)</AccordionTrigger>
                                    <AccordionContent className="text-slate-400">
                                        Clínicas que fazem pequenos procedimentos (ex: dermatologia com cirurgia, oftalmo) podem ser equiparadas a hospitais judicialmente ou administrativamente.
                                        <br /><br />
                                        <strong>Impacto:</strong> A base de cálculo do IRPJ cai de 32% para 8%, e CSLL de 32% para 12%. O imposto total cai de ~16% para ~9%.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </section>

                {/* Módulo Holding */}
                <section id="holding">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400"><Building2 className="h-6 w-6" /></div>
                        <h2 className="text-2xl font-bold text-white">Holding Patrimonial</h2>
                    </div>
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader><CardTitle className="text-lg text-amber-300">O Segredo: Valor de Mercado vs Valor Declarado</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1" className="border-white/10">
                                    <AccordionTrigger className="text-slate-200">A Mágica do ITCMD</AccordionTrigger>
                                    <AccordionContent className="text-slate-400">
                                        No inventário tradicional (Pessoa Física), o imposto de herança (ITCMD) incide sobre o <strong>Valor de Mercado</strong> dos imóveis.
                                        <br />
                                        Na Holding, você doa as quotas da empresa pelo <strong>Valor Declarado (Histórico)</strong>.
                                        <br /><br />
                                        <strong>Exemplo:</strong> Imóvel comprado em 1990 por R$ 100k que hoje vale R$ 2 Milhões. No inventário PF, pagaria 4% de 2M (80k). Na Holding, paga 4% de 100k (4k).
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2" className="border-white/10">
                                    <AccordionTrigger className="text-slate-200">Aluguéis mais baratos</AccordionTrigger>
                                    <AccordionContent className="text-slate-400">
                                        Na PF, aluguel paga até 27,5% (Carnê Leão). Na Holding, paga-se aprox. 11,33% (Presumido).
                                        A diferença paga o custo da holding em menos de 2 anos geralmente.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </section>

                {/* Módulo Varejo */}
                <section id="varejo">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-violet-500/20 rounded-lg text-violet-400"><ShoppingCart className="h-6 w-6" /></div>
                        <h2 className="text-2xl font-bold text-white">Varejo & Postos</h2>
                    </div>
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader><CardTitle className="text-lg text-violet-300">O Segredo: Exclusão do Monofásico</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-400">
                                <strong>Nicho de Ouro:</strong> Postos de Gasolina, Autopeças, Farmácias e Bebidas Frias.
                            </p>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1" className="border-white/10">
                                    <AccordionTrigger className="text-slate-200">O Erro Comum (Duplicidade)</AccordionTrigger>
                                    <AccordionContent className="text-slate-400">
                                        Muitos contadores lançam a venda desses produtos como "Venda Normal", pagando 3,65% de PIS/COFINS novamente.
                                        <br /><br />
                                        <strong>A Correção:</strong> Esses produtos já tiveram imposto pago na fábrica (Monofásico). O varejista deve <strong>zerar</strong> a alíquota na revenda. Nossa ferramenta faz isso automático ao selecionar "Posto".
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </section>

                {/* Módulo Agro */}
                <section id="agro">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><Tractor className="h-6 w-6" /></div>
                        <h2 className="text-2xl font-bold text-white">Produtor Rural</h2>
                    </div>
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader><CardTitle className="text-lg text-emerald-300">O Segredo: Transformar Trator em Despesa</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1" className="border-white/10">
                                    <AccordionTrigger className="text-slate-200">Livro Caixa Digital (LCDPR)</AccordionTrigger>
                                    <AccordionContent className="text-slate-400">
                                        Diferente de médicos ou advogados, o Produtor Rural pode abater <strong>100% dos Investimentos</strong> (Máquinas, Silos, Benfeitorias) no ano da compra.
                                        <br /><br />
                                        <strong>Estratégia:</strong> Se o lucro vai ser alto e o imposto pesado, o produtor compra uma máquina nova no final do ano. Isso reduz a base de cálculo drasticamente, às vezes zerando o imposto.
                                        A ferramenta compara isso contra a opção "Simplificada" (pagar sobre 20% da receita).
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </section>

            </main>
        </div>
    );
}
