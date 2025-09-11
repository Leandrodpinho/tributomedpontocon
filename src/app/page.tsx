"use client";

import { useEffect, useActionState, useRef } from "react";
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

const initialState: AnalysisState = {
  aiResponse: undefined,
  transcribedText: undefined,
  error: undefined,
};

export default function Home() {
  const [state, formAction] = useActionState(getAnalysis, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const clientDataRef = useRef<HTMLTextAreaElement>(null);


  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Erro na Análise",
        description: state.error,
      });
    }
  }, [state.error, toast]);

  useEffect(() => {
    if (state.transcribedText && clientDataRef.current) {
        clientDataRef.current.value = state.transcribedText;
    }
  }, [state.transcribedText]);

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
          <form action={formAction} ref={formRef}>
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

               <div className="space-y-2">
                  <Label htmlFor="payrollExpenses">Folha Salarial Bruta (CLT, Opcional)</Label>
                  <Input id="payrollExpenses" name="payrollExpenses" type="text" placeholder="Ex: 5000.00 (use ponto para decimais)" />
                  <p className="text-sm text-muted-foreground">
                    Este valor é crucial para o cálculo do Fator R no Simples Nacional.
                  </p>
                </div>

              <div className="space-y-2">
                <Label htmlFor="clientData">
                  Informações Financeiras e Operacionais (Opcional se anexo)
                </Label>
                <Textarea
                  id="clientData"
                  name="clientData"
                  ref={clientDataRef}
                  placeholder="Ex: Faturamento mensal, número de sócios, etc. Use este campo para complementar ou em vez de anexar documentos."
                  rows={5}
                />
                <p className="text-sm text-muted-foreground">
                  Forneça os detalhes aqui ou anexe um ou mais documentos abaixo.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">Anexar Documentos</Label>
                <Input id="attachments" name="attachments" type="file" multiple />
                <p className="text-sm text-muted-foreground">
                  Anexe declarações, extratos do Simples Nacional, etc. (múltiplos arquivos são permitidos). A análise pode ser feita a partir dos anexos.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <SubmitButton />
            </CardFooter>
          </form>
        </Card>

        {state.aiResponse && (
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
                  <ScrollArea className="h-[500px] p-4 border rounded-md">
                     <div className="space-y-6 text-sm text-foreground font-sans">
                        <div>
                          <h3 className="font-bold text-lg mb-2">Resumo Executivo</h3>
                          <p className="whitespace-pre-wrap">{state.aiResponse.executiveSummary}</p>
                        </div>
                        {state.aiResponse.scenarios.map((scenario, index) => (
                           <div key={index} className="space-y-4">
                              <h4 className="font-bold text-md text-primary">{scenario.name}</h4>
                              <p><span className="font-semibold">Imposto Total:</span> {scenario.totalTaxValue} ({scenario.effectiveRate} efetiva)</p>
                              <p><span className="font-semibold">Lucro Líquido para o Sócio:</span> <span className="text-green-400 font-bold">{scenario.netProfitDistribution}</span></p>
                              
                              <h5 className="font-semibold mt-2">Detalhamento dos Tributos:</h5>
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

                                <h5 className="font-semibold mt-2">Análise do Pró-Labore:</h5>
                                <p>
                                  Base: {scenario.proLaboreAnalysis.baseValue} | 
                                  INSS: {scenario.proLaboreAnalysis.inssValue} | 
                                  IRRF: {scenario.proLaboreAnalysis.irrfValue} | 
                                  Líquido: <span className="font-bold">{scenario.proLaboreAnalysis.netValue}</span>
                                </p>
                                
                                <p className="text-xs text-muted-foreground mt-2">
                                  <span className="font-semibold">Notas:</span> {scenario.notes}
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

    