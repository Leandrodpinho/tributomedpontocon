import { ComplianceAnalysis } from "@/ai/flows/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, ShieldAlert, AlertTriangle, Lightbulb, CheckCircle2, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplianceCardProps {
    analysis: ComplianceAnalysis;
}

export function ComplianceCard({ analysis }: ComplianceCardProps) {
    if (!analysis) return null;

    const { alerts, cnaeValidation, naturezaJuridicaCheck } = analysis;
    const hasDanger = alerts.some((a) => a.type === 'danger');

    return (
        <Card className={cn(
            "border-l-4 shadow-sm",
            hasDanger ? "border-l-destructive" : "border-l-emerald-500"
        )}>
            <CardHeader>
                <div className="flex items-center gap-2">
                    {hasDanger ? (
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                    ) : (
                        <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    )}
                    <CardTitle className="text-xl">Auditoria de Compliance & Inteligência</CardTitle>
                </div>
                <CardDescription>
                    Análise cruzada de registros fiscais (CNAEs) com a realidade operacional identificada.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Validação de Natureza Jurídica */}
                {naturezaJuridicaCheck && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border text-sm">
                        <p className="font-medium mb-1 flex items-center gap-2">
                            <FileWarning className="w-4 h-4 text-amber-500" /> Veredito Natureza Jurídica
                        </p>
                        <p className="text-muted-foreground">{naturezaJuridicaCheck}</p>
                    </div>
                )}

                {/* Lista de Alertas */}
                <div className="grid gap-4">
                    {alerts.map((alert, idx) => {
                        const styles = {
                            danger: "border-red-200 bg-red-50 text-red-900 dark:bg-red-900/10 dark:text-red-100",
                            warning: "border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-900/10 dark:text-amber-100",
                            info: "border-blue-200 bg-blue-50 text-blue-900 dark:bg-blue-900/10 dark:text-blue-100",
                            opportunity: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/10 dark:text-emerald-100"
                        };

                        const Icons: Record<string, typeof AlertTriangle> = {
                            danger: AlertTriangle,
                            warning: AlertTriangle,
                            info: ShieldCheck,
                            opportunity: Lightbulb
                        }

                        // Fallback para tipos não mapeados
                        const alertType = (alert.type && Icons[alert.type]) ? alert.type : 'info';
                        const Icon = Icons[alertType];
                        const style = styles[alertType as keyof typeof styles] || styles.info;

                        return (
                            <Alert key={idx} className={cn("border", style)}>
                                <Icon className="h-4 w-4" />
                                <AlertTitle className="font-bold ml-2">{alert.title}</AlertTitle>
                                <AlertDescription className="mt-2 ml-2 space-y-2">
                                    <p>{alert.description}</p>
                                    {alert.suggestion && (
                                        <div className="text-xs font-semibold uppercase tracking-wide opacity-80 mt-2">
                                            💡 Sugestão: {alert.suggestion}
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )
                    })}
                </div>

                {/* Validação de Atividades vs CNAEs */}
                {cnaeValidation.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">Auditoria de Atividades</h4>
                        <div className="space-y-2">
                            {cnaeValidation.map((validation, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm border-b last:border-0 pb-2">
                                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <span className="text-slate-700 dark:text-slate-300">{validation}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
