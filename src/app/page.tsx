"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ClipboardList,
  FileSignature,
  FileText,
  HelpCircle,
  IdCard,
  Loader2,
  Pencil,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { getAnalysis, type AnalysisState } from "@/app/actions";
import { fetchCnpjData } from "@/services/cnpj";
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
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const initialState: AnalysisState = {
  aiResponse: null,
  transcribedText: null,
  irpfImpacts: null,
  webhookResponse: null,
  error: null,
  historyRecordId: null,
  historyError: null,
};

const StepHeader = ({ step, title, subtitle }: { step: string; title: string; subtitle: string }) => (
  <div className="flex items-start gap-3">
    <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary)_/_0.15)] text-sm font-semibold text-brand-600 dark:text-brand-100 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary)_/_0.35)]">
      {step}
    </span>
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-brand-600 dark:text-brand-300">Etapa {step}</p>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  </div>
);

const WIZARD_STEPS = [
  {
    id: "documents",
    label: "Documentos",
    description: "Anexe extratos e comprovantes para acelerar a análise.",
  },
  {
    id: "client-profile",
    label: "Perfil do cliente",
    description: "Dados cadastrais básicos para contextualizar a análise.",
  },
  {
    id: "financial-data",
    label: "Dados financeiros",
    description: "Informações estruturadas que alimentam os cálculos.",
  },
];

const FINANCIAL_STEP_INDEX = WIZARD_STEPS.findIndex(step => step.id === "financial-data");

