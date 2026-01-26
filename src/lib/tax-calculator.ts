export const LEGAL_CONSTANTS = {
    minimumWage: 1518.0,
    inssCeiling: 8157.41,
};

export interface TaxCalculationInput {
    monthlyRevenue: number;
    payrollExpenses: number; // Folha CLT bruta (sem pró-labore)
    issRate: number; // %
    proLabore?: number; // Se não informado, calcula o ideal/mínimo
    numberOfPartners?: number;
    isUniprofessional?: boolean; // Sociedade Uniprofissional (ISS Fixo)
    realProfitMargin?: number; // % de Lucro Real (para simulação de Lucro Real)
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
        irpfValue: number;
    };
    notes: string[];
    isBest?: boolean;
    isWorst?: boolean;
}

// Tabelas Simples Nacional 2025 (Estimadas/Vigentes)
const SIMPLES_ANEXO_III = [
    { range: 180000, rate: 0.060, deduction: 0 },
    { range: 360000, rate: 0.112, deduction: 9360 },
    { range: 720000, rate: 0.135, deduction: 17640 },
    { range: 1800000, rate: 0.160, deduction: 35640 },
    { range: 3600000, rate: 0.210, deduction: 125640 },
    { range: 4800000, rate: 0.330, deduction: 648000 },
];

const SIMPLES_ANEXO_V = [
    { range: 180000, rate: 0.155, deduction: 0 },
    { range: 360000, rate: 0.180, deduction: 4500 },
    { range: 720000, rate: 0.195, deduction: 9900 },
    { range: 1800000, rate: 0.205, deduction: 17100 },
    { range: 3600000, rate: 0.230, deduction: 62100 },
    { range: 4800000, rate: 0.305, deduction: 540000 },
];

export const IRPF_TABLE_2026 = [
    { limit: 2259.20, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 169.44 },
    { limit: 3751.05, rate: 0.150, deduction: 381.44 },
    { limit: 4664.68, rate: 0.225, deduction: 662.77 },
    { limit: Infinity, rate: 0.275, deduction: 896.00 },
];

// Desconto simplificado mensal (substitui deduções legais se for mais vantajoso)
// Valor de 2025/2026: R$ 564,80 (25% da faixa de isenção)
export const SIMPLIFIED_DISCOUNT = 564.80;

// Tabela Progressiva INSS 2025 (CLT)
export const INSS_2025_PROGRESSIVE = [
    { limit: 1518.00, rate: 0.075, deduction: 0 },
    { limit: 2793.88, rate: 0.090, deduction: 22.77 }, // (1518 * 0.09) - (1518 * 0.075) approx check... using standard method: tax = (base * rate) - deduction
    // Deduction logic for INSS is cumulative. Improved method: calculate by chunks.
    // Simplifying for logic: using reliable effective buckets or chunk calculation in function.
    // Let's use the chunk calculation method in the function for precision.
];

export const ISS_FIXO_ESTIMADO = 250.00;

export function calculateSimplesTax(rbt12: number, anexo: typeof SIMPLES_ANEXO_III): number {
    const range = anexo.find(r => rbt12 <= r.range) || anexo[anexo.length - 1];
    const nominalTax = (rbt12 * range.rate) - range.deduction;
    const effectiveRate = nominalTax / rbt12;
    return effectiveRate;
}

export function calculateINSS(proLabore: number): number {
    // Para Sócios (Contribuinte Individual): 11% fixo limitado ao teto
    const base = Math.min(proLabore, LEGAL_CONSTANTS.inssCeiling);
    return base * 0.11;
}

export function calculateINSS_CLT(grossSalary: number): number {
    let tax = 0;
    const salary = Math.min(grossSalary, LEGAL_CONSTANTS.inssCeiling);

    // Faixa 1: até 1.518,00 -> 7,5%
    if (salary > 0) {
        const range = Math.min(salary, 1518.00);
        tax += range * 0.075;
    }
    // Faixa 2: 1.518,01 até 2.793,88 -> 9%
    if (salary > 1518.00) {
        const range = Math.min(salary, 2793.88) - 1518.00;
        tax += range * 0.09;
    }
    // Faixa 3: 2.793,89 até 4.190,83 -> 12%
    if (salary > 2793.88) {
        const range = Math.min(salary, 4190.83) - 2793.88;
        tax += range * 0.12;
    }
    // Faixa 4: 4.190,84 até Teto -> 14%
    if (salary > 4190.83) {
        const range = Math.min(salary, LEGAL_CONSTANTS.inssCeiling) - 4190.83;
        tax += range * 0.14;
    }

    return tax;
}

