"use client";

import { useEffect, useActionState, useRef } from "react";
import { getAnalysis, type AnalysisState } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/icons/logo";
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

const initialState: AnalysisState = {
  isLoading: false,
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
            <CardTitle>Análise Tributária Personalizada</CardTitle>
            <CardDescription>
              Insira as informações do cliente ou anexe um documento para gerar cenários tributários e
              otimizar a carga fiscal.
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
                <Label htmlFor="clientData">
                  Informações Financeiras e Operacionais (Opcional se anexo)
                </Label>
                <Textarea
                  id="clientData"
                  name="clientData"
                  ref={clientDataRef}
                  placeholder="Ex: Faturamento mensal, despesas com folha de pagamento, regime tributário atual, número de sócios, etc."
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

        {state.isLoading === false && (state.aiResponse || state.webhookResponse) && (
          <Card className="shadow-lg animate-in fade-in-50">
            <CardHeader>
              <CardTitle>Resultados da Análise</CardTitle>
              <CardDescription>
                Abaixo estão os cenários gerados pela IA e a resposta do
                webhook.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="scenarios">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="scenarios">Cenários Tributários</TabsTrigger>
                  <TabsTrigger value="irpf">Impacto no IRPF</TabsTrigger>
                  <TabsTrigger value="webhook">Resposta do Webhook</TabsTrigger>
                </TabsList>
                <TabsContent value="scenarios" className="mt-4 p-4 border rounded-md min-h-[200px] bg-background">
                  {state.aiResponse?.taxScenarios ? (
                     <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                      {state.aiResponse.taxScenarios}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum cenário gerado.</p>
                  )}
                </TabsContent>
                <TabsContent value="irpf" className="mt-4 p-4 border rounded-md min-h-[200px] bg-background">
                   {state.aiResponse?.irpfImpact ? (
                     <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                      {state.aiResponse.irpfImpact}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum impacto de IRPF calculado.</p>
                  )}
                </TabsContent>
                <TabsContent value="webhook" className="mt-4 p-4 border rounded-md min-h-[200px] bg-muted/50">
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {state.webhookResponse ? JSON.stringify(state.webhookResponse, null, 2) : "Nenhuma resposta do webhook."}
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
