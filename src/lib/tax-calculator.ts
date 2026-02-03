import { generateDeterministicScenarios } from './tax-engine/engine';
import { GenerateTaxScenariosInput, ScenarioDetail } from '@/ai/flows/types';

export const LEGAL_CONSTANTS = {
    minimumWage: 1518.0,
    inssCeiling: 8157.41,
};

export interface TaxCalculationInput {
    monthlyRevenue: number;
    payrollExpenses: number;
    issRate: number;
    proLabore?: number;
    numberOfPartners?: number;
    isUniprofessional?: boolean;
    realProfitMargin?: number;
    // New field for supporting mixed activities in simulator
    activities?: Array<{
        name: string;
        revenue: number;
        type: 'commerce' | 'service' | 'industry';
        simplesAnexo: 'I' | 'II' | 'III' | 'IV' | 'V';
        isMeiEligible: boolean;
    }>;
}

export interface TaxScenarioResult {
    name: string;
    totalTax: number;
    effectiveRate: number;
    netProfit: number;
    proLabore: number;
    inssTax: number;
    irpfTax: number;
    taxBreakdown: { name: string; value: number }[];
    proLaboreAnalysis?: {
        baseValue: number;
        inssValue: number;
        irrfValue: number;
    };
    notes: string[];
    isBest?: boolean;
    isWorst?: boolean;
    isEligible?: boolean;
}

/**
 * Adapter: Calculates scenarios using the robust Tax Engine
 * Maps the simpler TaxCalculationInput to the Engine's input and back.
 */
export function calculateAllScenarios(input: TaxCalculationInput): TaxScenarioResult[] {
    // 1. Map Input
    const engineInput: GenerateTaxScenariosInput = {
        clientType: 'Novo aberturas de empresa', // Default
        monthlyRevenue: input.monthlyRevenue,
        payrollExpenses: input.payrollExpenses,
        issRate: input.issRate,
        numberOfPartners: input.numberOfPartners,
        isUniprofessionalSociety: input.isUniprofessional,
        // If activities are passed (from Simulator scaling), use them.
        // Otherwise, the engine handles defaults.
        activities: input.activities
    };

    // 2. Call Engine
    const engineScenarios = generateDeterministicScenarios(engineInput);

    // 3. Map Output back to TaxScenarioResult (for UI compatibility)
    return engineScenarios.map(s => {
        // Extract pro-labore parts for breakdown compatibility
        const proLaboreInss = s.proLaboreAnalysis?.inssValue || 0;
        const proLaboreIrrf = s.proLaboreAnalysis?.irrfValue || 0;
        const proLaboreTotalTax = proLaboreInss + proLaboreIrrf;

        // Ensure tax breakdown exists
        const safeBreakdown = s.taxBreakdown || [];

        return {
            name: s.name,
            totalTax: s.totalTaxValue || 0,
            effectiveRate: s.effectiveRate || 0,
            netProfit: s.netProfitDistribution || 0,
            proLabore: s.proLaboreAnalysis?.baseValue || 0,
            inssTax: proLaboreInss,
            irpfTax: proLaboreIrrf,
            taxBreakdown: safeBreakdown,
            proLaboreAnalysis: s.proLaboreAnalysis,
            notes: s.notes ? [s.notes] : [],
            isBest: false, // Calculated later
            isWorst: false, // Calculated later
            isEligible: s.isEligible // Propagate eligibility
        };
    }).sort((a, b) => {
        // 1. Prioridade absoluta para cenários elegíveis
        // Se a.isEligible for true (ou undefined/implícito) e b.isEligible for false, A ganha (vem antes)
        const aEligible = a.isEligible !== false;
        const bEligible = b.isEligible !== false;

        if (aEligible && !bEligible) return -1;
        if (!aEligible && bEligible) return 1;

        // 2. Se ambos forem iguais em elegibilidade, ordena pelo menor imposto
        return a.totalTax - b.totalTax;
    }).map((s, idx, arr) => {
        // O melhor é o primeiro da lista, DESDE que seja elegível.
        // Se todos forem inelegíveis (caso raro/extremo), o primeiro será o "menos pior".
        // Mas com a ordenação acima, o primeiro sempre será elegível se houver pelo menos um.
        return {
            ...s,
            isBest: idx === 0 && (s.isEligible !== false),
            isWorst: idx === arr.length - 1
        };
    });
}

