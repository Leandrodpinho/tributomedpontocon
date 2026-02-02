
/**
 * Motor de Cálculo para Holding Patrimonial
 * Focado em:
 * 1. Economia de ITCMD (Sucessão)
 * 2. Economia de IRPF sobre Aluguéis
 */

export interface HoldingInput {
    estateValueMarket: number;   // Valor de Mercado dos Bens (Base ITCMD na PF)
    estateValueBook: number;     // Valor Declarado no IR (Base ITCMD na Holding)
    rentalIncome: number;        // Renda Mensal de Aluguéis
    state: 'SP' | 'RJ' | 'MG' | 'RS' | 'PR' | 'SC' | 'OTHER'; // UF para Tabela ITCMD
    heirs: number;               // Número de herdeiros (para simular doação)
}

export interface HoldingScenario {
    name: string;
    monthlyTax: number;
    monthlyNet: number;
    successionCost: number;
    successionSavings: number;
    isRecommended: boolean;
}

export interface HoldingAnalysis {
    pf: {
        monthlyTax: number;
        monthlyNet: number;
        successionCost: number; // ITCMD + Advogado
    };
    holding: {
        monthlyTax: number;
        monthlyNet: number;
        successionCost: number; // ITCMD sobre Quotas
    };
    savings: {
        monthlyAmount: number;
        monthlyPercentage: number;
        successionAmount: number;
        successionPercentage: number;
    };
    holdingWorthIt: boolean; // Indica se a holding faz sentido financeiro
    breakevenYears: number | null; // Em quantos anos a holding "se paga"
    annualHoldingCost: number; // Custo anual estimado de manutenção
}

// Tabelas de ITCMD (Simplificadas para 2025/2026)
// Nota: Com a reforma, todos tendem a ser progressivos, mas usamos as regras vigentes/projetadas
const ITCMD_RATES = {
    SP: [{ limit: Infinity, rate: 0.04 }], // Fixo 4% (Tendência virar progressivo)
    RJ: [ // Progressivo atual RJ
        { limit: 100000, rate: 0.04 },
        { limit: 400000, rate: 0.05 },
        { limit: Infinity, rate: 0.08 },
    ],
    MG: [{ limit: Infinity, rate: 0.05 }], // Exemplo Simplificado
    OTHER: [{ limit: Infinity, rate: 0.04 }], // Média nacional
};

// Tabelas IRPF 2025
const IRPF_TABLE = [
    { limit: 2259.20, rate: 0.00, deduction: 0.00 },
    { limit: 2826.65, rate: 0.075, deduction: 169.44 },
    { limit: 3751.05, rate: 0.15, deduction: 381.44 },
    { limit: 4664.68, rate: 0.225, deduction: 662.77 },
    { limit: Infinity, rate: 0.275, deduction: 896.00 },
];

function calculateIRPF(income: number): number {
    const bracket = IRPF_TABLE.find(b => income <= b.limit) || IRPF_TABLE[IRPF_TABLE.length - 1];
    return (income * bracket.rate) - bracket.deduction;
}

function calculateITCMD(value: number, state: 'SP' | 'RJ' | 'MG' | 'OTHER') {
    // Simplificação: Aplicar tabela do estado. 
    // Na prática é estado-a-estado, aqui usamos as principais ou default.
    const stateKey = state as keyof typeof ITCMD_RATES;
    const table = ITCMD_RATES[stateKey] || ITCMD_RATES.OTHER;

    // Cálculo Progressivo ou Fixo
    // Se for array de 1 item e limite Infinity, é fixo (ex: SP)
    if (table.length === 1 && table[0].limit === Infinity) {
        return value * table[0].rate;
    }

    // Se for progressivo (ex: RJ), o cálculo incide sobre faixas ou alíquota efetiva dependendo da lei local.
    // Para simplificar a simulação no MV, vamos aplicar a alíquota da faixa total (modelo "sobre o montante") 
    // que é comum em ITCMD, diferente do IRPF que é "por fatias".
    // Em muitos estados (ex: RJ), a alíquota incide sobre o TOTAL baseado na faixa.

    const bracket = table.find((b) => value <= b.limit) || table[table.length - 1];
    return value * bracket.rate;
}

