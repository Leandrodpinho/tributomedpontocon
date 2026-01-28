import { LEGAL_CONSTANTS_2025 } from '@/ai/flows/legal-constants';

/**
 * Calcula o imposto devido no Simples Nacional
 * @param revenue12m Faturamento acumulado nos últimos 12 meses (RBT12)
 * @param monthlyRevenue Faturamento do mês atual
 * @param anexo 'III' ou 'V'
 * @returns Detalhamento do cálculo
 */
/**
 * Calcula o imposto devido no Simples Nacional
 * @param revenue12m Faturamento acumulado nos últimos 12 meses (RBT12)
 * @param monthlyRevenue Faturamento do mês atual
 * @param anexo Anexo aplicável
 * @returns Detalhamento do cálculo
 */
export function calculateSimplesNacional(
    revenue12m: number,
    monthlyRevenue: number,
    anexo: 'I' | 'II' | 'III' | 'IV' | 'V'
) {
    // 1. Selecionar tabela
    let table;
    switch (anexo) {
        case 'I': table = LEGAL_CONSTANTS_2025.simplesAnexoI; break;
        case 'II': table = LEGAL_CONSTANTS_2025.simplesAnexoII; break;
        case 'III': table = LEGAL_CONSTANTS_2025.simplesAnexoIII; break;
        case 'IV': table = LEGAL_CONSTANTS_2025.simplesAnexoIV; break;
        case 'V': table = LEGAL_CONSTANTS_2025.simplesAnexoV; break;
        default: table = LEGAL_CONSTANTS_2025.simplesAnexoIII;
    }

    // 2. Encontrar faixa
    // Se RBT12 for 0 (início de atividade), considerar mensal * 12 para enquadramento (estimativa)
    const effectiveRBT12 = revenue12m > 0 ? revenue12m : monthlyRevenue * 12;

    const bracket = table.find(b => effectiveRBT12 <= b.limit) || table[table.length - 1];

    // 3. Calcular Alíquota Efetiva
    // Fórmula: [(RBT12 * AliqNominal) - Dedução] / RBT12
    let effectiveRate = 0;
    if (effectiveRBT12 > 0) {
        effectiveRate = ((effectiveRBT12 * bracket.rate) - bracket.deduction) / effectiveRBT12;
    } else {
        // Caso de faturamento zerado, usa alíquota da primeira faixa nominal
        effectiveRate = table[0].rate;
    }

    // 4. Calcular Imposto
    const totalTax = monthlyRevenue * effectiveRate;

    return {
        totalTax,
        effectiveRate: effectiveRate * 100, // Retorna em %
        nominalRate: bracket.rate * 100,
        deduction: bracket.deduction,
        rbt12: effectiveRBT12,
        anexo
    };
}

/**
 * Calcula o Simples Nacional para múltiplas atividades (Segregação de Receitas)
 */
export function calculateMixedSimples(
    revenue12m: number,
    activities: Array<{ revenue: number, simplesAnexo: 'I' | 'II' | 'III' | 'IV' | 'V' }>
) {
    let totalTax = 0;
    const breakdown = [];

    // A RBT12 é GLOBAL para a empresa
    const totalMonthlyRevenue = activities.reduce((sum, act) => sum + act.revenue, 0);
    const effectiveRBT12 = revenue12m > 0 ? revenue12m : totalMonthlyRevenue * 12;

    for (const activity of activities) {
        // Calcula a alíquota efetiva deste anexo usando a RBT12 GLOBAL
        const calc = calculateSimplesNacional(effectiveRBT12, activity.revenue, activity.simplesAnexo);

        totalTax += calc.totalTax;
        breakdown.push({
            anexo: activity.simplesAnexo,
            revenue: activity.revenue,
            rate: calc.effectiveRate,
            tax: calc.totalTax
        });
    }

    const effectiveRateGlobal = totalMonthlyRevenue > 0 ? (totalTax / totalMonthlyRevenue) * 100 : 0;

    return {
        totalTax,
        effectiveRateGlobal,
        breakdown
    };
}
