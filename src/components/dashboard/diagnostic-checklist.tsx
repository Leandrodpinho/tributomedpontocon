"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GenerateTaxScenariosInput } from "@/ai/flows/types";
import type { ComplianceAnalysis } from "@/ai/flows/types";

interface DiagnosticChecklistProps {
    input: Partial<GenerateTaxScenariosInput>;
    complianceAnalysis?: ComplianceAnalysis;
}

interface ChecklistItem {
    id: string;
    label: string;
    category: "dados" | "estrutura" | "compliance";
    isComplete: (input: Partial<GenerateTaxScenariosInput>) => boolean;
    severity: "required" | "recommended" | "optional";
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
    // Dados Básicos
    {
        id: "revenue",
        label: "Faturamento mensal informado",
        category: "dados",
        isComplete: (input) => !!input.monthlyRevenue && input.monthlyRevenue > 0,
        severity: "required",
    },
    {
        id: "activities",
        label: "Atividades classificadas",
        category: "dados",
        isComplete: (input) => !!input.activities && input.activities.length > 0,
        severity: "recommended",
    },
    {
        id: "cnpj",
        label: "CNPJ informado",
        category: "dados",
        isComplete: (input) => !!input.cnpj && input.cnpj.length >= 14,
        severity: "recommended",
    },
    {
        id: "payroll",
        label: "Folha de pagamento informada",
        category: "dados",
        isComplete: (input) => input.payrollExpenses !== undefined,
        severity: "recommended",
    },
    // Estrutura
    {
        id: "partners",
        label: "Número de sócios definido",
        category: "estrutura",
        isComplete: (input) => !!input.numberOfPartners && input.numberOfPartners > 0,
        severity: "optional",
    },
    {
        id: "issRate",
        label: "Alíquota ISS municipal",
        category: "estrutura",
        isComplete: (input) => !!input.issRate && input.issRate > 0,
        severity: "recommended",
    },
    {
        id: "hospitalEquiv",
        label: "Equiparação hospitalar verificada",
        category: "estrutura",
        isComplete: (input) => input.isHospitalEquivalent !== undefined,
        severity: "optional",
    },
    {
        id: "uniprofessional",
        label: "Sociedade uniprofissional verificada",
        category: "estrutura",
        isComplete: (input) => input.isUniprofessionalSociety !== undefined,
        severity: "optional",
    },
];

/**
 * Checklist de Diagnóstico
 * 
 * Mostra visualmente o status de coleta de dados do cliente
 * para uma análise tributária completa.
 */
export function DiagnosticChecklist({ input, complianceAnalysis }: DiagnosticChecklistProps) {
    const getCompletedCount = () => {
        return CHECKLIST_ITEMS.filter(item => item.isComplete(input)).length;
    };

    const getCompletionPercentage = () => {
        return Math.round((getCompletedCount() / CHECKLIST_ITEMS.length) * 100);
    };

    const getCategoryItems = (category: ChecklistItem["category"]) => {
        return CHECKLIST_ITEMS.filter(item => item.category === category);
    };

    const getIcon = (item: ChecklistItem) => {
        const complete = item.isComplete(input);
        if (complete) {
            return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        }
        if (item.severity === "required") {
            return <AlertTriangle className="h-4 w-4 text-amber-500" />;
        }
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    };

    const completionPct = getCompletionPercentage();
    const alertCount = complianceAnalysis?.alerts?.length || 0;

    return (
        <Card className="border-brand-200 dark:border-brand-800">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Diagnóstico Tributário</span>
                    <span className={cn(
                        "text-sm font-bold px-2 py-1 rounded",
                        completionPct >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" :
                            completionPct >= 50 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" :
                                "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    )}>
                        {completionPct}% completo
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full transition-all duration-500",
                            completionPct >= 80 ? "bg-green-500" :
                                completionPct >= 50 ? "bg-yellow-500" :
                                    "bg-red-500"
                        )}
                        style={{ width: `${completionPct}%` }}
                    />
                </div>

                {/* Categorias */}
                <div className="space-y-4">
                    {/* Dados Básicos */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Dados Básicos
                        </h4>
                        <div className="space-y-1">
                            {getCategoryItems("dados").map(item => (
                                <div key={item.id} className="flex items-center gap-2 text-sm">
                                    {getIcon(item)}
                                    <span className={cn(
                                        item.isComplete(input) ? "text-muted-foreground line-through" : ""
                                    )}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Estrutura */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Estrutura Societária
                        </h4>
                        <div className="space-y-1">
                            {getCategoryItems("estrutura").map(item => (
                                <div key={item.id} className="flex items-center gap-2 text-sm">
                                    {getIcon(item)}
                                    <span className={cn(
                                        item.isComplete(input) ? "text-muted-foreground line-through" : ""
                                    )}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Alertas de Compliance */}
                {alertCount > 0 && (
                    <div className="pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">
                                {alertCount} alerta{alertCount > 1 ? 's' : ''} de compliance
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
