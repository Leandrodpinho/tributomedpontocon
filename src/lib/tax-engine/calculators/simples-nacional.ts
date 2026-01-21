import { LEGAL_CONSTANTS_2025 } from '@/ai/flows/legal-constants';

/**
 * Calcula o imposto devido no Simples Nacional
 * @param revenue12m Faturamento acumulado nos últimos 12 meses (RBT12)
 * @param monthlyRevenue Faturamento do mês atual
 * @param anexo 'III' ou 'V'
 * @returns Detalhamento do cálculo
 */
export function calculateSimplesNacional(
    revenue12m: number,
    monthlyRevenue: number,
    anexo: 'III' | 'V'
) {
    // 1. Selecionar tabela
    const table = anexo === 'III'
        ? LEGAL_CONSTANTS_2025.simplesAnexoIII
        : LEGAL_CONSTANTS_2025.simplesAnexoV;

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
