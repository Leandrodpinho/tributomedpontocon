"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Loader2,
  Pencil,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const initialState: AnalysisState = {
  aiResponse: null,
  transcribedText: null,
  error: null,
};

const StepHeader = ({ step, title, subtitle }: { step: string; title: string; subtitle: string }) => (
  <div className="flex items-start gap-3">
    <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
      {step}
    </span>
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-brand-200 dark:text-brand-300">Etapa {step}</p>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  </div>
);

export default function Home() {
  const [state, formAction, pending] = useActionState(getAnalysis, initialState);
  const [showForm, setShowForm] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Erro na Análise",
        description: state.error,
      });
    }
    if (state.aiResponse && !state.error) {
      setShowForm(false);
    }
  }, [state, toast]);

  const clientName = useMemo(
    () =>
      state.aiResponse?.scenarios?.[0]?.name.split(":")[0].replace("Cenário para ", "").trim() ||
      "Cliente",
    [state.aiResponse]
  );

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900 text-white transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-black">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-white/20 bg-white/10 px-4 backdrop-blur-sm transition-colors duration-300 md:px-10 dark:border-slate-700/60 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <LogoIcon className="h-8 w-8 text-white" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Tributo Med<span className="text-brand-200">.con</span>
            </h1>
            <p className="text-xs text-brand-100/80">
              Planejamento tributário inteligente para clínicas, consultórios e profissionais da saúde.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-white/60 bg-white/10 text-white">
          Nova Experiência 2025
        </Badge>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 md:px-8">
        {showForm && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="border-none bg-white/95 text-slate-900 shadow-xl transition-colors duration-200 dark:border dark:border-slate-700/60 dark:bg-slate-900/90 dark:text-slate-100">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    Planner Tributário Inteligente
                  </CardTitle>
                  <CardDescription>
                    Informe as características do cliente e deixe a IA sugerir o regime mais eficiente com base na legislação de 2025.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="self-start bg-brand-100 text-brand-700">
                  versão 2.2
                </Badge>
              </CardHeader>
              <form action={formAction}>
                <CardContent className="space-y-10">
                  <section className="space-y-5">
                    <StepHeader
                      step="01"
                      title="Dados do cliente"
                      subtitle="Identifique o perfil e a situação cadastral do negócio."
                    />
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label className="text-slate-800 dark:text-slate-200">Tipo de Cliente</Label>
                        <RadioGroup
                          name="clientType"
                          defaultValue="Novo aberturas de empresa"
                          className="grid gap-3 sm:grid-cols-2"
                        >
                          <label
                            htmlFor="new-company"
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-brand-400 dark:border-slate-700 dark:bg-slate-800/80"
                          >
                            <RadioGroupItem value="Novo aberturas de empresa" id="new-company" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Nova abertura</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Empresas em fase de constituição.</p>
                            </div>
                          </label>
                          <label
                            htmlFor="transfer"
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-brand-400 dark:border-slate-700 dark:bg-slate-800/80"
                          >
                            <RadioGroupItem value="Transferências de contabilidade" id="transfer" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Transferência</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Empresas com operação em andamento.</p>
                            </div>
                          </label>
                        </RadioGroup>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="companyName" className="text-slate-800 dark:text-slate-200">Nome da Empresa</Label>
                        <Input
                          id="companyName"
                          name="companyName"
                          type="text"
                          placeholder="Clínica Dr. João Silva"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Opcional, mas recomendado para personalizar o relatório final.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="cnpj" className="text-slate-800 dark:text-slate-200">CNPJ</Label>
                        <Input
                          id="cnpj"
                          name="cnpj"
                          type="text"
                          placeholder="00.000.000/0001-00"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Facilita a análise documental e a conferência dos CNAEs.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="cnaes" className="text-slate-800 dark:text-slate-200">CNAEs (separados por vírgula)</Label>
                        <Input
                          id="cnaes"
                          name="cnaes"
                          type="text"
                          placeholder="8630-5/03, 8610-1/01"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Essencial para avaliar Fator R, ISS e equiparação hospitalar.
                        </p>
                      </div>
                    </div>
                    <Separator className="bg-border/60" />
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="rbt12" className="text-slate-800 dark:text-slate-200">RBT12 (Receita Bruta 12M)</Label>
                        <Input
                          id="rbt12"
                          name="rbt12"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 240000.00"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Informe se já houver histórico consolidado de 12 meses.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="fs12" className="text-slate-800 dark:text-slate-200">FS12 (Folha de Salários 12M)</Label>
                        <Input
                          id="fs12"
                          name="fs12"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 96000.00"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Ajuda a IA a calcular o Fator R com maior precisão.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="payrollExpenses" className="text-slate-800 dark:text-slate-200">Folha Salarial Mensal (CLT)</Label>
                        <Input
                          id="payrollExpenses"
                          name="payrollExpenses"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 15000.00"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Inclua salários, encargos e pró-labore quando houver.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="issRate" className="text-slate-800 dark:text-slate-200">Alíquota de ISS (%)</Label>
                        <Input
                          id="issRate"
                          name="issRate"
                          type="number"
                          step="0.01"
                          defaultValue="4.0"
                          placeholder="4.0"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Utilize a alíquota municipal vigente. Valor padrão de 4%.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label
                        htmlFor="isHospitalEquivalent"
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-brand-400 dark:border-slate-700 dark:bg-slate-800/80"
                      >
                        <input
                          id="isHospitalEquivalent"
                          name="isHospitalEquivalent"
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-brand-400 text-brand-500 focus:ring-brand-500"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Equiparação Hospitalar</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Assinale quando a clínica se enquadra nas jurisprudências de serviços hospitalares.
                          </p>
                        </div>
                      </label>
                      <label
                        htmlFor="isUniprofessionalSociety"
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-brand-400 dark:border-slate-700 dark:bg-slate-800/80"
                      >
                        <input
                          id="isUniprofessionalSociety"
                          name="isUniprofessionalSociety"
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-brand-400 text-brand-500 focus:ring-brand-500"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sociedade Uniprofissional</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Indique se a estrutura societária permite ISS fixo por profissional.
                          </p>
                        </div>
                      </label>
                    </div>
                  </section>

                  <section className="space-y-5">
                    <StepHeader
                      step="02"
                      title="Informações financeiras"
                      subtitle="Dados operacionais e notas importantes para a IA."
                    />
                    <div className="space-y-3">
                      <Label htmlFor="clientData" className="text-slate-800 dark:text-slate-200">Informações Financeiras e Operacionais</Label>
                      <Textarea
                        id="clientData"
                        name="clientData"
                        placeholder="Ex: Faturamento mensal de R$ 120.000,00, 12 colaboradores CLT, 2 sócios."
                        rows={6}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Liste faturamento, quadro de pessoal, distribuição entre serviços, despesas relevantes e particularidades dos sócios.
                      </p>
                    </div>
                  </section>

                  <section className="space-y-5">
                    <StepHeader
                      step="03"
                      title="Documentação"
                      subtitle="Anexe arquivos para extração automática do texto."
                    />
                    <div className="space-y-3">
                      <Label htmlFor="attachments" className="text-slate-800 dark:text-slate-200">Anexar Documentos</Label>
                      <Input
                        id="attachments"
                        name="attachments"
                        type="file"
                        multiple
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Aceite declarações, extratos do Simples, balancetes e outros comprovantes (PDF, imagem). A IA consolidará as informações relevantes.
                      </p>
                    </div>
                  </section>
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-4 border-t border-white/40 bg-slate-100 p-6 dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <p>Os dados são processados em um ambiente seguro e descartados ao término da análise.</p>
                  </div>
                  <SubmitButton className="min-w-[200px]">Gerar Planejamento</SubmitButton>
                </CardFooter>
              </form>
            </Card>

            <Card className="border border-white/30 bg-white/10 text-white shadow-lg backdrop-blur transition-transform duration-200 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Sparkles className="h-5 w-5 text-brand-100" /> Como potencializar a análise
                </CardTitle>
                <CardDescription className="text-brand-100/80">
                  Pequenos detalhes aumentam a precisão dos cenários tributários gerados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-brand-100/90">
                <div className="flex items-start gap-3">
                  <ClipboardList className="mt-1 h-5 w-5 text-brand-100" />
                  <p>
                    Informe o faturamento médio mensal e sazonalidades relevantes. Utilize valores numéricos para facilitar os cálculos.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-brand-100" />
                  <p>
                    Descreva obrigações acessórias específicas (RET, ISS fixo, contratação de médicos PJ) para reforçar requisitos legais.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Upload className="mt-1 h-5 w-5 text-brand-100" />
                  <p>
                    Priorize anexos claros: declarações do Simples, balancetes e contratos sociais ajudam a IA a validar as hipóteses.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {pending && !state.aiResponse && (
          <Card className="border-none bg-white/75 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle>Analisando...</CardTitle>
              <CardDescription>A IA está processando os dados fornecidos. Isso pode levar alguns instantes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-8 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-20 w-full rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        )}

        {state.aiResponse && (
          <>
            {!showForm && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowForm(true)}>
                  <Pencil className="mr-2 h-4 w-4" /> Fazer nova análise
                </Button>
              </div>
            )}
            <div className="relative">
              {pending && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur">
                  <div className="rounded-lg border border-border/60 bg-white/80 p-6 text-center shadow">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
                    <p className="mt-3 text-sm font-semibold text-foreground">Atualizando análise...</p>
                    <p className="text-xs text-muted-foreground">
                      Recalculando cenários com as novas informações enviadas.
                    </p>
                  </div>
                </div>
              )}
              <DashboardResults analysis={state.aiResponse} clientName={clientName} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