export default function Home() {
  const [state, setState] = useState<AnalysisState>(initialState);
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const formRef = useRef<HTMLFormElement | null>(null);
  const companyNameRef = useRef<HTMLInputElement>(null);
  const cnaesRef = useRef<HTMLInputElement>(null);
  const cnpjRef = useRef<HTMLInputElement>(null);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const { toast } = useToast();

  const handleSearchCnpj = async () => {
    const cnpj = cnpjRef.current?.value;
    if (!cnpj) return;

    setIsSearchingCnpj(true);
    try {
      const data = await fetchCnpjData(cnpj);
      if (companyNameRef.current) companyNameRef.current.value = data.companyName;
      if (cnaesRef.current) cnaesRef.current.value = data.cnaes;
      toast({
        title: "Dados encontrados!",
        description: "Razão social e CNAEs preenchidos automaticamente.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: error instanceof Error ? error.message : "Não foi possível buscar o CNPJ.",
      });
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  const progressValue = ((currentStep + 1) / WIZARD_STEPS.length) * 100;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  const ensureMonthlyRevenue = () => {
    const monthlyRevenueInput = formRef.current?.elements.namedItem("monthlyRevenue") as HTMLInputElement | null;
    const rawValue = monthlyRevenueInput?.value?.trim() ?? "";
    const normalizedValue = rawValue.replace(/\./g, "").replace(",", ".");
    const numericValue = Number.parseFloat(normalizedValue);
    if (!rawValue || Number.isNaN(numericValue) || numericValue <= 0) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Informe o faturamento mensal estimado para prosseguir com a análise.",
      });
      monthlyRevenueInput?.focus();
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (pending) return;
    if (currentStep === FINANCIAL_STEP_INDEX && !ensureMonthlyRevenue()) {
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const handlePreviousStep = () => {
    if (pending) return;
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleGoToStep = (stepIndex: number) => {
    if (pending) return;
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
    }
  };

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
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))] bg-app-gradient text-[hsl(var(--foreground))] transition-colors duration-300">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-white/20 bg-white/60 px-4 backdrop-blur-xl transition-all duration-300 md:px-10 dark:bg-slate-950/50 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="group flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white shadow-lg transition-transform group-hover:scale-105">
            <LogoIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Planejador <span className="text-primary">Tributário</span>
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Estratégia fiscal para a área da saúde
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 pb-12 md:px-8">
        {showForm && (
          <TooltipProvider>
            <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="glass-card flex flex-col overflow-hidden rounded-3xl">
                <CardHeader className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-2xl font-semibold text-foreground">
                        Planner Tributário Inteligente
                      </CardTitle>
                      <CardDescription>
                        Preencha as etapas para orientar a IA com dados consistentes e acelerar a definição do regime ideal.
                      </CardDescription>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Etapa {String(currentStep + 1).padStart(2, "0")} de {WIZARD_STEPS.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {WIZARD_STEPS[currentStep]?.description}
                      </p>
                    </div>
                    <Progress value={progressValue} className="h-2 bg-[hsl(var(--secondary))] dark:bg-slate-800" />
                    <div className="flex flex-wrap gap-2">
                      {WIZARD_STEPS.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;
                        return (
                          <button
                            key={step.id}
                            type="button"
                            onClick={() => handleGoToStep(index)}
                            disabled={index > currentStep}
                            className={cn(
                              "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed",
                              isActive && "bg-brand-500 text-[hsl(var(--background))] shadow-lg",
                              isCompleted && "bg-[hsl(var(--accent)_/_0.16)] text-brand-700",
                              !isActive && !isCompleted && "bg-[hsl(var(--secondary))] text-muted-foreground hover:bg-[hsl(var(--secondary)_/_0.9)]"
                            )}
                            aria-current={isActive ? "step" : undefined}
                          >
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <span className="hidden sm:inline">{step.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardHeader>
                <form
                  ref={formRef}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    startTransition(async () => {
                      const newState = await getAnalysis(state, formData);
                      setState(newState);
                    });
                  }}
                  className="flex-1 flex flex-col"
                >
                  <CardContent className="space-y-10">
                    <section
                      data-step="documents"
                      className={cn("space-y-6", currentStep !== 0 && "hidden")}
                      aria-hidden={currentStep !== 0}
                    >
                      <StepHeader
                        step="01"
                        title="Documentos fundamentais"
                        subtitle="Arquivos prioritários que permitem extrair dados automaticamente para o planejamento."
                      />
                      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                        <div className="space-y-3">
                          <Label htmlFor="attachments" className="text-foreground">
                            Anexar documentos prioritários
                          </Label>
                          <Input
                            id="attachments"
                            name="attachments"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.heic,.xlsx,.csv"
                            multiple
                          />
                          <p className="text-xs text-muted-foreground">
                            Arraste ou selecione todos os arquivos de uma só vez. Quanto mais completos os anexos, mais precisa será a análise.
                          </p>
                        </div>
                        <div className="space-y-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-5">
                          <p className="text-sm font-semibold text-foreground">
                            Priorize anexos claros:
                          </p>
                          <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start gap-3">
                              <FileText className="mt-0.5 h-4 w-4 text-brand-600 dark:text-brand-300" />
                              <span>Extrato do Simples Nacional ou DAS consolidado dos últimos 12 meses.</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <IdCard className="mt-0.5 h-4 w-4 text-brand-600 dark:text-brand-300" />
                              <span>Cartão CNPJ, contrato social ou alterações societárias atualizadas.</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Receipt className="mt-0.5 h-4 w-4 text-brand-600 dark:text-brand-300" />
                              <span>Declaração de imposto de renda (DIRPF/ECF) para confirmar distribuição e pró-labore.</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <FileSignature className="mt-0.5 h-4 w-4 text-brand-600 dark:text-brand-300" />
                              <span>Transcrição ou ata da negociação com o cliente para captar expectativas e restrições.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="negotiationTranscript" className="text-foreground">
                          Transcrição da negociação (texto opcional)
                        </Label>
                        <Textarea
                          id="negotiationTranscript"
                          name="negotiationTranscript"
                          rows={5}
                          placeholder="Cole aqui os principais pontos da conversa: metas de faturamento, expectativas dos sócios, pendências fiscais, apetite a risco etc."
                        />
                        <p className="text-xs text-muted-foreground">
                          Este campo complementa os anexos e ajuda a IA a interpretar os requisitos estratégicos do cliente.
                        </p>
                      </div>
                    </section>

                    <section
                      data-step="client-profile"
                      className={cn("space-y-5", currentStep !== 1 && "hidden")}
                      aria-hidden={currentStep !== 1}
                    >
                      <StepHeader
                        step="02"
                        title="Dados do cliente"
                        subtitle="Identifique o perfil e a situação cadastral do negócio."
                      />
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <Label className="text-foreground">Tipo de Cliente</Label>
                          <RadioGroup
                            name="clientType"
                            defaultValue="Novo aberturas de empresa"
                            className="grid gap-3 sm:grid-cols-2"
                          >
                            <label
                              htmlFor="new-company"
                              className="flex cursor-pointer items-center gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-4 transition-colors hover:border-brand-400"
                            >
                              <RadioGroupItem value="Novo aberturas de empresa" id="new-company" />
                              <div>
                                <p className="text-sm font-semibold text-foreground">Nova abertura</p>
                                <p className="text-xs text-muted-foreground">Empresas em fase de constituição.</p>
                              </div>
                            </label>
                            <label
                              htmlFor="transfer"
                              className="flex cursor-pointer items-center gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-4 transition-colors hover:border-brand-400"
                            >
                              <RadioGroupItem value="Transferências de contabilidade" id="transfer" />
                              <div>
                                <p className="text-sm font-semibold text-foreground">Transferência</p>
                                <p className="text-xs text-muted-foreground">Empresas com operação em andamento.</p>
                              </div>
                            </label>
                          </RadioGroup>
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="companyName" className="text-foreground">Nome da Empresa</Label>
                          <Input
                            id="companyName"
                            name="companyName"
                            type="text"
                            ref={companyNameRef}
                            autoComplete="organization"
                            placeholder="Ex: Clínica Dr. João Silva"
                          />
                          <p className="text-xs text-muted-foreground">
                            Informe para personalizar relatórios e comunicações.
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-3">
                            <Label htmlFor="cnpj" className="text-foreground">CNPJ</Label>
                            <div className="flex gap-2">
                              <Input
                                id="cnpj"
                                name="cnpj"
                                ref={cnpjRef}
                                type="text"
                                inputMode="numeric"
                                placeholder="00.000.000/0001-00"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleSearchCnpj}
                                disabled={isSearchingCnpj}
                                title="Buscar dados do CNPJ"
                              >
                                {isSearchingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Facilita a conferência dos CNAEs e registro municipal.
                            </p>
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="cnaes" className="text-foreground">CNAEs (separados por vírgula)</Label>
                            <Input
                              id="cnaes"
                              name="cnaes"
                              type="text"
                              ref={cnaesRef}
                              placeholder="8630-5/03, 8610-1/01"
                            />
                            <p className="text-xs text-muted-foreground">
                              Essencial para avaliar Fator R, ISS e equiparação hospitalar.
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="consultingFirm" className="text-foreground">Consultoria Responsável</Label>
                          <Input
                            id="consultingFirm"
                            name="consultingFirm"
                            type="text"
                            placeholder="Ex: Doctor.con, Sertec.con"
                            defaultValue="Doctor.con"
                          />
                          <p className="text-xs text-muted-foreground">
                            Nome da empresa que assinará o planejamento tributário.
                          </p>
                        </div>
                      </div>
                      <Separator className="bg-border/60" />
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="rbt12" className="text-foreground">RBT12 (Receita Bruta 12M)</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground transition-colors hover:text-brand-600 dark:hover:text-brand-300"
                                  aria-label="Mais detalhes sobre RBT12"
                                >
                                  <HelpCircle className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs">
                                Informe o faturamento acumulado dos últimos 12 meses. Se não houver histórico completo, deixe em branco que calculamos com base no faturamento mensal.
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="rbt12"
                            name="rbt12"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Ex: 240000.00"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="fs12" className="text-foreground">FS12 (Folha de Salários 12M)</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground transition-colors hover:text-brand-600 dark:hover:text-brand-300"
                                  aria-label="Mais detalhes sobre FS12"
                                >
                                  <HelpCircle className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs">
                                Some salários, pró-labore, encargos (INSS, FGTS, 13º) e benefícios pagos nos últimos 12 meses. Usamos o valor para calcular o Fator R.
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="fs12"
                            name="fs12"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Ex: 96000.00"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="payrollExpenses" className="text-foreground">Folha Salarial Mensal (CLT)</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground transition-colors hover:text-brand-600 dark:hover:text-brand-300"
                                  aria-label="Mais detalhes sobre folha mensal"
                                >
                                  <HelpCircle className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs">
                                Inclua salários, encargos e pró-labore dos sócios. Usamos o valor para simular cenários com e sem folha.
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="payrollExpenses"
                            name="payrollExpenses"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Ex: 15000.00"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="issRate" className="text-foreground">Alíquota de ISS (%)</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground transition-colors hover:text-brand-600 dark:hover:text-brand-300"
                                  aria-label="Mais detalhes sobre ISS"
                                >
                                  <HelpCircle className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs">
                                Utilize a alíquota municipal vigente. Caso não saiba, mantenha 4% como referência.
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Input
                            id="issRate"
                            name="issRate"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue="4.0"
                            placeholder="4.0"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label
                          htmlFor="isHospitalEquivalent"
                          className="flex cursor-pointer items-start gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-4 transition-colors hover:border-brand-400"
                        >
                          <input
                            id="isHospitalEquivalent"
                            name="isHospitalEquivalent"
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-brand-400 text-brand-600 dark:text-brand-300 focus:ring-brand-500"
                          />
                          <div>
                            <p className="text-sm font-semibold text-foreground">Equiparação Hospitalar</p>
                            <p className="text-xs text-muted-foreground">
                              Assinale quando a clínica se enquadra nas jurisprudências de serviços hospitalares.
                            </p>
                          </div>
                        </label>
                        <label
                          htmlFor="isUniprofessionalSociety"
                          className="flex cursor-pointer items-start gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-4 transition-colors hover:border-brand-400"
                        >
                          <input
                            id="isUniprofessionalSociety"
                            name="isUniprofessionalSociety"
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-brand-400 text-brand-600 dark:text-brand-300 focus:ring-brand-500"
                          />
                          <div>
                            <p className="text-sm font-semibold text-foreground">Sociedade Uniprofissional</p>
                            <p className="text-xs text-muted-foreground">
                              Indique se a estrutura societária permite ISS fixo por profissional.
                            </p>
                          </div>
                        </label>
                      </div>
                    </section>

                    <section
                      data-step="financial-data"
                      className={cn("space-y-5", currentStep !== FINANCIAL_STEP_INDEX && "hidden")}
                      aria-hidden={currentStep !== FINANCIAL_STEP_INDEX}
                    >
                      <StepHeader
                        step="03"
                        title="Informações financeiras"
                        subtitle="Dados operacionais e notas importantes para a IA."
                      />
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3 md:col-span-2">
                          <Label htmlFor="monthlyRevenue" className="text-foreground">
                            Faturamento Mensal (R$) *
                          </Label>
                          <Input
                            id="monthlyRevenue"
                            name="monthlyRevenue"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Ex: 180000.00"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Campo obrigatório e referência principal para todos os cenários simulados.
                          </p>
                        </div>
                        <div className="space-y-3 md:col-span-2">
                          <Label htmlFor="clientData" className="text-foreground">
                            Informações Financeiras e Operacionais adicionais
                          </Label>
                          <Textarea
                            id="clientData"
                            name="clientData"
                            placeholder="Detalhe sazonalidade de faturamento, quadro de pessoal, composição de serviços, despesas relevantes e condições dos sócios."
                            rows={7}
                          />
                          <p className="text-xs text-muted-foreground">
                            Use números sempre que possível (ex.: faturamento privado vs. convênios, percentual de despesa assistencial, pró-labore atual).
                          </p>
                        </div>
                      </div>
                    </section>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary)_/_0.6)] p-6">
                    <div className="text-xs text-muted-foreground">
                      <p>Os dados são processados em ambiente seguro e descartados ao término da análise.</p>
                      <p>Progresso salvo automaticamente. Você pode voltar etapas para revisar informações.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      {currentStep > 0 && (
                        <Button type="button" variant="ghost" onClick={handlePreviousStep} disabled={pending}>
                          Voltar
                        </Button>
                      )}
                      {!isLastStep ? (
                        <Button type="button" onClick={handleNextStep} disabled={pending} className="sm:min-w-[180px]">
                          Próxima etapa
                        </Button>
                      ) : (
                        <SubmitButton className="sm:min-w-[220px]" isLoading={pending}>Gerar Planejamento</SubmitButton>
                      )}
                    </div>
                  </CardFooter>
                </form>
              </div>

              <div className="glass-card sticky top-28 h-fit space-y-6 rounded-3xl p-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-brand-700 dark:text-brand-200">
                    <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-300" /> Como potencializar a análise
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Pequenos detalhes aumentam a precisão dos cenários tributários gerados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-foreground">
                  <div className="flex items-start gap-3">
                    <ClipboardList className="mt-1 h-5 w-5 text-brand-600 dark:text-brand-300" />
                    <p>
                      Informe o faturamento médio mensal, sazonalidades e percentuais por fonte pagadora. Valores estruturados aceleram a simulação.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-1 h-5 w-5 text-brand-600 dark:text-brand-300" />
                    <p>
                      Descreva obrigações acessórias específicas (RET, ISS fixo, contratação de médicos PJ) para reforçar requisitos legais.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Upload className="mt-1 h-5 w-5 text-brand-600 dark:text-brand-300" />
                    <p>
                      Priorize anexos claros: declarações do Simples, balancetes e contratos sociais ajudam a IA a validar as hipóteses.
                    </p>
                  </div>
                </CardContent>
              </div>
            </div>
          </TooltipProvider >
        )
        }

        {
          pending && !state.aiResponse && (
            <Card className="border-none bg-[hsl(var(--card)_/_0.85)] shadow-lg backdrop-blur">
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
          )
        }

        {
          state.aiResponse && (
            <>
              {!showForm && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentStep(0);
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Fazer nova análise
                  </Button>
                </div>
              )}
              <div className="relative">
                {pending && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-[hsl(var(--background)_/_0.82)] backdrop-blur">
                    <div className="rounded-lg border border-border/60 bg-[hsl(var(--card))] p-6 text-center shadow">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
                      <p className="mt-3 text-sm font-semibold text-foreground">Atualizando análise...</p>
                      <p className="text-xs text-muted-foreground">
                        Recalculando cenários com as novas informações enviadas.
                      </p>
                    </div>
                  </div>
                )}
                <DashboardResults
                  analysis={state.aiResponse}
                  clientName={clientName}
                  consultingFirm={formRef.current?.elements.namedItem("consultingFirm") instanceof RadioNodeList ? "Doctor.con" : (formRef.current?.elements.namedItem("consultingFirm") as HTMLInputElement)?.value || "Doctor.con"}
                  irpfImpacts={state.irpfImpacts}
                  webhookResponse={state.webhookResponse}
                  historyRecordId={state.historyRecordId}
                  historyError={state.historyError}
                />
              </div>
            </>
          )
        }
      </main >
    </div >
  );
}
