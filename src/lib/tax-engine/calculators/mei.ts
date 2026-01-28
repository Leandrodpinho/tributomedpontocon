import { LEGAL_CONSTANTS_2025 } from '@/ai/flows/legal-constants';

/**
 * Calcula o imposto devido no MEI
 * @param annualRevenue Faturamento anual estimado
 * @param activities Lista de atividades da empresa
 * @returns Detalhamento do cálculo
 */
export function calculateMEI(
    annualRevenue: number,
    activities: Array<{ type: 'commerce' | 'service' | 'industry', isMeiEligible: boolean }>
) {
    const limits = LEGAL_CONSTANTS_2025.mei;

    // Verificação de Elegibilidade
    const isRevenueEligible = annualRevenue <= limits.annualLimit;
    const areActivitiesEligible = activities.every(a => a.isMeiEligible);
    const isEligible = isRevenueEligible && areActivitiesEligible;

    let eligibilityNote = '';
    if (!isRevenueEligible) {
        eligibilityNote = `Faturamento anual projetado (R$ ${annualRevenue.toFixed(2)}) excede o limite do MEI (R$ ${limits.annualLimit.toFixed(2)}).`;
    } else if (!areActivitiesEligible) {
        eligibilityNote = 'Possui atividades não permitidas no MEI.';
    } else {
        eligibilityNote = 'Elegível ao MEI.';
    }

    // Cálculo do DAS MEI
    // INSS: 5% do Salário Mínimo (fixo)
    const inss = limits.inss;

    // ICMS: R$ 1,00 se tiver Comércio ou Indústria
    const hasCommerceOrIndustry = activities.some(a => a.type === 'commerce' || a.type === 'industry');
    const icms = hasCommerceOrIndustry ? limits.icms : 0;

    // ISS: R$ 5,00 se tiver Serviços
    const hasService = activities.some(a => a.type === 'service');
    const iss = hasService ? limits.iss : 0;

    const totalTax = inss + icms + iss;

    return {
        totalTax,
        breakdown: {
            inss,
            icms,
            iss
        },
        isEligible,
        eligibilityNote
    };
}
