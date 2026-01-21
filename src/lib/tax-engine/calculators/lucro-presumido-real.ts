import { LEGAL_CONSTANTS_2025 } from '@/ai/flows/legal-constants';

/**
 * Calcula Lucro Presumido
 */
export function calculateLucroPresumido(
    monthlyRevenue: number,
    type: 'Geral' | 'Hospitalar',
    issRate: number = 0.05 // 2% a 5%
) {
    const rules = type === 'Hospitalar'
        ? LEGAL_CONSTANTS_2025.presumidoHospitalar
        : LEGAL_CONSTANTS_2025.presumidoGeral;

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

    // 4. ISS (Municipal)
    const iss = monthlyRevenue * (issRate / 100);

    const totalTax = pis + cofins + irpj + csll + iss;

    return {
        totalTax,
        effectiveRate: (totalTax / monthlyRevenue) * 100,
        breakdown: {
            pis,
            cofins,
            irpj,
            csll,
            iss
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
export function calculateLucroRealSimples(monthlyRevenue: number, profitMargin: number = 0.40, issRate: number = 0.05) {
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