export function calculateHoldingScenario(input: HoldingInput): HoldingAnalysis {
    // 1. Cenário Pessoa Física (Sem Planejamento)

    // Aluguéis PF
    const pfMonthlyTax = calculateIRPF(input.rentalIncome);
    const pfMonthlyNet = input.rentalIncome - pfMonthlyTax;

    // Sucessão PF
    // Base: Valor de Mercado
    const itcmdPf = calculateITCMD(input.estateValueMarket, input.state as 'SP' | 'RJ' | 'MG' | 'OTHER');
    const lawyerFees = input.estateValueMarket * 0.06; // Média de 6% honorários + custas
    const pfSuccessionCost = itcmdPf + lawyerFees;

    // 2. Cenário Holding (Lucro Presumido)

    // Aluguéis Holding
    // Presunção 32% (IRPJ/CSLL) + PIS/COFINS 3.65%
    // Carga aproximada: 11.33% (se não tiver adicional IRPJ > 20k lucro)
    // Cálculo detalhado:
    const pisCofins = input.rentalIncome * 0.0365;
    const irpjBase = input.rentalIncome * 0.32;
    const csllBase = input.rentalIncome * 0.32;

    let irpj = irpjBase * 0.15;
    if (irpjBase > 20000) irpj += (irpjBase - 20000) * 0.10; // Adicional

    const csll = csllBase * 0.09;

    const holdingMonthlyTax = pisCofins + irpj + csll;
    const holdingMonthlyNet = input.rentalIncome - holdingMonthlyTax; // *Ainda tem dividendos isentos (por enquanto)

    // Sucessão Holding
    // Base: Valor Declarado (Book Value) das Quotas
    // Doação com Reserva de Usufruto
    // Em SP, paga-se 4% sobre 2/3 do valor na doação da nu-propriedade. No falecimento, paga o resto.
    // Vamos simplificar assumindo Doação Total em Vida para estancar o risco.
    const itcmdHolding = calculateITCMD(input.estateValueBook, input.state as 'SP' | 'RJ' | 'MG' | 'OTHER');
    const holdingSetupCost = 15000; // Custo estimado abertura/contador (valor fixo simbólico para a simulação)
    // Na holding não tem "inventário" dos imóveis, eles já são da empresa. Tem alteração contratual.
    const holdingSuccessionCost = itcmdHolding + holdingSetupCost;

    // Análise de Viabilidade
    const monthlyDifference = pfMonthlyTax - holdingMonthlyTax;
    const annualHoldingCost = 15000; // Custo anual estimado (contador + manutenção)
    const annualSavingsFromRental = monthlyDifference * 12;

    // Breakeven: Em quantos anos a economia de sucessão + aluguel paga o custo da holding
    const totalSuccessionSavings = pfSuccessionCost - holdingSuccessionCost;
    const netAnnualBenefit = annualSavingsFromRental; // Se negativo, só tem sentido se sucessão compensar

    let breakevenYears = Infinity;
    if (netAnnualBenefit > 0) {
        // Holding "se paga" pelo benefício mensal
        breakevenYears = annualHoldingCost / netAnnualBenefit;
    } else if (totalSuccessionSavings > 0) {
        // Prejuízo mensal, mas ganho na sucessão. Quantos anos de prejuízo até a sucessão?
        // Se o prejuízo anual * X anos superar o ganho de sucessão, não vale.
        // Vamos calcular "em quantos anos o prejuízo come o benefício da sucessão"
        breakevenYears = totalSuccessionSavings / Math.abs(netAnnualBenefit - annualHoldingCost);
    }

    // Recomendação: Vale a pena se breakeven < 10 anos ou se há grande ganho de sucessão
    const holdingWorthIt = breakevenYears < 10 || totalSuccessionSavings > 100000;

    return {
        pf: {
            monthlyTax: pfMonthlyTax,
            monthlyNet: pfMonthlyNet,
            successionCost: pfSuccessionCost
        },
        holding: {
            monthlyTax: holdingMonthlyTax,
            monthlyNet: holdingMonthlyNet,
            successionCost: holdingSuccessionCost
        },
        savings: {
            monthlyAmount: monthlyDifference,
            monthlyPercentage: pfMonthlyTax > 0 ? ((monthlyDifference) / pfMonthlyTax) * 100 : 0,
            successionAmount: totalSuccessionSavings,
            successionPercentage: pfSuccessionCost > 0 ? ((totalSuccessionSavings) / pfSuccessionCost) * 100 : 0
        },
        holdingWorthIt,
        breakevenYears: isFinite(breakevenYears) ? Math.round(breakevenYears * 10) / 10 : null,
        annualHoldingCost
    };
}

export interface FinancialProjectionYear {
    year: number;
    propertyValue: number;
    rentalIncome: number;
    maintenanceCost: number;
    taxes: number;
    netIncome: number;
    accumulatedWealth: number;
}

export function calculateHoldingProjections(
    estateValue: number,
    monthlyRent: number,
    assumptions: { appreciation: number; vacancy: number; maintenance: number; admin: number }
): FinancialProjectionYear[] {
    const projection: FinancialProjectionYear[] = [];
    const currentAttributes = {
        value: estateValue,
        rent: monthlyRent * 12
    };

    // Simulação de 10 anos
    for (let i = 1; i <= 10; i++) {
        // Receita Bruta (com Vacância)
        const grossRent = currentAttributes.rent * (1 - (assumptions.vacancy / 100));

        // Impostos (Holding ~11.33%)
        const taxes = grossRent * 0.1133;

        // Custos (Manutenção + Contador)
        const maintenance = (currentAttributes.value * (assumptions.maintenance / 100)) + (assumptions.admin * 12);

        // Líquido
        const net = grossRent - taxes - maintenance;

        // Valorização do Imóvel
        currentAttributes.value = currentAttributes.value * (1 + (assumptions.appreciation / 100));
        // Reajuste do Aluguel (acompanhando inflação/valorização - simplificado)
        currentAttributes.rent = currentAttributes.rent * (1 + (assumptions.appreciation / 100));

        projection.push({
            year: i,
            propertyValue: currentAttributes.value,
            rentalIncome: grossRent,
            maintenanceCost: maintenance,
            taxes: taxes,
            netIncome: net,
            accumulatedWealth: currentAttributes.value // Simplified wealth logic
        });
    }

    return projection;
}
