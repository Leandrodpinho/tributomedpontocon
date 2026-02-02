
import { LEGAL_CONSTANTS_2025 } from '@/ai/flows/legal-constants';

/**
 * Calculadora para Produtor Rural Pessoa Física
 * Compara:
 * 1. Livro Caixa Digital (LCDPR) - Opção pelo Resultado (Receita - Custos - Investimentos)
 * 2. Arbitramento/Simplificado - 20% sobre a Receita Bruta
 */

export interface AgroInput {
    annualRevenue: number;
    operatingExpenses: number; // Custeio (Sementes, defensivos, adubo, mão de obra)
    investments: number; // Investimentos (Máquinas, benfeitorias - Dedutíveis 100% no ano)
    priorLosses: number; // Prejuízos de anos anteriores
}

export interface AgroScenario {
    name: string;
    taxableBase: number;
    totalTax: number;
    effectiveRate: number;
    isRecommended: boolean;
    details: string;
}

export interface AgroAnalysis {
    lcdpr: AgroScenario; // Opção Real/Caixa
    simplified: AgroScenario; // Opção 20%
    bestScenario: string;
    savings: number;
}

// Reutiliza a tabela IRPF existente
function calculateIRPFAnnual(base: number): number {
    if (base <= 0) return 0;

    // Como a tabela em legal-constants é mensal, vamos anualizar para o cálculo rural que geralmente é pensado anualmente
    // Ou usamos a regra mensal * 12. Para precisão, vamos multiplicar as faixas por 12.
    const annualTable = LEGAL_CONSTANTS_2025.irpfTable.map(t => ({
        limit: t.limit * 12,
        rate: t.rate,
        deduction: t.deduction * 12
    }));

    const bracket = annualTable.find(b => base <= b.limit) || annualTable[annualTable.length - 1];
    return (base * bracket.rate) - bracket.deduction;
}

export function calculateAgroScenario(input: AgroInput): AgroAnalysis {
    // 1. Cenário LCDPR (Resultado Real)
    // Base = Receita - Despesas - Investimentos
    // Diferença chave do Médico: Médico não deduz investimento (equipamento). Rural deduz tudo (Trator, Silo).
    let realBase = input.annualRevenue - input.operatingExpenses - input.investments;

    // Compensação de Prejuízos (limitado a reduzir a base a zero, o resto acumula)
    if (input.priorLosses > 0) {
        realBase = realBase - input.priorLosses;
    }

    const taxLCDPR = calculateIRPFAnnual(Math.max(0, realBase));


    // 2. Cenário Simplificado (Arbitramento 20%)
    // O produtor pode optar por tributar sobre 20% da Receita Bruta, ignorando despesas.
    // Útil quando a margem de lucro é muito alta (>20%) ou despesas não comprovadas.
    const presumedBase = input.annualRevenue * 0.20;
    const taxSimplified = calculateIRPFAnnual(presumedBase);


    // Análise
    const isLCDPRBetter = taxLCDPR < taxSimplified;
    const savings = Math.abs(taxLCDPR - taxSimplified);

    return {
        lcdpr: {
            name: "Livro Caixa Digital (Resultado Real)",
            taxableBase: realBase,
            totalTax: taxLCDPR,
            effectiveRate: (taxLCDPR / input.annualRevenue) * 100,
            isRecommended: isLCDPRBetter,
            details: "Deduz Custeio + Investimentos + Prejuízos"
        },
        simplified: {
            name: "Simplificado (20% da Receita)",
            taxableBase: presumedBase,
            totalTax: taxSimplified,
            effectiveRate: (taxSimplified / input.annualRevenue) * 100,
            isRecommended: !isLCDPRBetter,
            details: "Presunção legal de lucro de 20%"
        },
        bestScenario: isLCDPRBetter ? 'LCDPR' : 'SIMPLIFIED',
        savings
    };
}

// ==========================================
// AGRO EXPERT: Funrural, ITR, Arrendamento
// ==========================================

/**
 * Funrural - Contribuição Previdenciária do Produtor Rural PF
 * Incide sobre a Receita Bruta da Comercialização.
 * Alíquotas 2025:
 * - 1.2% INSS (empregador)
 * - 0.1% RAT (Risco Ambiental)
 * - 0.2% SENAR
 * Total: 1.5% (pode variar se sub-rogação, onde comprador recolhe 2.3%)
 */
export function calculateFunrural(grossRevenue: number, isSubrogation: boolean = false): number {
    const rate = isSubrogation ? 0.023 : 0.015;
    return grossRevenue * rate;
}

