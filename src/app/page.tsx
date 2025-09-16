"use client";

import { useEffect, useActionState } from "react";
import { getAnalysis, type AnalysisState } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/icons/logo";
import { DashboardResults } from "@/components/dashboard-results";
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
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

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
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Análise Tributária Personalizada v2.2</CardTitle>
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
                        <Label htmlFor="companyName">Nome da Empresa</Label>
                        <Input id="companyName" name="companyName" type="text" placeholder="Ex: Clínica Dr. João Silva" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input id="cnpj" name="cnpj" type="text" placeholder="00.000.000/0001-00" />
                    </div>
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
          <DashboardResults analysis={state.aiResponse} clientName={state.aiResponse.clientName || 'Cliente'} />
        )}
      </main>
    </div>
  );
}
