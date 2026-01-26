import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LegalConfidenceWidgetProps {
    scenarioName: string;
    isSup?: boolean;
    className?: string;
}

export function LegalConfidenceWidget({ scenarioName, isSup, className }: LegalConfidenceWidgetProps) {
    // Lógica de determinação de risco
    const getRiskLevel = () => {
        const nameLower = scenarioName.toLowerCase();

        if (nameLower.includes('equip. hospitalar') || nameLower.includes('hospital')) {
            return {
                level: 'medium',
                icon: AlertTriangle,
                text: 'Requer Atenção',
                color: 'text-amber-500',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20',
                description: 'Exige estrutura física adequada, alvará da vigilância sanitária e cumprimento de regras da ANVISA para validar a alíquota reduzida de 8% de IRPJ/CSLL.'
            };
        }

        if (nameLower.includes('uniprofissional') || nameLower.includes('sup') || isSup) {
            return {
                level: 'medium',
                icon: Info,
                text: 'Regras Específicas',
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20',
                description: 'Sociedades Uniprofissionais (SUP) não podem ter caráter empresarial, sócios de capital (não profissionais) ou terceirização da atividade-fim.'
            };
        }

        if (nameLower.includes('fator r')) {
            return {
                level: 'low',
                icon: CheckCircle,
                text: 'Requer Folha 28%',
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
                description: 'Para manter-se no Anexo III, a folha de pagamento (incluindo pró-labore) deve representar sempre 28% ou mais do faturamento mensal.'
            };
        }

        return {
            level: 'safe',
            icon: CheckCircle,
            text: 'Baixo Risco',
            color: 'text-slate-500',
            bg: 'bg-slate-500/10',
            border: 'border-slate-500/20',
            description: 'Regime tributário padrão com regras bem consolidadas e baixo risco de autuação se operado corretamente.'
        };
    };

    const risk = getRiskLevel();
    const Icon = risk.icon;

    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border cursor-help transition-colors",
                        risk.bg,
                        risk.border,
                        risk.color,
                        className
                    )}>
                        <Icon className="w-3 h-3" />
                        <span>{risk.text}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px] text-xs">
                    {risk.description}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
