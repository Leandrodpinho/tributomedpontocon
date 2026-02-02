import { LEGAL_CONSTANTS_2025 } from '@/ai/flows/legal-constants';

/**
 * Calcula o INSS a descontar do salário/pró-labore (Tabela Progressiva)
 */
export function calculateINSS(salary: number): number {
    // Teto do INSS
    if (salary > LEGAL_CONSTANTS_2025.inssCeiling) {
        return 908.85; // Teto fixo 2024/2025 aproximado (14% sobre teto progressivo)
        // Cálculo exato sobre o teto:
        // return calculateProgressiveINSS(LEGAL_CONSTANTS_2025.inssCeiling);
    }
    return calculateProgressiveINSS(salary);
}

function calculateProgressiveINSS(base: number): number {
    const table = LEGAL_CONSTANTS_2025.inssTable;

    // Cálculo simplificado usando dedução
    // Imposto = (Base * Alíquota) - Dedução
    const bracket = table.find(b => base <= b.limit) || table[table.length - 1];
    return (base * bracket.rate) - bracket.deduction;
}

/**
 * Calcula o IRPF Mensal (Tabela Progressiva)
 */
export function calculateIRRF(base: number, dependents: number = 0): number {
    const table = LEGAL_CONSTANTS_2025.irpfTable;

    // Dedução por dependente
    const dependentDeduction = dependents * LEGAL_CONSTANTS_2025.standardDeductionPerDependent;

    // Base de cálculo = Salário Bruto - INSS - Dependentes
    // Nota: O cálculo exato do IRRF depende do INSS pago.
    // Esta função assume que 'base' JÁ É a base de cálculo líquida de INSS

    if (base <= table[0].limit) return 0;

    const bracket = table.find(b => base <= b.limit) || table[table.length - 1];

    // Comparar desconto legal vs desconto simplificado
    const legalTax = (base * bracket.rate) - bracket.deduction - dependentDeduction;

    // Se o desconto simplificado for mais vantajoso (para quem ganha pouco acima da isenção), usa-se ele na declaração anual, 
    // mas na fonte (mensal) a regra é estrita. Vamos usar a regra padrão mensal.

    return Math.max(0, legalTax);
}

/**
 * Calcula o Custo da Folha para a Empresa (CPP)
 * No Simples (Anexo III) CPP está incluso. No Anexo V ou Lucro Presumido/Real, paga-se 20% patronal.
 */
export function calculateCPP(salary: number): number {
    return salary * 0.20; // 20% Patronal Básico
}

// ==========================================
// SERVIÇOS EXPERT: Fator R + Dividendos vs Pró-Labore
// ==========================================

/**
 * Fator R Optimizer
 * Encontra o valor MÍNIMO de Pró-Labore + Folha necessário para atingir 28% e ir para o Anexo III.
 * 
 * Fator R = (Folha 12 meses) / (Faturamento 12 meses) >= 28%
 * Se Fator R >= 28%, enquadra no Anexo III (alíquota inicial ~6%).
 * Se Fator R < 28%, vai para Anexo V (alíquota inicial ~15.5%).
 */
export interface FatorRInput {
    monthlyRevenue: number;
    currentPayroll: number; // Folha atual (todos sócios + funcionários)
}

export function optimizeFatorR(input: FatorRInput): {
    currentFatorR: number;
    isAnexoIII: boolean;
    minPayrollForAnexoIII: number;
    payrollGap: number;
    savings: { simplesV: number; simplesIII: number; potentialSavings: number };
} {
    const rbt12 = input.monthlyRevenue * 12;
    const payroll12 = input.currentPayroll * 12;

    const currentFatorR = (payroll12 / rbt12) * 100;
    const isAnexoIII = currentFatorR >= 28;

    // Folha mínima para atingir 28%
    const minPayroll12 = rbt12 * 0.28;
    const minPayrollMonthly = minPayroll12 / 12;
    const payrollGap = Math.max(0, minPayrollMonthly - input.currentPayroll);

    // Estimativa de economia (simplificada)
    // Anexo V (1a faixa): ~15.5% efetivo
    // Anexo III (1a faixa): ~6% efetivo
    const taxV = input.monthlyRevenue * 0.155;
    const taxIII = input.monthlyRevenue * 0.06;
    const potentialSavings = taxV - taxIII;

    return {
        currentFatorR: Math.round(currentFatorR * 100) / 100,
        isAnexoIII,
        minPayrollForAnexoIII: minPayrollMonthly,
        payrollGap,
        savings: { simplesV: taxV, simplesIII: taxIII, potentialSavings }
    };
}