/**
 * ITR - Imposto Territorial Rural
 * Base: VTN (Valor da Terra Nua) x Grau de Utilização
 * Tabela Progressiva (simplificada para simulação).
 * Quanto maior a área improdutiva, maior a alíquota.
 */
export interface ITRInput {
    vtn: number; // Valor da Terra Nua (R$)
    totalArea: number; // Área total em hectares
    usedArea: number; // Área efetivamente utilizada
}

export function calculateITR(input: ITRInput): { tax: number; effectiveRate: number; utilizationRate: number } {
    const utilizationRate = (input.usedArea / input.totalArea) * 100;

    // Tabela ITR simplificada (Alíquota sobre VTN)
    // Quanto menor a utilização, maior a alíquota (punição para terra improdutiva)
    let rate = 0.03; // default 0.03%
    if (utilizationRate < 30) rate = 20.0;
    else if (utilizationRate < 50) rate = 10.0;
    else if (utilizationRate < 65) rate = 3.3;
    else if (utilizationRate < 80) rate = 0.65;
    else rate = 0.03; // Uso eficiente

    const tax = input.vtn * (rate / 100);

    return {
        tax,
        effectiveRate: rate,
        utilizationRate
    };
}

/**
 * Arrendamento vs Parceria (para o PROPRIETÁRIO da terra)
 * 
 * Arrendamento: Recebe valor fixo (aluguel). Tributa como RENDA COMUM (até 27.5% IRPF).
 * Parceria: Recebe % da produção. Tributa como RENDA RURAL (regras mais favoráveis).
 * 
 * Decisão: Se margem > 20%, Parceria tende a ser melhor (usa regra 20% simplificado).
 */
export interface LandContractInput {
    monthlyRent: number; // Valor do Arrendamento (se escolher arrendar)
    estimatedProductionShare: number; // Valor estimado da parceria (ex: 30% da produção)
}

export function compareArrendamentoVsParceria(input: LandContractInput): {
    arrendamento: { annualIncome: number; tax: number; netIncome: number };
    parceria: { annualIncome: number; tax: number; netIncome: number };
    recommendation: 'ARRENDAMENTO' | 'PARCERIA';
    savings: number;
} {
    // ARRENDAMENTO: Tributa como renda de aluguel PF (Carnê-Leão mensal, até 27.5%)
    const annualRent = input.monthlyRent * 12;
    const taxArrendamento = calculateIRPFAnnual(annualRent);

    // PARCERIA: Tributa como atividade rural (pode usar 20% simplificado)
    const annualParceria = input.estimatedProductionShare;
    const taxParceria = calculateIRPFAnnual(annualParceria * 0.20); // Base 20% da receita

    const netArrendamento = annualRent - taxArrendamento;
    const netParceria = annualParceria - taxParceria;

    const recommendation = netParceria > netArrendamento ? 'PARCERIA' : 'ARRENDAMENTO';
    const savings = Math.abs(netParceria - netArrendamento);

    return {
        arrendamento: { annualIncome: annualRent, tax: taxArrendamento, netIncome: netArrendamento },
        parceria: { annualIncome: annualParceria, tax: taxParceria, netIncome: netParceria },
        recommendation,
        savings
    };
}

/**
 * Análise Completa de Safra (Consolidado)
 * Junta todos os custos rurais para uma visão de DRE.
 */
export interface HarvestAnalysisInput extends AgroInput {
    funruralRevenue: number; // Base Funrural (geralmente = annualRevenue)
    itr: ITRInput;
    isSubrogation?: boolean; // Flag para taxa de sub-rogação (2.3% vs 1.5%)
}

export interface HarvestDRE {
    grossRevenue: number;
    operatingCosts: number;
    investments: number;
    funrural: number;
    itr: number;
    irpf: number;
    netProfit: number;
    effectiveTaxRate: number;
}

export function calculateHarvestDRE(input: HarvestAnalysisInput): HarvestDRE {
    const funrural = calculateFunrural(input.funruralRevenue, input.isSubrogation ?? false);
    const itr = calculateITR(input.itr).tax;
    const agroAnalysis = calculateAgroScenario(input);

    const irpf = agroAnalysis.bestScenario === 'LCDPR' ? agroAnalysis.lcdpr.totalTax : agroAnalysis.simplified.totalTax;

    const totalTaxes = funrural + itr + irpf;
    const netProfit = input.annualRevenue - input.operatingExpenses - input.investments - totalTaxes;

    return {
        grossRevenue: input.annualRevenue,
        operatingCosts: input.operatingExpenses,
        investments: input.investments,
        funrural,
        itr,
        irpf,
        netProfit,
        effectiveTaxRate: (totalTaxes / input.annualRevenue) * 100
    };
}
