import { LEGAL_CONSTANTS_2025 } from '@/ai/flows/legal-constants';

/**
 * Calcula Lucro Presumido
 */
/**
 * Calcula Lucro Presumido
 */
export function calculateLucroPresumido(
    monthlyRevenue: number,
    type: 'Geral' | 'Hospitalar' | 'Comercio' | 'ComercioMonofasico',
    issRate: number = 5,
    icmsRate: number = 0 // Usado apenas se for comércio
) {
    let rules;
    switch (type) {
        case 'Hospitalar': rules = LEGAL_CONSTANTS_2025.presumidoHospitalar; break;
        case 'Comercio': rules = LEGAL_CONSTANTS_2025.presumidoComercio; break;
        case 'ComercioMonofasico': rules = LEGAL_CONSTANTS_2025.presumidoMonofasico; break;
        default: rules = LEGAL_CONSTANTS_2025.presumidoGeral;
    }

    // 1. PIS e COFINS (Cumulativo)
    const pis = monthlyRevenue * rules.pisRate;
    const cofins = monthlyRevenue * rules.cofinsRate;

    // 2. IRPJ
    const irpjBase = monthlyRevenue * rules.irpjBase;
    let irpj = irpjBase * rules.irpjRate;

    // Adicional de IRPJ (10% sobre o que exceder 20k/mês)
    if (irpjBase > rules.additionalIrpjThreshold) {
        irpj += (irpjBase - rules.additionalIrpjThreshold) * rules.additionalIrpjRate;
    }

    // 3. CSLL
    const csllBase = monthlyRevenue * rules.csllBase;
    const csll = csllBase * rules.csllRate;

    // 4. ISS (Municipal) ou ICMS (Estadual)
    const iss = type === 'Comercio' ? 0 : monthlyRevenue * (issRate / 100);
    const icms = type === 'Comercio' ? monthlyRevenue * (icmsRate / 100) : 0;

    const totalTax = pis + cofins + irpj + csll + iss + icms;

    return {
        totalTax,
        effectiveRate: monthlyRevenue > 0 ? (totalTax / monthlyRevenue) * 100 : 0,
        breakdown: {
            pis,
            cofins,
            irpj,
            csll,
            iss,
            icms
        }
    };
}

/**
 * Calcula Lucro Presumido para múltiplas atividades (Base Mista)
 */
export function calculateMixedPresumido(
    activities: Array<{ revenue: number, type: 'commerce' | 'service' | 'industry' }>,
    issRate: number = 5,
    icmsRate: number = 18
) {
    let totalRevenue = 0;
    let totalPis = 0;
    let totalCofins = 0;
    let totalIrpjBase = 0;
    let totalCsllBase = 0;
    let totalIss = 0;
    let totalIcms = 0;

    for (const activity of activities) {
        totalRevenue += activity.revenue;

        // Regras baseadas no tipo
        let rules;
        if (activity.type === 'service') rules = LEGAL_CONSTANTS_2025.presumidoGeral;
        // Indústria e Comércio tem bases iguais para IRPJ/CSLL na regra geral (8%/12%)
        else rules = LEGAL_CONSTANTS_2025.presumidoComercio;

        // PIS/COFINS
        totalPis += activity.revenue * rules.pisRate;
        totalCofins += activity.revenue * rules.cofinsRate;

        // Formação da Base de Cálculo
        totalIrpjBase += activity.revenue * rules.irpjBase;
        totalCsllBase += activity.revenue * rules.csllBase;

        // Impostos Estaduais/Municipais
        if (activity.type === 'service') {
            totalIss += activity.revenue * (issRate / 100);
        } else {
            totalIcms += activity.revenue * (icmsRate / 100);
        }
    }

    // Calcular IRPJ sobre a base total acumulada
    let totalIrpj = totalIrpjBase * 0.15;
    if (totalIrpjBase > 20000) {
        totalIrpj += (totalIrpjBase - 20000) * 0.10;
    }

    // Calcular CSLL sobre a base total acumulada
    // Nota: CSLL é 9% para todos no Presumido, exceto financeiras
    const totalCsll = totalCsllBase * 0.09;

    const totalTax = totalPis + totalCofins + totalIrpj + totalCsll + totalIss + totalIcms;

    return {
        totalTax,
        effectiveRate: totalRevenue > 0 ? (totalTax / totalRevenue) * 100 : 0,
        breakdown: {
            pis: totalPis,
            cofins: totalCofins,
            irpj: totalIrpj,
            csll: totalCsll,
            iss: totalIss,
            icms: totalIcms
        }
    };
}

/**
 * Calcula Lucro Real (Estimativa Simplificada sobre Receita)
 * O Lucro Real exato depende das despesas reais (balanço). 
 * Aqui usamos uma estimativa conservadora ou baseada na presunção para fins de comparação preliminar,
 * mas alertando que depende do lucro líquido contábil.
 * 
 * Para serviços médicos com alta margem, Lucro Real geralmente não compensa, 
 * exceto se houver prejuízo ou margem < 32%.
 */
export function calculateLucroRealSimples(monthlyRevenue: number, profitMargin: number = 0.40, issRate: number = 5.0) {
    const rules = LEGAL_CONSTANTS_2025.realServicos;

    // PIS/COFINS (Não Cumulativo - alíquotas maiores, mas com crédito. 
    // Serviços tem pouco crédito, então o peso é alto)
    const pis = monthlyRevenue * rules.pisRate;
    const cofins = monthlyRevenue * rules.cofinsRate;

    // ISS
    const iss = monthlyRevenue * (issRate / 100);

    // IRPJ/CSLL sobre o LUCRO REAL (Margem estimada)
    const realProfit = monthlyRevenue * profitMargin;

    let irpj = realProfit * rules.irpjRate;
    if (realProfit > 20000) {
        irpj += (realProfit - 20000) * rules.additionalIrpjRate;
    }

    const csll = realProfit * rules.csllRate;

    const totalTax = pis + cofins + iss + irpj + csll;

    return {
        totalTax,
        effectiveRate: (totalTax / monthlyRevenue) * 100
    };
}