/**
 * Dividendos vs Pró-Labore
 * Compara o custo total de retirar dinheiro como salário (Pró-Labore) vs Dividendos.
 * 
 * Pró-Labore: INSS (11-14%) + IRRF (até 27.5%) + CPP Patronal (20% se não Simples)
 * Dividendos: IR 0% (atualmente) - mas exige lucro contábil.
 * 
 * Trade-off: Dividendos são isentos, mas você não contribui para INSS (aposentadoria).
 * Estratégia comum: Pró-Labore mínimo (1 salário) + resto em Dividendos.
 */
export interface DividendVsSalaryInput {
    targetNetIncome: number; // Quanto o sócio quer líquido na mão
    isSimples: boolean; // Se Simples, não paga CPP patronal (já incluso)
    anexo: 'III' | 'IV' | 'V'; // Anexo IV paga CPP fora
}

export function compareDividendVsSalary(input: DividendVsSalaryInput): {
    allSalary: { gross: number; inss: number; irrf: number; cpp: number; totalCost: number; netInHand: number };
    allDividend: { gross: number; tax: number; totalCost: number; netInHand: number };
    hybrid: { salary: number; dividend: number; totalCost: number; netInHand: number };
    recommendation: 'ALL_SALARY' | 'ALL_DIVIDEND' | 'HYBRID';
    savings: number;
} {
    // 1. Tudo como Pró-Labore
    // Para receber X líquido, precisa de bruto maior (INSS + IRRF descontados)
    // Aproximação inversa: Bruto ~ Líquido / (1 - 0.27.5 - 0.14) ~ Líquido / 0.585
    const salaryGross = input.targetNetIncome / 0.60; // Aproximado
    const inss = calculateINSS(salaryGross);
    const irrf = calculateIRRF(salaryGross - inss);
    const cpp = (input.isSimples && input.anexo !== 'IV') ? 0 : calculateCPP(salaryGross);
    const salaryTotalCost = salaryGross + cpp;
    const salaryNet = salaryGross - inss - irrf;

    // 2. Tudo como Dividendos
    // Dividendos são isentos de IR para o sócio (2025). Custo = valor bruto.
    // Mas a empresa precisa ter lucro contábil para distribuir.
    const dividendGross = input.targetNetIncome; // 1:1 (isento)
    const dividendTotalCost = dividendGross; // Custo para empresa é o valor distribuído

    // 3. Híbrido: 1 salário mínimo como Pró-Labore + resto Dividendos
    const minSalary = 1412; // Salário mínimo 2024/2025
    const minInss = calculateINSS(minSalary);
    const minIrrf = 0; // Abaixo da faixa
    const minCpp = (input.isSimples && input.anexo !== 'IV') ? 0 : calculateCPP(minSalary);
    const dividendRest = input.targetNetIncome - (minSalary - minInss);
    const hybridTotalCost = minSalary + minCpp + dividendRest;

    // Comparação
    const costs = [
        { type: 'ALL_SALARY' as const, cost: salaryTotalCost },
        { type: 'ALL_DIVIDEND' as const, cost: dividendTotalCost },
        { type: 'HYBRID' as const, cost: hybridTotalCost }
    ];
    costs.sort((a, b) => a.cost - b.cost);
    const best = costs[0];
    const worst = costs[costs.length - 1];
    const savings = worst.cost - best.cost;

    return {
        allSalary: { gross: salaryGross, inss, irrf, cpp, totalCost: salaryTotalCost, netInHand: salaryNet },
        allDividend: { gross: dividendGross, tax: 0, totalCost: dividendTotalCost, netInHand: dividendGross },
        hybrid: { salary: minSalary, dividend: dividendRest, totalCost: hybridTotalCost, netInHand: input.targetNetIncome },
        recommendation: best.type,
        savings
    };
}
