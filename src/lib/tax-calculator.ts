
export const LEGAL_CONSTANTS = {
    minimumWage: 1518.0,
    inssCeiling: 8157.41,
};

export interface TaxCalculationInput {
    monthlyRevenue: number;
    payrollExpenses: number; // Folha CLT bruta (sem pró-labore)
    issRate: number; // %
    proLabore?: number; // Se não informado, calcula o ideal/mínimo
}

export interface TaxScenarioResult {
    name: string;
    totalTax: number;
    effectiveRate: number;
    netProfit: number;
    proLabore: number;
    inssTax: number;
    irpfTax: number;
    notes: string[];
}

// Tabelas Simples Nacional 2025 (Estimadas/Vigentes)
const SIMPLES_ANEXO_III = [
    { range: 180000, rate: 0.060, deduction: 0 },
    { range: 360000, rate: 0.112, deduction: 9360 },
    { range: 720000, rate: 0.135, deduction: 17640 },
    { range: 1800000, rate: 0.160, deduction: 35640 },
    { range: 3600000, rate: 0.210, deduction: 125640 },
    { range: 4800000, rate: 0.330, deduction: 648000 }, // Faixa final com ISS fixo/separado muitas vezes, mas simplificando
];

const SIMPLES_ANEXO_V = [
    { range: 180000, rate: 0.155, deduction: 0 },
    { range: 360000, rate: 0.180, deduction: 4500 },
    { range: 720000, rate: 0.195, deduction: 9900 },
    { range: 1800000, rate: 0.205, deduction: 17100 },
    { range: 3600000, rate: 0.230, deduction: 62100 },
    { range: 4800000, rate: 0.305, deduction: 540000 },
];

const IRPF_2025 = [
    { limit: 2259.20, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 169.44 },
    { limit: 3751.05, rate: 0.150, deduction: 381.44 },
    { limit: 4664.68, rate: 0.225, deduction: 662.77 },
    { limit: Infinity, rate: 0.275, deduction: 896.00 },
];

export function calculateSimplesTax(rbt12: number, anexo: typeof SIMPLES_ANEXO_III): number {
    const range = anexo.find(r => rbt12 <= r.range) || anexo[anexo.length - 1];
    const nominalTax = (rbt12 * range.rate) - range.deduction;
    const effectiveRate = nominalTax / rbt12;
    return effectiveRate;
}

export function calculateINSS(proLabore: number): number {
    // Simplificado para contribuinte individual (11% limitado ao teto)
    const base = Math.min(proLabore, LEGAL_CONSTANTS.inssCeiling);
    return base * 0.11;
}

export function calculateIRPF(taxableIncome: number, inssDeduction: number): number {
    const base = taxableIncome - inssDeduction; // Simplificado, sem dependentes por enquanto
    const bracket = IRPF_2025.find(b => base <= b.limit) || IRPF_2025[IRPF_2025.length - 1];
    const irpf = (base * bracket.rate) - bracket.deduction;
    return Math.max(0, irpf);
}

