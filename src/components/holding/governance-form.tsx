"use client";

import { Handshake, Gavel, Ban, Percent, Users2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GovernanceRules } from "@/types/holding";

interface GovernanceFormProps {
    rules: GovernanceRules;
    onChange: (rules: GovernanceRules) => void;
}

export function GovernanceForm({ rules, onChange }: GovernanceFormProps) {

    // Helpers para update
    const update = (key: keyof GovernanceRules, value: any) => {
        onChange({ ...rules, [key]: value });
    };

    return (
        <div className="space-y-6">

            {/* 1. Proteção Patrimonial (Agregados) */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                        <Ban className="h-5 w-5 text-red-400" />
                        Proteção Contra Agregados
                    </CardTitle>
                    <CardDescription>Defina se cônjuges dos herdeiros (genros/noras) podem entrar na sociedade.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-slate-200">Permitir Genros/Noras como Sócios?</Label>
                        <p className="text-xs text-slate-500">
                            Se "Não", em caso de divórcio ou falecimento do herdeiro, o agregado deve ser indenizado em dinheiro, nunca em quotas.
                        </p>
                    </div>
                    <Switch
                        checked={rules.allowInLaws}
                        onCheckedChange={(c) => update('allowInLaws', c)}
                    />
                </CardContent>
            </Card>

            {/* 2. Resolução de Conflitos */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                        <Gavel className="h-5 w-5 text-amber-400" />
                        Cláusula de Mediação Forçada
                    </CardTitle>
                    <CardDescription>Evita que brigas familiares vão direto para a Justiça comum.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-slate-200">Obrigar Arbitragem/Mediação?</Label>
                        <p className="text-xs text-slate-500">
                            Impede processos judiciais públicos, mantendo o sigilo e agilidade nas disputas.
                        </p>
                    </div>
                    <Switch
                        checked={rules.forcedMediation}
                        onCheckedChange={(c) => update('forcedMediation', c)}
                    />
                </CardContent>
            </Card>

            {/* 3. Poder de Venda (Quórum) */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                        <Handshake className="h-5 w-5 text-emerald-400" />
                        Quórum para Venda de Imóveis
                    </CardTitle>
                    <CardDescription>Qual % de votos é necessária para vender um bem da holding?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span className="text-sm font-medium text-white">{rules.saleApprovalRatio}% dos Votos</span>
                        <span className="text-xs text-slate-500">Quanto mais alto, mais difícil vender (Proteção)</span>
                    </div>
                    <Slider
                        value={[rules.saleApprovalRatio]}
                        min={51}
                        max={100}
                        step={1}
                        onValueChange={(vals) => update('saleApprovalRatio', vals[0])}
                        className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-500">
                        Recomendado: 75% ou 100% (Unanimidade) para proteção total do patrimônio legado.
                    </p>
                </CardContent>
            </Card>

            {/* 4. Sucessão da Gestão */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                        <Users2 className="h-5 w-5 text-blue-400" />
                        Sucessão da Administração
                    </CardTitle>
                    <CardDescription>Na falta dos pais, quem assume a caneta?</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={rules.managementSuccession}
                        onValueChange={(v) => update('managementSuccession', v)}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        <div>
                            <RadioGroupItem value="FAMILY" id="fam" className="peer sr-only" />
                            <Label htmlFor="fam" className="flex flex-col items-center justify-between rounded-md border-2 border-slate-700 bg-transparent p-4 hover:bg-slate-800 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:text-blue-500 cursor-pointer transition-all">
                                <span className="mb-2 text-xl">👑</span>
                                <span className="text-center font-bold">Herdeiro Mais Velho</span>
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="VOTE" id="vote" className="peer sr-only" />
                            <Label htmlFor="vote" className="flex flex-col items-center justify-between rounded-md border-2 border-slate-700 bg-transparent p-4 hover:bg-slate-800 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:text-blue-500 cursor-pointer transition-all">
                                <span className="mb-2 text-xl">🗳️</span>
                                <span className="text-center font-bold">Eleição dos Sócios</span>
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="PROFESSIONAL" id="pro" className="peer sr-only" />
                            <Label htmlFor="pro" className="flex flex-col items-center justify-between rounded-md border-2 border-slate-700 bg-transparent p-4 hover:bg-slate-800 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:text-blue-500 cursor-pointer transition-all">
                                <span className="mb-2 text-xl">👔</span>
                                <span className="text-center font-bold">Gestor Profissional</span>
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

        </div>
    );
}
