"use client";

import { useEffect, useActionState } from "react";
import { getAnalysis, type AnalysisState } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/icons/logo";
import { AnalysisPresentation } from "@/components/analysis-presentation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";


const initialState: AnalysisState = {
  aiResponse: null,
  transcribedText: null,
  error: null,
};

export default function Home() {
  const [state, formAction, pending] = useActionState(getAnalysis, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Erro na Análise",
        description: state.error,
      });
    }
  }, [state.error, toast]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <div className="flex items-center gap-2">
          <LogoIcon className="h-6 w-6" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Tributo Med<span className="text-primary">.con</span>
          </h1>
        </div>
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Análise Tributária Personalizada v2.0</CardTitle>
            <CardDescription>
              Insira as informações do cliente ou anexe um documento para gerar um planejamento tributário detalhado.
            </CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Tipo de Cliente</Label>
                    <RadioGroup name="clientType" defaultValue="Novo aberturas de empresa" className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Novo aberturas de empresa" id="new-company" />
                        <Label htmlFor="new-company">Nova Abertura de Empresa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Transferências de contabilidade" id="transfer" />
                        <Label htmlFor="transfer">Transferência de Contabilidade</Label>
                    </div>
                    </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="payrollExpenses">Folha Salarial Bruta (CLT)</Label>
                        <Input id="payrollExpenses" name="payrollExpenses" type="number" step="0.01" placeholder="Ex: 5000.00 (use ponto)" />
                        <p className="text-sm text-muted-foreground">
                        Opcional. Crucial para o cálculo do Fator R no Simples Nacional.
                        </p>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="issRate">Alíquota de ISS (%)</Label>
                    <Input id="issRate" name="issRate" type="text" defaultValue="4.0" placeholder="Ex: 4.0 (use ponto)" />
                    <p className="text-sm text-muted-foreground">
                        Padrão de 4% (Montes Claros). Relevante para Lucro Presumido.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="clientData">
                    Informações Financeiras e Operacionais
                    </Label>
                    <Textarea
                    id="clientData"
                    name="clientData"
                    placeholder="Ex: Faturamento mensal de R$ 10.000,00, um único sócio. Ou cole o texto de documentos aqui."
                    rows={5}
                    />
                    <p className="text-sm text-muted-foreground">
                    Forneça os detalhes aqui ou anexe documentos abaixo. Um dos dois é obrigatório.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="attachments">Anexar Documentos</Label>
                    <Input id="attachments" name="attachments" type="file" multiple />
                    <p className="text-sm text-muted-foreground">
                    Opcional. Anexe declarações, extratos do Simples, etc. A IA pode extrair os dados dos anexos.
                    </p>
                </div>
            </CardContent>
            <CardFooter>
                <SubmitButton />
            </CardFooter>
        </form>
        </Card>

        {pending && (
             <Card className="shadow-lg animate-pulse">
                <CardHeader>
                    <CardTitle>Analisando...</CardTitle>
                    <CardDescription>A IA está processando os dados. Isso pode levar alguns instantes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-8 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-20 bg-muted rounded w-full"></div>
                    </div>
                </CardContent>
            </Card>
        )}


        {state.aiResponse && !pending && (
          <Card className="shadow-lg animate-in fade-in-50">
            <CardHeader>
              <CardTitle>Resultados da Análise V2.0</CardTitle>
              <CardDescription>
                Abaixo estão os cenários gerados pela IA, em formato de apresentação e texto detalhado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="presentation">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="presentation">Apresentação Visual</TabsTrigger>
                  <TabsTrigger value="details">Análise Detalhada (Texto)</TabsTrigger>
                </TabsList>
                <TabsContent value="presentation" className="mt-4">
                   <AnalysisPresentation analysis={state.aiResponse} />
                </TabsContent>
                <TabsContent value="details" className="mt-4">
                  <ScrollArea className="h-[600px] p-4 border rounded-md">
                     <div className="space-y-6 text-sm text-foreground font-sans">
                        <div>
                          <h3 className="font-bold text-lg mb-2 text-primary">Resumo Executivo e Recomendações</h3>
                          <p className="whitespace-pre-wrap">{state.aiResponse.executiveSummary}</p>
                        </div>
                        
                        <div className="border-t border-border my-4"></div>

                        {state.aiResponse.scenarios.map((scenario, index) => (
                           <div key={index} className="space-y-4 pt-4">
                              <h4 className="font-bold text-lg text-primary">{scenario.name}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-secondary/30 rounded-lg">
                                    <p className="font-semibold text-muted-foreground">Carga Tributária Total</p>
                                    <p className="text-destructive font-bold text-2xl">{scenario.totalTaxValue}</p>
                                    <Badge variant="secondary" className="mt-1">{scenario.effectiveRate} sobre Faturamento</Badge>
                                    {scenario.effectiveRateOnProfit && (
                                       <Badge variant="outline" className="mt-1 ml-2">{scenario.effectiveRateOnProfit} sobre Lucro</Badge>
                                    )}
                                </div>
                                <div className="p-4 bg-secondary/30 rounded-lg">
                                    <p className="font-semibold text-muted-foreground">Lucro Líquido para o Sócio</p>
                                    <p className="text-green-400 font-bold text-2xl">{scenario.netProfitDistribution}</p>
                                     {scenario.taxCostPerEmployee && (
                                        <p className="text-xs text-muted-foreground mt-1">Custo Tributário por Funcionário: {scenario.taxCostPerEmployee}</p>
                                     )}
                                </div>
                              </div>
                              
                              <h5 className="font-semibold mt-4 text-base">Detalhamento dos Tributos:</h5>
                               <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Tributo</TableHead>
                                      <TableHead>Alíquota</TableHead>
                                      <TableHead>Valor</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                     {scenario.taxBreakdown.map((tax, taxIdx) => (
                                        <TableRow key={taxIdx}>
                                          <TableCell>{tax.name}</TableCell>
                                          <TableCell>{tax.rate}</TableCell>
                                          <TableCell>{tax.value}</TableCell>
                                        </TableRow>
                                     ))}
                                  </TableBody>
                                </Table>

                                <h5 className="font-semibold mt-4 text-base">Análise do Pró-Labore:</h5>
                                <div className="p-4 border rounded-md bg-secondary/50">
                                    <p>
                                    <span className="font-semibold">Valor Bruto:</span> {scenario.proLaboreAnalysis.baseValue}
                                    </p>
                                    <p>
                                    <span className="font-semibold text-red-400">INSS (sócio):</span> {scenario.proLaboreAnalysis.inssValue}
                                    </p>
                                     <p>
                                    <span className="font-semibold text-red-400">IRRF:</span> {scenario.proLaboreAnalysis.irrfValue}
                                    </p>
                                    <p className="mt-2">
                                    <span className="font-bold">Valor Líquido Recebido:</span> <span className="font-bold text-lg">{scenario.proLaboreAnalysis.netValue}</span>
                                    </p>
                                </div>
                                
                                <p className="text-xs text-muted-foreground mt-4 italic">
                                  <span className="font-semibold">Notas da IA:</span> {scenario.notes}
                                </p>
                           </div>
                        ))}
                     </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
