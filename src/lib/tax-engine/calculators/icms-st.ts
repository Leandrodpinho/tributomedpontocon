/**
 * ICMS-ST (Substituição Tributária) & Varejo Expert Calculations
 * For Retail (Supermarkets, Gas Stations)
 */

/**
 * ICMS-ST: Substituição Tributária
 * O fabricante recolhe o ICMS de toda a cadeia "antecipado".
 * O varejista, na revenda, NÃO recolhe ICMS diretamente (já foi recolhido).
 * 
 * Impacto: O custo da ST está embutido no preço de compra.
 * A margem do varejista é sobre o preço final - (custo + ST embutida).
 */
export interface IcmsST_Input {
    purchasePrice: number; // Preço de compra (já com ST embutido)
    sellingPrice: number; // Preço de venda ao consumidor
    icmsInternalRate: number; // Alíquota interna ICMS (ex: 18% SP)
    mvaPercent: number; // Margem de Valor Agregado (ex: 40% para bebidas)
}

export function calculateIcmsST(input: IcmsST_Input): {
    stIncluded: number;
    icmsOwn: number;
    grossMargin: number;
    netMarginAfterIcms: number;
} {
    // O ICMS-ST é calculado pelo fabricante sobre MVA.
    // ST = (BaseCalculo * AliqInterna) - ICMSProprio
    // Base Calculo = PrecoPauta ou (Custo + MVA)
    const baseCalcST = input.purchasePrice * (1 + input.mvaPercent / 100);
    const icmsTotal = baseCalcST * (input.icmsInternalRate / 100);
    const icmsOwn = input.purchasePrice * (input.icmsInternalRate / 100);
    const stIncluded = icmsTotal - icmsOwn;

    const grossMargin = input.sellingPrice - input.purchasePrice;
    const netMarginAfterIcms = grossMargin - stIncluded;

    return {
        stIncluded, // Valor recolhido como ST embutida
        icmsOwn, // ICMS Próprio (crédito se Lucro Real)
        grossMargin,
        netMarginAfterIcms
    };
}

/**
 * Difal: Diferencial de Alíquota (Compra Interestadual)
 * Quando compra de outro estado, paga a diferença entre alíquota interna e interestadual.
 */
export interface DifalInput {
    purchaseValue: number;
    originStateRate: number; // Ex: 12% (interestadual Sul/Sudeste)
    destinationStateRate: number; // Ex: 18% (SP)
}

export function calculateDifal(input: DifalInput): number {
    const diffRate = input.destinationStateRate - input.originStateRate;
    return input.purchaseValue * (diffRate / 100);
}

/**
 * Pump Price Calculator (Postos de Gasolina)
 * Calcula a margem líquida do posto considerando:
 * - PIS/COFINS Monofásico (já pago na refinaria)
 * - ICMS (varia por UF, fixado por litro)
 * - CIDE (quando aplicável)
 */
export interface PumpPriceInput {
    costPerLiter: number; // Custo do combustível (distribuidora)
    sellingPricePerLiter: number; // Preço na bomba
    icmsPerLiter: number; // ICMS fixo por litro (ex: R$ 1.37 gasolina SP)
    isEthanol?: boolean; // Se etanol, não tem CIDE
}

export function calculatePumpMargin(input: PumpPriceInput): {
    grossMargin: number;
    icms: number;
    cide: number;
    pisCofins: number; // Já pago na refinaria, mas mostramos para referência
    netMargin: number;
    netMarginPercent: number;
} {
    const grossMargin = input.sellingPricePerLiter - input.costPerLiter;

    // ICMS: Fixo por litro definido pelo CONFAZ
    const icms = input.icmsPerLiter;

    // CIDE: Apenas para gasolina e diesel (não etanol)
    const cide = input.isEthanol ? 0 : 0.10; // ~R$ 0.10/litro (simplificado)

    // PIS/COFINS Monofásico: Já está no custo do combustível (R$ ~0.40/litro gasolina)
    // O posto NÃO paga novamente. Apenas para visualização.
    const pisCofins = 0; // Efetivamente zero para o posto na revenda

    // Na prática, o ICMS ST já está embutido no custo do combustível.
    // A margem do posto é pequena (R$ 0.20 a 0.50 por litro).
    // O cálculo aqui serve para estimar se o preço de bomba cobre os custos.

    const netMargin = grossMargin - icms - cide - pisCofins;
    const netMarginPercent = (netMargin / input.sellingPricePerLiter) * 100;

    return {
        grossMargin,
        icms,
        cide,
        pisCofins,
        netMargin,
        netMarginPercent
    };
}

/**
 * Convenience Store Segregation (Loja de Conveniência no Posto)
 * Postos com loja de conveniência podem ter duas receitas:
 * 1. Combustíveis (Monofásico)
 * 2. Loja (Tributação Normal)
 * Se ambos no mesmo CNPJ, é Segregação de Receitas.
 * Se CNPJs separados, são empresas distintas (pode otimizar regime).
 */
export interface DualBusinessInput {
    fuelRevenueMonthly: number;
    storeRevenueMonthly: number;
    isSeparateCNPJ: boolean;
}

export function analyzeConvenienceStore(input: DualBusinessInput): {
    combinedScenario: { totalTax: number; effective: number };
    separatedScenario: { fuelTax: number; storeTax: number; totalTax: number; effective: number };
    savings: number;
    recommendation: 'COMBINED' | 'SEPARATED';
} {
    const totalRevenue = input.fuelRevenueMonthly + input.storeRevenueMonthly;

    // Combined (Mesmo CNPJ - Lucro Presumido)
    // Combustível: ~3.65% (PIS/COFINS Monofásico = 0, só Federal ~3.65% LP)
    // Loja: ~11.33% (LP Serviços geral com PIS/COFINS)
    // Ponderado pela receita
    const fuelTaxCombined = input.fuelRevenueMonthly * 0.0365; // Só Federal, sem PIS/COFINS
    const storeTaxCombined = input.storeRevenueMonthly * 0.1133;
    const combinedTotal = fuelTaxCombined + storeTaxCombined;

    // Separated (CNPJs diferentes)
    // Combustível CNPJ no Presumido (3.65%)
    // Loja CNPJ no Simples Anexo I (começa ~4%)
    const fuelTaxSeparated = input.fuelRevenueMonthly * 0.0365;
    const storeTaxSeparated = input.storeRevenueMonthly * 0.04; // Simples Anexo I inicial
    const separatedTotal = fuelTaxSeparated + storeTaxSeparated;

    const savings = combinedTotal - separatedTotal;

    return {
        combinedScenario: { totalTax: combinedTotal, effective: (combinedTotal / totalRevenue) * 100 },
        separatedScenario: { fuelTax: fuelTaxSeparated, storeTax: storeTaxSeparated, totalTax: separatedTotal, effective: (separatedTotal / totalRevenue) * 100 },
        savings: Math.max(0, savings),
        recommendation: savings > 0 ? 'SEPARATED' : 'COMBINED'
    };
}
