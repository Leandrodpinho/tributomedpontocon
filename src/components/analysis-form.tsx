"use client";

import { useRef, useState, useTransition } from "react";
import {
    Briefcase,
    Building2,
    Calculator,
    ChevronDown,
    ChevronUp,
    FileText,
    HelpCircle,
    Loader2,
    Paperclip,
    Search,
} from "lucide-react";
import { fetchCnpjData } from "@/services/cnpj";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { SubmitButton } from "@/components/submit-button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface AnalysisFormProps {
    onSubmit: (formData: FormData) => Promise<void>;
    isPending: boolean;
}

export function AnalysisForm({ onSubmit, isPending }: AnalysisFormProps) {
    const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const companyNameRef = useRef<HTMLInputElement>(null);
    const cnaesRef = useRef<HTMLInputElement>(null);
    const addressRef = useRef<HTMLInputElement>(null);
    const cnpjRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Novos estados para visualização dinâmica
    const [revenue, setRevenue] = useState<string>("");
    const [payroll, setPayroll] = useState<string>("");
    const [partners, setPartners] = useState(1);
    const [realMargin, setRealMargin] = useState(30);
    const [issRate, setIssRate] = useState(5); // Padrão: 5% (São Paulo - máximo permitido)
    const [municipioInfo, setMunicipioInfo] = useState<string | null>(null);

    // Perfil de Renda Expandido (CLT+PJ, RPA)
    const [hasMultipleIncome, setHasMultipleIncome] = useState(false);
    const [cltIncome, setCltIncome] = useState<string>("");
    const [rpaIncome, setRpaIncome] = useState<string>("");

    const handleSearchCnpj = async () => {
        const cnpj = cnpjRef.current?.value;
        if (!cnpj) return;

        setIsSearchingCnpj(true);
        try {
            const data = await fetchCnpjData(cnpj);
            if (companyNameRef.current) companyNameRef.current.value = data.companyName;
            if (cnaesRef.current) cnaesRef.current.value = data.cnaes;
            if (addressRef.current) addressRef.current.value = data.address;

            // Atualizar ISS automaticamente com base no município
            setIssRate(data.issRate);
            setMunicipioInfo(`${data.municipio}/${data.uf}`);

            toast({
                title: "Dados encontrados!",
                description: `Razão social, CNAEs, Endereço e ISS (${data.issRate}% - ${data.municipio}/${data.uf}) preenchidos.`,
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

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                onSubmit(formData);
            }}
            className="w-full max-w-4xl mx-auto space-y-8"
        >
            <div className="grid gap-8 md:grid-cols-[1fr_300px]">
                {/* Coluna Principal - Dados Essenciais */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Building2 className="w-5 h-5 text-brand-600" />
                                Dados da Empresa
                            </CardTitle>
                            <CardDescription>Identificação básica para personalização do relatório.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cnpj">CNPJ <span className="text-muted-foreground text-xs">(Op.)</span></Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="cnpj"
                                            name="cnpj"
                                            ref={cnpjRef}
                                            placeholder="00.000.000/0001-00"
                                            className="bg-white/50"
                                            onBlur={handleSearchCnpj}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={handleSearchCnpj}
                                            disabled={isSearchingCnpj}
                                        >
                                            {isSearchingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Nome da Empresa</Label>
                                    <Input
                                        id="companyName"
                                        name="companyName"
                                        ref={companyNameRef}
                                        placeholder="Ex: Clínica Médica Saúde Ltda"
                                        className="bg-white/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnaes">CNAEs</Label>
                                <Input
                                    id="cnaes"
                                    name="cnaes"
                                    ref={cnaesRef}
                                    placeholder="Códigos de atividade (ex: 8630-5/03)"
                                    className="bg-white/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço Completo</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    ref={addressRef}
                                    placeholder="Rua, Número, Bairro, Cidade - UF"
                                    className="bg-white/50"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Calculator className="w-5 h-5 text-brand-600" />
                                Dados Financeiros
                            </CardTitle>
                            <CardDescription>Números base para cálculo dos impostos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="monthlyRevenue" className="text-base font-semibold text-brand-700">
                                        Faturamento Mensal (R$)
                                    </Label>
                                    <Input
                                        id="monthlyRevenue"
                                        name="monthlyRevenueInput" // Nome diferente para não conflitar se formos usar formData direto
                                        type="text"
                                        inputMode="decimal"
                                        required
                                        placeholder="0,00"
                                        className="text-lg h-12 bg-white/50 border-brand-200 focus:border-brand-500"
                                        value={revenue}
                                        onChange={(e) => {
                                            // Aceita apenas números e vírgula/ponto
                                            const value = e.target.value.replace(/[^0-9,.]/g, '');
                                            setRevenue(value);
                                        }}
                                        onBlur={(e) => {
                                            // Formata para decimal padrão ao sair do campo (opcional, ou manter raw)
                                            // Vamos manter o valor raw no state para edição fácil, mas garantir parse no submit
                                        }}
                                    />
                                    {/* Input hidden para enviar o valor numérico limpo */}
                                    <input
                                        type="hidden"
                                        name="monthlyRevenue"
                                        value={revenue.replace(/\./g, '').replace(',', '.')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payrollExpenses" className="text-base font-semibold">
                                        Folha de Pagamento (CLT)
                                    </Label>
                                    <Input
                                        id="payrollExpenses"
                                        name="payrollExpensesInput"
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0,00"
                                        className="text-lg h-12 bg-white/50"
                                        value={payroll}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9,.]/g, '');
                                            setPayroll(value);
                                        }}
                                    />
                                    <input
                                        type="hidden"
                                        name="payrollExpenses"
                                        value={payroll ? payroll.replace(/\./g, '').replace(',', '.') : '0'}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="grid sm:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-3">
                                    <Label>Quantidade de Sócios Médicos</Label>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={[partners]}
                                            onValueChange={(vals) => setPartners(vals[0])}
                                            min={1}
                                            max={20}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <div className="w-12 h-10 flex items-center justify-center border rounded bg-white/50 font-bold">
                                            {partners}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Define ISS Fixo (SUP) e Pró-labore.</p>
                                </div>

                                <div className="space-y-3">
                                    <Label>Margem Lucro Real (Estimada)</Label>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={[realMargin]}
                                            onValueChange={(vals) => setRealMargin(vals[0])}
                                            min={5}
                                            max={60}
                                            step={5}
                                            className="flex-1"
                                        />
                                        <div className="w-16 h-10 flex items-center justify-center border rounded bg-white/50 font-bold text-sm">
                                            {realMargin}%
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Impacta simulação de Lucro Real.</p>
                                    {/* Input hidden para enviar no form */}
                                    <input type="hidden" name="realProfitMargin" value={realMargin} />
                                    {/* Como o action original não espera partners/margin diretamente, 
                                        vamos ter que ou injetar no clientData ou atualizar o action.
                                        Por enquanto, o simulador client-side usa state, mas o server-side analysis precisa ter esses dados.
                                        Vamos adicionar inputs hidden se o backend suportar ou adaptar.
                                        Vou adicionar inputs com names que o getAnalysis pode ler se eu atualizar a interface dele,
                                        mas como o getAnalysis usa AI, colocar no 'clientData' text area é uma boa fallback se não quiser mudar o backend agora.
                                        Mas melhor: criar inputs hidden e o formData vai levar. O getAnalysis lê tudo?
                                        Olhando getAnalysis: ele lê campos específicos. Se eu não mudar o getAnalysis, preciso concatenar no clientData.
                                    */}
                                    <input type="hidden" name="numberOfPartners" value={partners} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between hover:bg-white/20">
                                <span className="flex items-center gap-2">
                                    <Paperclip className="w-4 h-4" /> Anexos e Configurações Avançadas
                                </span>
                                {advancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 pt-4">
                            <Card className="border-none shadow-sm bg-white/30 dark:bg-slate-900/30">
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="attachments">Documentos (Extratos Simples, IR, Balancete)</Label>
                                        <Input
                                            id="attachments"
                                            name="attachments"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.heic,.xlsx,.csv"
                                            multiple
                                            className="bg-white/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="negotiationTranscript">Observações Adicionais</Label>
                                        <Textarea
                                            id="negotiationTranscript"
                                            name="negotiationTranscript"
                                            rows={4}
                                            placeholder="Detalhes específicos..."
                                            className="bg-white/50"
                                        />
                                    </div>
                                    <div className="flex gap-6 pt-2">
                                        <div className="flex items-center space-x-2">
                                            <Switch id="isHospitalEquivalent" name="isHospitalEquivalent" />
                                            <Label htmlFor="isHospitalEquivalent">Equiparação Hospitalar</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch id="isUniprofessionalSociety" name="isUniprofessionalSociety" />
                                            <Label htmlFor="isUniprofessionalSociety">Sociedade Uniprofissional</Label>
                                        </div>
                                    </div>

                                    {/* Perfil de Renda Expandido */}
                                    <Separator className="my-4" />
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="hasMultipleIncome"
                                                checked={hasMultipleIncome}
                                                onCheckedChange={setHasMultipleIncome}
                                            />
                                            <Label htmlFor="hasMultipleIncome" className="font-medium">
                                                Possui outras fontes de renda? (CLT + PJ / RPA)
                                            </Label>
                                        </div>

                                        {hasMultipleIncome && (
                                            <div className="grid sm:grid-cols-2 gap-4 pl-8 border-l-2 border-brand-200 dark:border-brand-800">
                                                <div className="space-y-2">
                                                    <Label htmlFor="cltIncome">Renda CLT Mensal (R$)</Label>
                                                    <Input
                                                        id="cltIncome"
                                                        type="text"
                                                        inputMode="decimal"
                                                        placeholder="0,00"
                                                        className="bg-white/50"
                                                        value={cltIncome}
                                                        onChange={(e) => setCltIncome(e.target.value.replace(/[^0-9,.]/g, ''))}
                                                    />
                                                    <p className="text-xs text-muted-foreground">Salário bruto como empregado</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="rpaIncome">Renda RPA Mensal (R$)</Label>
                                                    <Input
                                                        id="rpaIncome"
                                                        type="text"
                                                        inputMode="decimal"
                                                        placeholder="0,00"
                                                        className="bg-white/50"
                                                        value={rpaIncome}
                                                        onChange={(e) => setRpaIncome(e.target.value.replace(/[^0-9,.]/g, ''))}
                                                    />
                                                    <p className="text-xs text-muted-foreground">Recibo Pagamento Autônomo</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Hidden default value fallbacks */}
                                    <input type="hidden" name="issRate" value={issRate} />
                                    <input type="hidden" name="hasMultipleIncomeSources" value={hasMultipleIncome ? "true" : "false"} />
                                    {hasMultipleIncome && cltIncome && (
                                        <input type="hidden" name="cltIncome" value={cltIncome.replace(/\./g, '').replace(',', '.')} />
                                    )}
                                    {hasMultipleIncome && rpaIncome && (
                                        <input type="hidden" name="rpaIncome" value={rpaIncome.replace(/\./g, '').replace(',', '.')} />
                                    )}
                                    {municipioInfo && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            ISS: {issRate}% ({municipioInfo})
                                        </p>
                                    )}
                                    <input type="hidden" name="clientType" value="Novo aberturas de empresa" />
                                </CardContent>
                            </Card>
                        </CollapsibleContent>
                    </Collapsible>
                </div>

                {/* Coluna Lateral - Resumo/Ação */}
                <div className="space-y-6">
                    <Card className="bg-brand-50 dark:bg-brand-950/20 border-brand-100 dark:border-brand-900 sticky top-24">
                        <CardHeader>
                            <CardTitle className="text-lg">Pronto para gerar?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground space-y-2">
                                <p className="flex justify-between">
                                    <span>Faturamento:</span>
                                    <span className="font-medium text-foreground">{revenue ? `R$ ${parseFloat(revenue).toLocaleString('pt-BR')}` : '-'}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span>Sócios:</span>
                                    <span className="font-medium text-foreground">{partners}</span>
                                </p>
                                <Separator className="bg-brand-200/50" />
                                <p className="text-xs">
                                    Ao clicar em Gerar, nossa IA analisará os melhores cenários tributários (Simples, Presumido, Real).
                                </p>
                            </div>
                            <SubmitButton className="w-full h-12 text-base shadow-brand-500/25 shadow-lg" isLoading={isPending}>
                                <Briefcase className="mr-2 h-4 w-4" /> Gerar Planejamento
                            </SubmitButton>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