export function calculateIRPF(taxableIncome: number, inssDeduction: number): number {
    // Aplica o desconto simplificado se for mais vantajoso que as deduções legais (INSS)
    const effectiveDeduction = Math.max(inssDeduction, SIMPLIFIED_DISCOUNT);
    const base = taxableIncome - effectiveDeduction;

    // Busca na tabela 2026
    const bracket = IRPF_TABLE_2026.find(b => base <= b.limit) || IRPF_TABLE_2026[IRPF_TABLE_2026.length - 1];
    const irpf = (base * bracket.rate) - bracket.deduction;
    return Math.max(0, irpf);
}

export function calculateAllScenarios(input: TaxCalculationInput): TaxScenarioResult[] {
    const { monthlyRevenue, payrollExpenses, issRate, isUniprofessional = false, numberOfPartners = 1 } = input;
    const rbt12 = monthlyRevenue * 12;
    const results: TaxScenarioResult[] = [];

    // --- 0. Carnê Leão (Pessoa Física) ---
    const inssPF = Math.min(monthlyRevenue, LEGAL_CONSTANTS.inssCeiling) * 0.20;
    const baseLivroCaixa = monthlyRevenue - payrollExpenses;
    const inssPF_Dedutivel = Math.min(baseLivroCaixa, LEGAL_CONSTANTS.inssCeiling) * 0.20;
    const irpfPF_Final = calculateIRPF(baseLivroCaixa, inssPF_Dedutivel);

    results.push({
        name: 'Pessoa Física (Carnê Leão)',
        totalTax: inssPF_Dedutivel + irpfPF_Final,
        effectiveRate: ((inssPF_Dedutivel + irpfPF_Final) / monthlyRevenue) * 100,
        netProfit: monthlyRevenue - (inssPF_Dedutivel + irpfPF_Final) - payrollExpenses,
        proLabore: 0,
        inssTax: inssPF_Dedutivel,
        irpfTax: irpfPF_Final,
        taxBreakdown: [
            { name: 'INSS Autônomo', value: inssPF_Dedutivel },
            { name: 'IRPF (Carnê Leão)', value: irpfPF_Final }
        ],
        notes: ['Considera dedução das despesas de folha no Livro Caixa.', 'INSS Autônomo de 20%.'],
        isWorst: true,
    });

    // --- 0.1. Pessoa Física (CLT - Comparativo) ---
    // Simula se o médico fosse contratado como CLT pelo valor do faturamento
    const inssCLT = calculateINSS_CLT(monthlyRevenue);
    const irpfCLT = calculateIRPF(monthlyRevenue, inssCLT);
    const totalTaxCLT = inssCLT + irpfCLT;

    results.push({
        name: 'Pessoa Física (CLT / Vínculo)',
        totalTax: totalTaxCLT,
        effectiveRate: (totalTaxCLT / monthlyRevenue) * 100,
        netProfit: monthlyRevenue - totalTaxCLT, // Assumindo que não paga a própria folha, mas aqui mantemos comparabilidade de receita líquida
        proLabore: 0,
        inssTax: inssCLT,
        irpfTax: irpfCLT,
        taxBreakdown: [
            { name: 'INSS (Tabela Progressiva)', value: inssCLT },
            { name: 'IRPF (Retido na Fonte)', value: irpfCLT }
        ],
        notes: ['Simulação de salário bruto igual ao faturamento.', 'Não inclui benefícios (13º/Férias/FGTS) na mensalidade.', 'INSS Progressivo.'],
    });

    // --- 1. Simples Nacional ---
    const targetFactorR = 0.28;
    const neededFolha12 = rbt12 * targetFactorR;
    const currentFolha12 = payrollExpenses * 12;

    const proLaboreMin = LEGAL_CONSTANTS.minimumWage;
    const proLaborePartners = proLaboreMin * numberOfPartners;
    const factorR_Actual = (currentFolha12 + (proLaborePartners * 12)) / rbt12;

    let anexoV_Rate = calculateSimplesTax(rbt12, SIMPLES_ANEXO_V);
    if (factorR_Actual >= 0.28) {
        anexoV_Rate = calculateSimplesTax(rbt12, SIMPLES_ANEXO_III);
    }

    const inssMin = calculateINSS(proLaboreMin) * numberOfPartners;
    const irpfMin = calculateIRPF(proLaboreMin, calculateINSS(proLaboreMin)) * numberOfPartners;
    const dasV = monthlyRevenue * anexoV_Rate;

    results.push({
        name: factorR_Actual >= 0.28 ? 'Simples Nacional (Anexo III - Natural)' : 'Simples Nacional (Anexo V)',
        totalTax: dasV + inssMin + irpfMin,
        effectiveRate: ((dasV + inssMin + irpfMin) / monthlyRevenue) * 100,
        netProfit: monthlyRevenue - dasV - payrollExpenses - proLaborePartners,
        proLabore: proLaboreMin,
        inssTax: inssMin,
        irpfTax: irpfMin,
        taxBreakdown: [
            { name: 'DAS Assumido', value: dasV },
            { name: 'INSS Sócios', value: inssMin },
            { name: 'IRPF Sócios', value: irpfMin }
        ],
        proLaboreAnalysis: {
            baseValue: proLaboreMin,
            inssValue: inssMin / numberOfPartners,
            irpfValue: irpfMin / numberOfPartners
        },
        notes: [`Considerando ${numberOfPartners} sócio(s) com retirada de 1 salário mínimo.`]
    });

    if (factorR_Actual < 0.28) {
        const gap12 = neededFolha12 - currentFolha12;
        const neededProLaboreStats = gap12 / 12;
        const proLaboreTotalNeeded = Math.max(neededProLaboreStats, proLaboreMin * numberOfPartners);
        const proLaborePerPartner = proLaboreTotalNeeded / numberOfPartners;

        const rateIII = calculateSimplesTax(rbt12, SIMPLES_ANEXO_III);
        const dasIII = monthlyRevenue * rateIII;

        const inssIII = calculateINSS(proLaborePerPartner) * numberOfPartners;
        const irpfIII = calculateIRPF(proLaborePerPartner, calculateINSS(proLaborePerPartner)) * numberOfPartners;

        results.push({
            name: 'Simples Nacional (Fator R Otimizado)',
            totalTax: dasIII + inssIII + irpfIII,
            effectiveRate: ((dasIII + inssIII + irpfIII) / monthlyRevenue) * 100,
            netProfit: monthlyRevenue - dasIII - payrollExpenses - proLaboreTotalNeeded,
            proLabore: proLaborePerPartner,
            inssTax: inssIII,
            irpfTax: irpfIII,
            taxBreakdown: [
                { name: 'DAS (Anexo III)', value: dasIII },
                { name: 'INSS Sócios', value: inssIII },
                { name: 'IRPF Sócios', value: irpfIII }
            ],
            proLaboreAnalysis: {
                baseValue: proLaborePerPartner,
                inssValue: inssIII / numberOfPartners,
                irpfValue: irpfIII / numberOfPartners
            },
            notes: [`Pró-labore ajustado para R$ ${proLaborePerPartner.toFixed(2)} (cada um dos ${numberOfPartners} sócios) para atingir 28%.`]
        });
    }

    // --- 2. Lucro Presumido ---
    const baseCalculo = monthlyRevenue * 0.32;
    const pis = monthlyRevenue * 0.0065;
    const cofins = monthlyRevenue * 0.03;
    const irpj = (baseCalculo * 0.15) + (baseCalculo > 20000 ? (baseCalculo - 20000) * 0.10 : 0);
    const csll = baseCalculo * 0.09;

    let iss = 0;
    if (isUniprofessional) {
        iss = numberOfPartners * ISS_FIXO_ESTIMADO;
    } else {
        iss = monthlyRevenue * (issRate / 100);
    }

    const cpp = (payrollExpenses + proLaborePartners) * 0.20;
    const totalPresumido = pis + cofins + irpj + csll + iss + cpp;
    const inssPresumido = calculateINSS(proLaboreMin) * numberOfPartners;
    const irpfPresumido = calculateIRPF(proLaboreMin, calculateINSS(proLaboreMin)) * numberOfPartners;

    results.push({
        name: isUniprofessional ? 'Lucro Presumido (SUP - ISS Fixo)' : 'Lucro Presumido (Padrão)',
        totalTax: totalPresumido + inssPresumido + irpfPresumido,
        effectiveRate: ((totalPresumido + inssPresumido + irpfPresumido) / monthlyRevenue) * 100,
        netProfit: monthlyRevenue - totalPresumido - payrollExpenses - proLaborePartners,
        proLabore: proLaboreMin,
        inssTax: inssPresumido,
        irpfTax: irpfPresumido,
        taxBreakdown: [
            { name: 'PIS/COFINS', value: pis + cofins },
            { name: 'IRPJ/CSLL', value: irpj + csll },
            { name: 'ISS', value: iss },
            { name: 'CPP (20%)', value: cpp },
            { name: 'INSS/IRPF Sócios', value: inssPresumido + irpfPresumido }
        ],
        notes: isUniprofessional
            ? [`Considera ISS fixo estimado de R$ ${ISS_FIXO_ESTIMADO} por sócio.`, 'Inclui 20% de CPP.']
            : ['Inclui 20% de CPP sobre a folha.']
    });

    // --- 3. Lucro Presumido (Hospitais) ---
    const baseIRPJ_Hosp = monthlyRevenue * 0.08;
    const baseCSLL_Hosp = monthlyRevenue * 0.12;
    const irpj_Hosp = (baseIRPJ_Hosp * 0.15) + (baseIRPJ_Hosp > 20000 ? (baseIRPJ_Hosp - 20000) * 0.10 : 0);
    const csll_Hosp = baseCSLL_Hosp * 0.09;
    const iss_Hosp = monthlyRevenue * (issRate / 100);
    const totalHosp = pis + cofins + irpj_Hosp + csll_Hosp + iss_Hosp + cpp;

    results.push({
        name: 'Lucro Presumido (Equip. Hospitalar)',
        totalTax: totalHosp + inssPresumido + irpfPresumido,
        effectiveRate: ((totalHosp + inssPresumido + irpfPresumido) / monthlyRevenue) * 100,
        netProfit: monthlyRevenue - totalHosp - payrollExpenses - proLaborePartners,
        proLabore: proLaboreMin,
        inssTax: inssPresumido,
        irpfTax: irpfPresumido,
        taxBreakdown: [
            { name: 'PIS/COFINS', value: pis + cofins },
            { name: 'IRPJ/CSLL (Reduzido)', value: irpj_Hosp + csll_Hosp },
            { name: 'ISS', value: iss_Hosp },
            { name: 'CPP', value: cpp },
            { name: 'INSS/IRPF', value: inssPresumido + irpfPresumido }
        ],
        notes: ['Redução de base IRPJ/CSLL para serviços hospitalares.', 'ISS Variável (Regra Empresarial).']
    });

    // --- 4. Lucro Real ---
    const realMargin = (input.realProfitMargin ?? 30);
    const realProfitAmount = monthlyRevenue * (realMargin / 100);
    const pisReal = monthlyRevenue * 0.0165;
    const cofinsReal = monthlyRevenue * 0.0760;
    const irpjReal = (realProfitAmount * 0.15) + (realProfitAmount > 20000 ? (realProfitAmount - 20000) * 0.10 : 0);
    const csllReal = realProfitAmount * 0.09;
    const totalReal = pisReal + cofinsReal + irpjReal + csllReal + iss + cpp;

    results.push({
        name: 'Lucro Real (Estimado)',
        totalTax: totalReal + inssPresumido + irpfPresumido,
        effectiveRate: ((totalReal + inssPresumido + irpfPresumido) / monthlyRevenue) * 100,
        netProfit: monthlyRevenue - totalReal - payrollExpenses - proLaborePartners,
        proLabore: proLaboreMin,
        inssTax: inssPresumido,
        irpfTax: irpfPresumido,
        taxBreakdown: [
            { name: 'PIS/COFINS (Não-Cumulativo)', value: pisReal + cofinsReal },
            { name: 'IRPJ/CSLL (Real)', value: irpjReal + csllReal },
            { name: 'ISS', value: iss },
            { name: 'CPP', value: cpp },
            { name: 'INSS/IRPF', value: inssPresumido + irpfPresumido }
        ],
        notes: [`Considerando margem de lucro real de ${realMargin}%.`, 'PIS/COFINS Não-Cumulativo (9.25%).']
    });

    const sorted = results.sort((a, b) => a.totalTax - b.totalTax);

    if (sorted.length > 0) {
        sorted[0].isBest = true;
        sorted[sorted.length - 1].isWorst = true;
    }

    return sorted;
}
