"use client";

import { CheckCircle2, AlertTriangle, FileSearch, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ComplianceChecklist } from "@/types/holding";

interface ComplianceStepProps {
    data: ComplianceChecklist;
    onChange: (data: ComplianceChecklist) => void;
}

export function ComplianceStep({ data, onChange }: ComplianceStepProps) {

    const update = (key: keyof ComplianceChecklist, value: boolean) => {
        onChange({ ...data, [key]: value });
    };

    const riskScore = Object.values(data).filter(v => !v).length;

    return (
        <div className="space-y-6">

            <div className={`p-4 rounded-xl border flex items-center gap-4 ${riskScore === 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                {riskScore === 0 ? <CheckCircle2 className="h-8 w-8 text-emerald-500" /> : <AlertTriangle className="h-8 w-8 text-amber-500" />}
                <div>
                    <h3 className={`font-bold ${riskScore === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {riskScore === 0 ? "Patrimônio Apto para Integralização" : `${riskScore} Pendências Identificadas`}
                    </h3>
                    <p className="text-xs text-slate-400">
                        A Holding só blinda o que é "limpo". Passivos anteriores à constituição podem contaminar a empresa (Fraude à Execução).
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">

                <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" /> Riscos Fiscais & Trabalhistas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-slate-300">Certidões Federais Negativas (CND)?</Label>
                            <Switch checked={data.federalDebt} onCheckedChange={c => update('federalDebt', c)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-slate-300">Inexistência de Dívidas Trabalhistas?</Label>
                            <Switch checked={data.laborDebt} onCheckedChange={c => update('laborDebt', c)} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
                            <FileSearch className="h-4 w-4" /> Regularidade dos Ativos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-slate-300">Matrículas Atualizadas (RGI)?</Label>
                            <Switch checked={data.propertyDeeds} onCheckedChange={c => update('propertyDeeds', c)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-slate-300">Livre de Passivo Ambiental?</Label>
                            <Switch checked={data.environmentalRisk} onCheckedChange={c => update('environmentalRisk', c)} />
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