export function calculateAllScenarios(input: TaxCalculationInput): TaxScenarioResult[] {
    const { monthlyRevenue, payrollExpenses, issRate } = input;
    const rbt12 = monthlyRevenue * 12;
    const results: TaxScenarioResult[] = [];

    // --- 1. Simples Nacional ---
    // Estratégia: Tentar Anexo III pelo Fator R
    // Se folha atual já permite, ótimo. Se não, simular "Pró-labore Ideal" para atingir 28%

    const targetFactorR = 0.28;
    const neededFolha12 = rbt12 * targetFactorR;
    const currentFolha12 = payrollExpenses * 12; // Simplificado sem 13o/férias da CLT para este MVP

    // Cenário A: Simples Anexo V (sem ajuste de pró-labore, usando mínimo)
    const proLaboreMin = LEGAL_CONSTANTS.minimumWage;
    const factorR_Actual = (currentFolha12 + (proLaboreMin * 12)) / rbt12;

    // Decide anexo inicial
    let anexoV_Rate = calculateSimplesTax(rbt12, SIMPLES_ANEXO_V);
    // Se por acaso já tem fator R com mínimo (muita folha CLT), usa III
    if (factorR_Actual >= 0.28) {
        anexoV_Rate = calculateSimplesTax(rbt12, SIMPLES_ANEXO_III);
    }

    const inssMin = calculateINSS(proLaboreMin);
    const irpfMin = calculateIRPF(proLaboreMin, inssMin);
    const dasV = monthlyRevenue * anexoV_Rate;

    results.push({
        name: factorR_Actual >= 0.28 ? 'Simples Nacional (Anexo III - Natural)' : 'Simples Nacional (Anexo V)',
        totalTax: dasV + inssMin + irpfMin, // Somando impostos PF e PJ para visão integrada
        effectiveRate: ((dasV + inssMin + irpfMin) / monthlyRevenue) * 100,
        netProfit: monthlyRevenue - dasV - payrollExpenses - proLaboreMin, // Líquido da PJ (sem descontar IRPF do sócio aqui, mas a métrica totalTax engloba)
        proLabore: proLaboreMin,
        inssTax: inssMin,
        irpfTax: irpfMin,
        notes: ['Considerando pró-labore de salário mínimo.']
    });

    // Cenário B: Simples Anexo III (Ajustado pelo Fator R)
    if (factorR_Actual < 0.28) {
        const gap12 = neededFolha12 - currentFolha12;
        const neededProLaboreStats = gap12 / 12;
        // Pró-labore não pode ser menor que salário mínimo
        const proLaboreFactorR = Math.max(neededProLaboreStats, LEGAL_CONSTANTS.minimumWage);

        // Verifica se compensa (Imposto III + INSS maior + IRPF maior < Imposto V)
        const rateIII = calculateSimplesTax(rbt12, SIMPLES_ANEXO_III);
        const dasIII = monthlyRevenue * rateIII;
        const inssIII = calculateINSS(proLaboreFactorR);
        const irpfIII = calculateIRPF(proLaboreFactorR, inssIII);

        results.push({
            name: 'Simples Nacional (Fator R Otimizado)',
            totalTax: dasIII + inssIII + irpfIII,
            effectiveRate: ((dasIII + inssIII + irpfIII) / monthlyRevenue) * 100,
            netProfit: monthlyRevenue - dasIII - payrollExpenses - proLaboreFactorR,
            proLabore: proLaboreFactorR,
            inssTax: inssIII,
            irpfTax: irpfIII,
            notes: [`Pró-labore ajustado para R$ ${proLaboreFactorR.toFixed(2)} para atingir 28% de folha.`]
        });
    }

    // --- 2. Lucro Presumido ---
    // Presunção 32% Serviços
    const baseCalculo = monthlyRevenue * 0.32;
    const pis = monthlyRevenue * 0.0065;
    const cofins = monthlyRevenue * 0.03;
    const irpj = (baseCalculo * 0.15) + (baseCalculo > 20000 ? (baseCalculo - 20000) * 0.10 : 0);
    const csll = baseCalculo * 0.09;
    const iss = monthlyRevenue * (issRate / 100);
    const cpp = (payrollExpenses + proLaboreMin) * 0.20; // 20% sobre folha total (inclui pro-labore mínimo)

    const totalPresumido = pis + cofins + irpj + csll + iss + cpp;

    // Pessoa Física no Presumido (Mínimo)
    const inssPresumido = calculateINSS(proLaboreMin);
    const irpfPresumido = calculateIRPF(proLaboreMin, inssPresumido);

    results.push({
        name: 'Lucro Presumido (Padrão)',
        totalTax: totalPresumido + inssPresumido + irpfPresumido,
        effectiveRate: ((totalPresumido + inssPresumido + irpfPresumido) / monthlyRevenue) * 100,
        netProfit: monthlyRevenue - totalPresumido - payrollExpenses - proLaboreMin,
        proLabore: proLaboreMin,
        inssTax: inssPresumido,
        irpfTax: irpfPresumido,
        notes: ['Inclui 20% de CPP sobre a folha.']
    });

    // --- 3. Lucro Presumido (Hospitais) - Se equiparação
    // IRPJ 8%, CSLL 12%
    const baseIRPJ_Hosp = monthlyRevenue * 0.08;
    const baseCSLL_Hosp = monthlyRevenue * 0.12;
    const irpj_Hosp = (baseIRPJ_Hosp * 0.15) + (baseIRPJ_Hosp > 20000 ? (baseIRPJ_Hosp - 20000) * 0.10 : 0);
    const csll_Hosp = baseCSLL_Hosp * 0.09; // CSLL alíquota base é 9%, presunção muda

    const totalHosp = pis + cofins + irpj_Hosp + csll_Hosp + iss + cpp;
    results.push({
        name: 'Lucro Presumido (Equip. Hospitalar)',
        totalTax: totalHosp + inssPresumido + irpfPresumido,
        effectiveRate: ((totalHosp + inssPresumido + irpfPresumido) / monthlyRevenue) * 100,
        netProfit: monthlyRevenue - totalHosp - payrollExpenses - proLaboreMin,
        proLabore: proLaboreMin,
        inssTax: inssPresumido,
        irpfTax: irpfPresumido,
        notes: ['Redução de base IRPJ/CSLL para serviços hospitalares.']
    });

    return results.sort((a, b) => a.totalTax - b.totalTax);
}
